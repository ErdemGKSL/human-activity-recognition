import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { FontLoader } from "takumi-pdf";

/**
 * Takumi never reads system fonts, and a character no registered font covers
 * fails the render. Geist (the slides' font too) ships with the `geist` npm
 * package and covers Turkish (ç ğ ı İ ö ş ü), so every PDF registers it here.
 */
const GEIST = join(dirname(Bun.resolveSync("geist/package.json", import.meta.dir)), "dist/fonts");

export const FONT_FAMILY = "Geist";
export const MONO_FAMILY = "Geist Mono";

const FACES: Array<{ name: string; file: string; weight: number; style: "normal" | "italic" }> = [
  { name: FONT_FAMILY, file: "geist-sans/Geist-Regular.ttf", weight: 400, style: "normal" },
  { name: FONT_FAMILY, file: "geist-sans/Geist-Italic.ttf", weight: 400, style: "italic" },
  { name: FONT_FAMILY, file: "geist-sans/Geist-Medium.ttf", weight: 500, style: "normal" },
  { name: FONT_FAMILY, file: "geist-sans/Geist-SemiBold.ttf", weight: 600, style: "normal" },
  { name: FONT_FAMILY, file: "geist-sans/Geist-Bold.ttf", weight: 700, style: "normal" },
  { name: MONO_FAMILY, file: "geist-mono/GeistMono-Regular.ttf", weight: 400, style: "normal" },
];

let cached: Promise<FontLoader[]> | undefined;

/** Font faces for every PDF; read from disk once per process. */
export function loadFonts(): Promise<FontLoader[]> {
  cached ??= Promise.all(
    FACES.map(async ({ file, ...face }) => ({
      ...face,
      data: new Uint8Array(await readFile(join(GEIST, file))),
    })),
  );
  return cached;
}
