import type { Deck } from "@pptx/core";
import { motionShowcase } from "./decks/motion-showcase";
import { productLaunch } from "./decks/product-launch";
import { quarterlyReview } from "./decks/quarterly-review";

export { motionShowcase, productLaunch, quarterlyReview };

/** Registry of every mock deck, keyed by deck id. Add new decks here. */
export const decks: Record<string, Deck> = Object.fromEntries(
  [quarterlyReview, productLaunch, motionShowcase].map((deck) => [deck.id, deck]),
);

export function getDeck(id: string): Deck {
  const deck = decks[id];
  if (!deck) {
    throw new Error(`Unknown deck "${id}". Available: ${Object.keys(decks).join(", ")}`);
  }
  return deck;
}
