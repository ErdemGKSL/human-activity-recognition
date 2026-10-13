import { type PdfOptions, renderPdf } from "@har/report/pdf";
import { DirectionsDocument, thumbnailSrc } from "./DirectionsDocument";
import type { DeckDirections, GuideDeck } from "./types";

export interface BuildOptions {
  /** PNG of every slide, in order (e.g. exported by DeckCraft). Omit for no thumbnails. */
  thumbnails?: Uint8Array[];
}

/**
 * Deck + directions → presenter-guide PDF bytes, rendered by takumi-pdf.
 * Thumbnails are plain PNG bytes from the slide exporter; the guide does not
 * draw the slides itself.
 */
export async function buildDirectionsPdf(
  deck: GuideDeck,
  directions: DeckDirections,
  options: BuildOptions = {},
): Promise<Uint8Array> {
  const thumbnails = options.thumbnails !== undefined;
  const images = (options.thumbnails ?? []).map((data, i) => ({ src: thumbnailSrc(i), data }));

  const pdf: PdfOptions = {
    title: `${deck.title} — Anlatıcı Rehberi`,
    footerLabel: `${deck.title} · Anlatıcı Rehberi`,
    lang: deck.lang,
    ...(images.length ? { images } : {}),
  };
  return renderPdf(
    <DirectionsDocument deck={deck} directions={directions} thumbnails={thumbnails} />,
    pdf,
  );
}
