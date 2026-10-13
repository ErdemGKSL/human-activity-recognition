/**
 * Deck data: the words and numbers that go on the slides. The PPTX is built
 * from this by `scripts/deckcraft.ts`; the presenter guide reads the same ids.
 * Layout-specific fields are typed loosely on purpose: each layout reads the
 * fields it knows and ignores the rest.
 */

export interface SlideSpec {
  id: string;
  /** One of the layouts understood by `scripts/deckcraft.ts`. */
  layout: string;
  title?: string;
  [field: string]: unknown;
}

export interface DeckSpec {
  /** Output folder name: `dist/<id>/`. */
  id: string;
  title: string;
  /** BCP 47 tag, used for sorting and hyphenation. */
  lang: string;
  transition?: { effect: string; duration: number };
  slides: SlideSpec[];
}

/** Identity helper that type-checks a deck literal. */
export function defineDeck(deck: DeckSpec): DeckSpec {
  return deck;
}
