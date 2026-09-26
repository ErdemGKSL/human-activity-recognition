import { join } from "node:path";
import { CANVAS } from "@pptx/core";
import { assertToolchain, PPT_MASTER_SCRIPTS, PYTHON } from "./paths";

export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export class PptMasterError extends Error {
  override name = "PptMasterError";
  constructor(
    message: string,
    readonly result: RunResult,
  ) {
    super(message);
  }
}

async function runScript(script: string, args: string[]): Promise<RunResult> {
  assertToolchain();
  const proc = Bun.spawn([PYTHON, join(PPT_MASTER_SCRIPTS, script), ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { exitCode, stdout, stderr };
}

/**
 * Run ppt-master's final-stage SVG quality gate. `--json` persists the report
 * under `<workspace>/validation/`, which `--quick-generate` export requires.
 */
export async function checkQuality(workspace: string): Promise<RunResult> {
  const args = [workspace, "--quick-generate", "--canonical-authoring", "--stage", "final"];
  const format = ["--format", CANVAS.format];
  const result = await runScript("svg_quality_checker.py", [...args, ...format, "--json"]);
  if (result.exitCode !== 0) {
    // Re-run in human-readable mode so the error explains what failed.
    const readable = await runScript("svg_quality_checker.py", [...args, ...format]);
    throw new PptMasterError(
      `SVG quality gate failed for ${workspace}:\n${readable.stdout}${readable.stderr}`,
      result,
    );
  }
  return result;
}

/** Validate `<workspace>/animations.json` against the rendered SVG groups. */
export async function validateAnimations(workspace: string): Promise<RunResult> {
  const result = await runScript("animation_config.py", ["validate", workspace]);
  if (result.exitCode !== 0) {
    throw new PptMasterError(
      `animations.json validation failed for ${workspace}:\n${result.stdout}${result.stderr}`,
      result,
    );
  }
  return result;
}

export interface ExportOptions {
  /** Output .pptx path. */
  output: string;
  /** Embed notes from `<workspace>/notes/`. */
  notes: boolean;
}

/** Convert `<workspace>/svg_output/*.svg` into a native, editable PPTX. */
export async function exportPptx(workspace: string, options: ExportOptions): Promise<RunResult> {
  const args = [workspace, "--quick-generate", "-o", options.output];
  args.push(options.notes ? "--with-notes" : "--no-notes");
  // Multi-line <text> (one paragraph, soft-broken rows) becomes one text box
  // with a fixed width that PowerPoint re-wraps when the text is edited.
  args.push("--reflow-text");
  const result = await runScript("svg_to_pptx.py", args);
  if (result.exitCode !== 0) {
    throw new PptMasterError(
      `svg_to_pptx failed for ${workspace}:\n${result.stdout}${result.stderr}`,
      result,
    );
  }
  return result;
}
