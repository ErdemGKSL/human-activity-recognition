#!/usr/bin/env bash
# Bootstrap the toolchain in Claude Code on the web (fresh containers).
# Local sessions skip this: run `bun install` yourself once.
# DeckCraft is not installed here; see .claude/skills/deckcraft/SKILL.md.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
bun install >&2
