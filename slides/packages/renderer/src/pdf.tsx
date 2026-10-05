import { CANVAS, type Deck, defaultTheme, extendTheme } from "@pptx/core";
import { renderSlide } from "@pptx/slides";
import { render } from "takumi-pdf";
import { loadFonts } from "./fonts";

/**
 * The whole deck as one PDF, one 1280×720 page per slide (each slide's final
 * state, since a PDF has no animation). takumi-pdf runs the same layout as the
 * SVG export, so pages match the PNG previews, and text stays selectable.
 * This is what gets uploaded when a course asks for "the presentation as PDF".
 */
export async function renderDeckPdf(deck: Deck): Promise<Uint8Array> {
  const theme = extendTheme(defaultTheme, deck.theme);
  const fonts = (await loadFonts()).map(({ name, data }) => ({ name, data }));
  const page = { width: CANVAS.width, height: CANVAS.height };
  return render(
    <div style={{ display: "flex", flexDirection: "column" }}>
      {deck.slides.map((slide, index) => (
        // A fixed-size page box: percentage sizes inside the slide resolve against it.
        <div
          key={slide.id}
          style={{ display: "flex", ...page, breakBefore: index > 0 ? "page" : "auto" }}
        >
          {renderSlide(slide, { deck, theme, index, total: deck.slides.length })}
        </div>
      ))}
    </div>,
    {
      size: page,
      margin: 0,
      fonts,
      lang: deck.lang,
      metadata: { title: deck.title, ...(deck.author ? { authors: [deck.author] } : {}) },
    },
  );
}
