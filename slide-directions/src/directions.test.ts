import { describe, expect, test } from "bun:test";
import { proposal as proposalDeck } from "../../deck/proposal";
import { buildDirectionsPdf } from "./build";
import { directions } from "./directions";

const decks = { [proposalDeck.id]: proposalDeck };

describe("slide directions", () => {
  test("every deck has a guide and every guide has a deck", () => {
    expect(Object.keys(directions).sort()).toEqual(Object.keys(decks).sort());
  });

  for (const deck of Object.values(decks)) {
    test(`${deck.id}: one entry per slide, no stale entries`, () => {
      const guide = directions[deck.id];
      expect(Object.keys(guide?.slides ?? {}).sort()).toEqual(deck.slides.map((s) => s.id).sort());
    });
  }

  test("builds a PDF without thumbnails", async () => {
    const guide = directions[proposalDeck.id];
    if (!guide) throw new Error("no guide for the proposal deck");
    const bytes = await buildDirectionsPdf(proposalDeck, guide);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  });
});
