import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Takumi's built-in Geist is a Latin subset: it has ç ö ü ı İ but draws `ş`
 * and `ğ` as tofu, which breaks every Turkish deck. We register the full
 * static Geist faces from the `geist` npm package under their own family name,
 * because a registered face named "Geist" loses to the built-in one at the
 * same weight. `defaultTheme.font.family` points at this name.
 */
export const FONT_FAMILY = "Geist Sans";

const DIR = join(dirname(Bun.resolveSync("geist/package.json", import.meta.dir)), "dist/fonts");
// Weight comes from each file (Light 300 … Black 800), matching the old 300–800 range.
const FILES = ["Light", "Regular", "Medium", "SemiBold", "Bold", "Black"].map(
  (w) => `geist-sans/Geist-${w}.ttf`,
);

let cached: Promise<Array<{ name: string; data: Uint8Array }>> | undefined;

/** Font faces for every Takumi render; read once per process (Takumi dedupes registration). */
export function loadFonts() {
  cached ??= Promise.all(
    FILES.map(async (file) => ({
      name: FONT_FAMILY,
      data: new Uint8Array(await readFile(join(DIR, file))),
    })),
  );
  return cached;
}
