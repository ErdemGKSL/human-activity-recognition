/**
 * Slide canvas. 1280×720 is ppt-master's `ppt169` format (16:9); the exporter
 * maps SVG user units to EMU from the root viewBox, so keep these in sync.
 */
export const CANVAS = {
  width: 1280,
  height: 720,
  /** ppt-master `--format` id for this canvas. */
  format: "ppt169",
} as const;

export type Canvas = typeof CANVAS;
