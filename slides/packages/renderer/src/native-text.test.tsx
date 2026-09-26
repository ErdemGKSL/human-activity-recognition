import { describe, expect, test } from "bun:test";
import { decks } from "@pptx/mock-data";
import { renderSvg } from "takumi-js";
import { fromJsx } from "takumi-js/helpers/jsx";
import { render as renderPdf } from "takumi-pdf";
import { FONT_FAMILY, loadFonts, postScriptName, snapWeight } from "./fonts";
import type { TakumiNode } from "./layers";
import { layoutText, snapFontWeights } from "./native-text";
import { normalizeSvg } from "./normalize-svg";
import { extractTextRuns } from "./pdf-text";
import { renderDeck } from "./render";

const SIZE = { width: 1280, height: 720 };

async function tree(el: React.ReactElement): Promise<TakumiNode> {
  return snapFontWeights(((await fromJsx(el)) as { node: TakumiNode }).node);
}

const box = { display: "flex", flexDirection: "column", fontFamily: FONT_FAMILY } as const;

describe("fonts", () => {
  test("Carlito faces report their PostScript names", async () => {
    const names = (await loadFonts()).map((f) => f.postScriptName);
    expect(names).toEqual([
      "Carlito-Regular",
      "Carlito-Bold",
      "Carlito-Italic",
      "Carlito-BoldItalic",
    ]);
  });

  test("weights snap to the faces that exist", () => {
    expect([300, 400, 500, 600, 700, 800, "bold", "normal"].map(snapWeight)).toEqual([
      400, 400, 400, 700, 700, 700, 700, 400,
    ]);
  });
});

describe("extractTextRuns (takumi-pdf reader)", () => {
  test("reads text, face, size, colour, opacity, spacing and baseline", async () => {
    const fonts = await loadFonts();
    const node = await tree(
      <div style={{ ...box, padding: 40, width: 1280, height: 720 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: "#2563EB" }}>Çalışma İğne ş</span>
        <span style={{ fontSize: 16, letterSpacing: 2, opacity: 0.5 }}>GİRDİ</span>
      </div>,
    );
    const pdf = await renderPdf(node as never, { viewport: SIZE, fonts, tagged: false });
    const [a, b] = extractTextRuns(pdf, SIZE);
    expect(a).toMatchObject({
      text: "Çalışma İğne ş",
      postScriptName: "Carlito-Bold",
      fontSize: 30,
      fill: "#2563EB",
      opacity: 1,
      x: 40,
    });
    expect(b?.text).toBe("GİRDİ");
    expect(b?.letterSpacing).toBeCloseTo(2, 1);
    expect(b?.opacity).toBeCloseTo(0.5, 2);
    expect(b?.baseline).toBeGreaterThan(a?.baseline ?? Infinity);
  });
});

describe("native text", () => {
  test("glyph outlines become <text>, wrapped lines one paragraph", async () => {
    const fonts = await loadFonts();
    const words = "Akıllı telefon sensörleriyle insan aktivitesi tanıma projesi";
    const node = await tree(
      <div style={{ ...box, padding: 72, width: 1280, height: 720, color: "#0F172A" }}>
        <span style={{ fontSize: 48, fontWeight: 700 }}>Başlık</span>
        <span style={{ fontSize: 24, width: 300, padding: "4px 10px" }}>{words}</span>
        <div style={{ display: "flex", width: 400, justifyContent: "center" }}>
          <span style={{ fontSize: 20, width: 200, textAlign: "center" }}>{words}</span>
        </div>
      </div>,
    );
    const raw = await renderSvg(node as never, {
      ...SIZE,
      fonts: fonts.map(({ name, data }) => ({ name, data })),
    });
    const svg = normalizeSvg(raw, {
      lang: "tr-TR",
      pageRole: "content",
      width: 1280,
      height: 720,
      text: await layoutText(node, fonts, SIZE),
    });

    expect(svg).not.toContain("<use");
    expect(svg).toContain('font-family="Calibri"');
    expect(svg).toContain('font-weight="bold"');
    expect(svg).toContain(">Başlık</text>");

    const paragraphs = [
      ...svg.matchAll(/<text[^>]*data-paragraph-line-height[^>]*>(.*?)<\/text>/g),
    ];
    expect(paragraphs).toHaveLength(2);
    const [left, centred] = paragraphs.map((m) => m[0]);
    // Rows join back into the original string; continuation rows are soft breaks.
    const rows = (s: string) => [...s.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((m) => m[1]);
    expect(rows(left ?? "").join(" ")).toBe(words);
    expect(left).toContain('data-paragraph-soft-break="1"');
    // The frame is the content box (padding removed) Takumi wrapped in.
    expect(left).toMatch(/data-pptx-frame="82 [\d.]+ 28[0-9](\.\d+)? /);
    expect(centred).toContain('text-anchor="middle"');
    // Temporary geometry attributes never reach the exporter.
    expect(svg).not.toMatch(/data-text-(width|left|estimate)/);
  });

  test("every mock deck exports with no glyph outlines left", async () => {
    for (const deck of Object.values(decks)) {
      for (const slide of await renderDeck(deck)) {
        expect(slide.svg).not.toContain("<use");
        expect(slide.svg).not.toContain("<g opacity");
      }
    }
  });
});
