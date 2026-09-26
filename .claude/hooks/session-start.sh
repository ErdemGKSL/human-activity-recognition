#!/usr/bin/env bash
# Bootstrap the toolchain in Claude Code on the web (fresh containers).
# Local sessions skip this — run `bun run setup` yourself once.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
bash slides/scripts/setup.sh >&2
