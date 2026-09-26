import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** Walk up from this file to the monorepo root (the dir holding `vendor/`). */
function findRepoRoot(start: string): string {
  let dir = start;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, "vendor")) && existsSync(join(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  throw new Error(`Could not locate the repository root from ${start}`);
}

export const REPO_ROOT = findRepoRoot(import.meta.dir);

/** ppt-master skill scripts; override with PPT_MASTER_DIR (path to the repo checkout). */
export const PPT_MASTER_SCRIPTS = join(
  resolve(process.env.PPT_MASTER_DIR ?? join(REPO_ROOT, "vendor/ppt-master")),
  "skills/ppt-master/scripts",
);

/** Python interpreter; defaults to the uv-managed `.venv`. Override with PPT_MASTER_PYTHON. */
export const PYTHON =
  process.env.PPT_MASTER_PYTHON ??
  (process.platform === "win32"
    ? join(REPO_ROOT, ".venv/Scripts/python.exe")
    : join(REPO_ROOT, ".venv/bin/python"));

export function assertToolchain(): void {
  if (!existsSync(join(PPT_MASTER_SCRIPTS, "svg_to_pptx.py"))) {
    throw new Error(
      `ppt-master not found at ${PPT_MASTER_SCRIPTS}. Run \`bun run setup\` ` +
        "(or `git submodule update --init`).",
    );
  }
  if (!existsSync(PYTHON)) {
    throw new Error(`Python not found at ${PYTHON}. Run \`bun run setup\` (or \`uv sync\`).`);
  }
}
