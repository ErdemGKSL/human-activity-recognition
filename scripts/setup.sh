#!/usr/bin/env bash
# One-shot bootstrap: vendored ppt-master, JS workspaces, Python exporter env.
# Idempotent — safe to re-run after pulling.
set -euo pipefail

cd "$(dirname "$0")/.."

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "✗ '$1' is required: $2" >&2
    exit 1
  }
}
need git "https://git-scm.com"
need bun "curl -fsSL https://bun.sh/install | bash"
need uv "curl -LsSf https://astral.sh/uv/install.sh | sh"

echo "▸ ppt-master submodule (vendor/ppt-master)"
git submodule update --init --depth 1 vendor/ppt-master

echo "▸ JS workspaces (bun install)"
bun install

echo "▸ Python exporter env (uv sync → .venv)"
uv sync

echo "✓ Ready. Try: bun run generate"
