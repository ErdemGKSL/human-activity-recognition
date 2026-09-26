import type { DeckDirections } from "../types";
import { finalResults } from "./final-results";
import { literatureReview } from "./literature-review";
import { proposal } from "./proposal";

export { finalResults, literatureReview, proposal };

/** Every presenter guide, keyed by deck id. Add one per deck in `@pptx/decks`. */
export const directions: Record<string, DeckDirections> = Object.fromEntries(
  [proposal, literatureReview, finalResults].map((d) => [d.deckId, d]),
);

export function getDirections(deckId: string): DeckDirections {
  const found = directions[deckId];
  if (!found) {
    throw new Error(
      `No directions for deck "${deckId}". Available: ${Object.keys(directions).join(", ")}`,
    );
  }
  return found;
}
