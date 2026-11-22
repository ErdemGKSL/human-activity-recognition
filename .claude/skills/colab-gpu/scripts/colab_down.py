"""Download result files from a Colab runtime through its Jupyter contents API.

    CB=<connectionInfo.url> CT=<connectionInfo.token> \
      python3 -I colab_down.py [--glob '*.json'] REMOTE_DIR LOCAL_DIR

Lists /content/REMOTE_DIR (not recursive) and writes every file whose name matches
--glob (default *.json) into LOCAL_DIR. Files whose content is unchanged are left alone,
so running it on every poll only touches new or updated results. Example:
    python3 -I colab_down.py exp/results2/cv experiments/results2/cv

CB and CT come from list_runtimes (connectionInfo). They are read from the environment
only, never from arguments, so they stay out of shell history, the repo and the chat.
The token expires after about an hour; call list_runtimes again for a fresh one.
"""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


def get(base: str, token: str, remote: str) -> dict:
    # The kernel's working directory is /content, so the contents API path starts there.
    url = f"{base.rstrip('/')}/api/contents/content/{urllib.parse.quote(remote.strip('/'))}?content=1"
    req = urllib.request.Request(url, headers={"X-Colab-Runtime-Proxy-Token": token})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--glob", default="*.json", help="file name pattern to fetch")
    p.add_argument("remote_dir", help="directory under /content on the runtime")
    p.add_argument("local_dir", type=Path)
    a = p.parse_args()

    base, token = os.environ.get("CB"), os.environ.get("CT")
    if not base or not token:
        print("set CB (connectionInfo.url) and CT (connectionInfo.token)", file=sys.stderr)
        return 2

    try:
        listing = get(base, token, a.remote_dir)
    except urllib.error.HTTPError as e:
        print(f"FAIL listing {a.remote_dir}: HTTP {e.code}", file=sys.stderr)
        return 1
    names = sorted(
        x["name"]
        for x in listing.get("content") or []
        if x.get("type") == "file" and fnmatch.fnmatch(x["name"], a.glob)
    )

    a.local_dir.mkdir(parents=True, exist_ok=True)
    new = same = failed = 0
    for name in names:
        try:
            doc = get(base, token, f"{a.remote_dir.strip('/')}/{name}")
        except urllib.error.HTTPError as e:
            print(f"FAIL {name}: HTTP {e.code}", file=sys.stderr)
            failed += 1
            continue
        if doc.get("format") != "text":
            print(f"skip {name}: format {doc.get('format')} (only text is handled)", file=sys.stderr)
            failed += 1
            continue
        dest = a.local_dir / name
        text = doc["content"]
        if dest.exists() and dest.read_text(encoding="utf-8") == text:
            same += 1
            continue
        dest.write_text(text, encoding="utf-8")
        print(f"down {name}")
        new += 1
    print(f"{len(names)} matching, {new} written, {same} unchanged, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
