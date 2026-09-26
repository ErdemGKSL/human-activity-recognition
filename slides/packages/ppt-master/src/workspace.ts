import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildAnimationSidecar, type MotionPage } from "./animations";

export interface WorkspacePage extends MotionPage {
  stem: string;
  svg: string;
  notes?: string;
  png?: Uint8Array;
}

/**
 * Lay pages out the way ppt-master expects a project directory:
 *
 *   <dir>/svg_output/<stem>.svg   exporter input
 *   <dir>/notes/<stem>.md         optional speaker notes (matched by stem)
 *   <dir>/preview/<stem>.png      optional raster previews (not read by ppt-master)
 *   <dir>/animations.json         transitions + object animations (read by export)
 *
 * The directory is recreated so stale pages never leak into an export.
 */
export async function writeWorkspace(
  dir: string,
  pages: WorkspacePage[],
): Promise<{ hasNotes: boolean; hasMotion: boolean }> {
  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, "svg_output"), { recursive: true });

  const withNotes = pages.filter((p) => p.notes?.trim());
  const withPng = pages.filter((p) => p.png);
  if (withNotes.length > 0) await mkdir(join(dir, "notes"), { recursive: true });
  if (withPng.length > 0) await mkdir(join(dir, "preview"), { recursive: true });

  const sidecar = buildAnimationSidecar(pages);
  await Promise.all([
    sidecar
      ? writeFile(join(dir, "animations.json"), `${JSON.stringify(sidecar, null, 2)}\n`)
      : undefined,
    ...pages.map((p) => writeFile(join(dir, "svg_output", `${p.stem}.svg`), p.svg)),
    ...withNotes.map((p) => writeFile(join(dir, "notes", `${p.stem}.md`), `${p.notes?.trim()}\n`)),
    ...withPng.map((p) => writeFile(join(dir, "preview", `${p.stem}.png`), p.png as Uint8Array)),
  ]);

  return { hasNotes: withNotes.length > 0, hasMotion: sidecar !== undefined };
}
