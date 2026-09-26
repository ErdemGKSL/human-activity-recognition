import type { Deck } from "@pptx/core";
import { finalResults } from "./decks/final-results";
import { literatureReview } from "./decks/literature-review";
import { proposal } from "./decks/proposal";

export { todoSlide } from "./skeleton";
export { finalResults, literatureReview, proposal };

/**
 * The project's real presentations, in delivery order, keyed by deck id.
 * Every deck here has a matching presenter guide in `slide-directions/`.
 */
export const decks: Record<string, Deck> = Object.fromEntries(
  [proposal, literatureReview, finalResults].map((deck) => [deck.id, deck]),
);

export function getDeck(id: string): Deck {
  const deck = decks[id];
  if (!deck) {
    throw new Error(`Unknown deck "${id}". Available: ${Object.keys(decks).join(", ")}`);
  }
  return deck;
}
