"""Upload local text files to a Colab runtime through its Jupyter contents API.

    CB=<connectionInfo.url> CT=<connectionInfo.token> \
      python3 -I colab_up.py [--root LOCAL_ROOT] REMOTE_DIR FILE [FILE ...]

Each FILE lands at /content/REMOTE_DIR/<FILE relative to LOCAL_ROOT> (default root: the
current directory), so `--root experiments exp experiments/har/data.py` writes
/content/exp/har/data.py. Parent directories must already exist on the runtime (create
them with os.makedirs in execute_code first): the contents API answers 404 otherwise.

CB and CT come from list_runtimes (connectionInfo). They are read from the environment
only, never from arguments, so they stay out of shell history, the repo and the chat.
The token expires after about an hour; call list_runtimes again for a fresh one.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


def endpoint(base: str, remote: str) -> str:
    # The kernel's working directory is /content, so the contents API path starts there.
    return f"{base.rstrip('/')}/api/contents/content/{urllib.parse.quote(remote.strip('/'))}"


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--root", default=".", help="local root the remote layout is relative to")
    p.add_argument("remote_dir", help="directory under /content on the runtime")
    p.add_argument("files", nargs="+", type=Path)
    a = p.parse_args()

    base, token = os.environ.get("CB"), os.environ.get("CT")
    if not base or not token:
        print("set CB (connectionInfo.url) and CT (connectionInfo.token)", file=sys.stderr)
        return 2

    root = Path(a.root).resolve()
    failed = 0
    for f in a.files:
        rel = f.resolve().relative_to(root).as_posix()
        remote = f"{a.remote_dir.strip('/')}/{rel}"
        try:
            text = f.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            # Binary upload (format "base64") is untested here, so refuse instead of guessing.
            print(f"skip {f}: not UTF-8 text", file=sys.stderr)
            failed += 1
            continue
        body = json.dumps({"type": "file", "format": "text", "content": text}).encode()
        req = urllib.request.Request(
            endpoint(base, remote),
            data=body,
            method="PUT",
            headers={"X-Colab-Runtime-Proxy-Token": token, "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                print(f"up {rel} -> /content/{remote} ({r.status}, {len(text)} chars)")
        except urllib.error.HTTPError as e:
            hint = " (parent dir missing? os.makedirs it first)" if e.code == 404 else ""
            hint = " (token expired? refresh via list_runtimes)" if e.code in (401, 403) else hint
            print(f"FAIL {rel}: HTTP {e.code}{hint}", file=sys.stderr)
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
