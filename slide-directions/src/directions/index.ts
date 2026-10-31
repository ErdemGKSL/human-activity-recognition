import type { DeckDirections } from "../types";
import { proposal } from "./proposal";

export { proposal };

/** Every presenter guide, keyed by deck id. Add one per deck in `deck/`. */
export const directions: Record<string, DeckDirections> = Object.fromEntries(
  [proposal].map((d) => [d.deckId, d]),
);

/** The presenter guide for a deck, or undefined when the deck has none. */
export function findDirections(deckId: string): DeckDirections | undefined {
  return directions[deckId];
}
