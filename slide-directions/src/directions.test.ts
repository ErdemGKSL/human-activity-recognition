import { describe, expect, test } from "bun:test";
import { decks } from "@pptx/decks";
import { buildDirectionsPdf } from "./build";
import { directions } from "./directions";

describe("slide directions", () => {
  test("every project deck has a guide and every guide has a deck", () => {
    expect(Object.keys(directions).sort()).toEqual(Object.keys(decks).sort());
  });

  for (const deck of Object.values(decks)) {
    test(`${deck.id}: one entry per slide, no stale entries`, () => {
      const guide = directions[deck.id];
      expect(Object.keys(guide?.slides ?? {}).sort()).toEqual(deck.slides.map((s) => s.id).sort());
    });
  }

  test("builds a PDF (no thumbnails)", async () => {
    const deck = Object.values(decks)[0];
    const guide = deck && directions[deck.id];
    if (!deck || !guide) throw new Error("no decks");
    const bytes = await buildDirectionsPdf(deck, guide, { thumbnails: false });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  });
});
