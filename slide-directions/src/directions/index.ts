import type { DeckDirections } from "../types";
import { proposal } from "./proposal";

export { proposal };

/** Every presenter guide, keyed by deck id. Add one per deck in `deck/`. */
export const directions: Record<string, DeckDirections> = Object.fromEntries(
  [proposal].map((d) => [d.deckId, d]),
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
