import { type PdfOptions, renderPdf } from "@har/report/pdf";
import type { Deck } from "@pptx/core";
import { renderDeck } from "@pptx/renderer";
import { DirectionsDocument, thumbnailSrc } from "./DirectionsDocument";
import type { DeckDirections } from "./types";

export interface BuildOptions {
  /** Embed a PNG of every slide next to its script. Default `true`. */
  thumbnails?: boolean;
}

/**
 * Deck + directions → presenter-guide PDF bytes. Thumbnails come straight from
 * the slide renderer (raw Takumi PNGs, no ppt-master/Python), so the guide
 * always shows the current slides.
 */
export async function buildDirectionsPdf(
  deck: Deck,
  directions: DeckDirections,
  options: BuildOptions = {},
): Promise<Uint8Array> {
  const thumbnails = options.thumbnails ?? true;
  const images = thumbnails
    ? (await renderDeck(deck, { raw: true, png: true })).flatMap((page, i) =>
        page.png ? [{ src: thumbnailSrc(i), data: page.png }] : [],
      )
    : undefined;

  const pdf: PdfOptions = {
    title: `${deck.title} — Anlatıcı Rehberi`,
    footerLabel: `${deck.title} · Anlatıcı Rehberi`,
    lang: deck.lang,
    ...(images ? { images } : {}),
  };
  return renderPdf(
    <DirectionsDocument deck={deck} directions={directions} thumbnails={thumbnails} />,
    pdf,
  );
}
