#!/usr/bin/env bash
# One-shot bootstrap: vendored ppt-master, JS workspaces, Python exporter env.
# Idempotent — safe to re-run after pulling.
set -euo pipefail

SLIDES="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$SLIDES/.." && pwd)"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "✗ '$1' is required: $2" >&2
    exit 1
  }
}
need git "https://git-scm.com"
need bun "curl -fsSL https://bun.sh/install | bash"
need uv "curl -LsSf https://astral.sh/uv/install.sh | sh"

echo "▸ ppt-master submodule (slides/vendor/ppt-master)"
git -C "$ROOT" submodule update --init --depth 1 slides/vendor/ppt-master

# One bun workspace spans slides/, report/ and slide-directions/.
echo "▸ JS workspaces (bun install at repo root)"
(cd "$ROOT" && bun install)

echo "▸ Python exporter env (uv sync → slides/.venv)"
(cd "$SLIDES" && uv sync)

echo "✓ Ready. Try: bun run slides  (or: cd slides && bun run generate)"
