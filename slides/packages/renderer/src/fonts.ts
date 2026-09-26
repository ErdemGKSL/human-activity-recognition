import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Slide text exports as editable PowerPoint text (see `native-text.ts`), so
 * the font Takumi lays text out with must be one PowerPoint has everywhere.
 * Carlito is metric-compatible with Calibri (identical advance widths), which
 * ships with Office on Windows and macOS: we lay out and preview with
 * Carlito, and the PPTX names Calibri. Lines therefore break and fit in
 * PowerPoint exactly where they do in the previews, with nothing to install.
 *
 * Takumi's built-in Geist is not used for slides: a registered family with
 * its own name always wins, and Geist would need installing on every machine
 * that opens the deck.
 */
export const FONT_FAMILY = "Carlito";

/** Typeface written into the PPTX for text laid out with `FONT_FAMILY`. */
export const POWERPOINT_TYPEFACE = "Calibri";

export interface FontFace {
  name: string;
  data: Uint8Array;
  /** PostScript name from the font's `name` table (what takumi-pdf writes as BaseFont). */
  postScriptName: string;
  bold: boolean;
  italic: boolean;
}

const DIR = dirname(Bun.resolveSync("@expo-google-fonts/carlito/package.json", import.meta.dir));

// Carlito has exactly these four faces, like Calibri's regular/bold/italic set.
// Layouts may ask for other weights; `snapFontWeights` maps them onto these so
// Takumi never synthesizes a weight (it draws fake bold as stroked outlines).
const FILES = [
  { file: "400Regular/Carlito_400Regular.ttf", bold: false, italic: false },
  { file: "700Bold/Carlito_700Bold.ttf", bold: true, italic: false },
  { file: "400Regular_Italic/Carlito_400Regular_Italic.ttf", bold: false, italic: true },
  { file: "700Bold_Italic/Carlito_700Bold_Italic.ttf", bold: true, italic: true },
];

let cached: Promise<FontFace[]> | undefined;

/** Font faces for every Takumi render (SVG, PNG, PDF, measure); read once per process. */
export function loadFonts(): Promise<FontFace[]> {
  cached ??= Promise.all(
    FILES.map(async ({ file, bold, italic }) => {
      const data = new Uint8Array(await readFile(join(DIR, file)));
      return { name: FONT_FAMILY, data, postScriptName: postScriptName(data), bold, italic };
    }),
  );
  return cached;
}

/** CSS weights the faces above can draw without synthesis. */
export function snapWeight(weight: unknown): 400 | 700 {
  const n = typeof weight === "number" ? weight : weight === "bold" ? 700 : Number(weight);
  return Number.isFinite(n) && n >= 600 ? 700 : 400;
}

/** Name ID 6 (PostScript name) from an OpenType/TrueType `name` table. */
export function postScriptName(font: Uint8Array): string {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tables = view.getUint16(4);
  for (let i = 0; i < tables; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(...font.subarray(rec, rec + 4));
    if (tag !== "name") continue;
    const base = view.getUint32(rec + 8);
    const count = view.getUint16(base + 2);
    const strings = base + view.getUint16(base + 4);
    for (let r = 0; r < count; r++) {
      const at = base + 6 + r * 12;
      const platform = view.getUint16(at);
      const nameId = view.getUint16(at + 6);
      if (nameId !== 6) continue;
      const length = view.getUint16(at + 8);
      const offset = strings + view.getUint16(at + 10);
      const bytes = font.subarray(offset, offset + length);
      // Windows (3) and Unicode (0) records are UTF-16BE; Mac (1) is Roman.
      if (platform === 1) return String.fromCharCode(...bytes);
      let s = "";
      for (let k = 0; k + 1 < bytes.length; k += 2) {
        s += String.fromCharCode(((bytes[k] as number) << 8) | (bytes[k + 1] as number));
      }
      return s;
    }
  }
  throw new Error("font has no PostScript name (name ID 6)");
}
