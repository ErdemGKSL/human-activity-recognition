/**
 * Presenter guide data. Slides stay light (numbers, charts, few words); the
 * story, the meaning of every number and the extras live here, one entry per
 * slide, and are built into a PDF the presenter studies before the talk.
 */

/** What one number, chart or table on the slide means and how to say it. */
export interface DataNote {
  /** The thing on the slide, e.g. "%94.1 accuracy" or "Confusion matrix, 3. satır". */
  label: string;
  /** What it means and how to explain it to the audience. */
  meaning: string;
}

export interface LikelyQuestion {
  question: string;
  answer: string;
}

export interface SlideDirection {
  /** Speaking time for this slide, e.g. "45 sn" or "2 dk". */
  time?: string;
  /** One sentence: what the audience must take away from this slide. */
  goal?: string;
  /** Narrator script: paragraphs to tell (not to read word for word). */
  script?: string[];
  /** The numbers/visuals on the slide and what they mean. */
  data?: DataNote[];
  /** Fun facts and anecdotes to keep the talk lively. */
  funFacts?: string[];
  /** Delivery cues: where to point, when to pause, what to click. */
  tips?: string[];
  /** Bridge sentence into the next slide. */
  transition?: string;
  /** Questions the audience or instructor may ask, with prepared answers. */
  questions?: LikelyQuestion[];
}

export interface DeckDirections {
  /** Deck id in `@pptx/decks`; the guide is built to `output/<deckId>.pdf`. */
  deckId: string;
  /** Target talk length, e.g. "5–10 dakika". */
  duration: string;
  /** Presentation date(s). */
  date: string;
  /** Talk-wide guidance shown before the slides: audience, storyline, roles. */
  overview?: string[];
  /** Who presents which slides (slide id → presenter). */
  speakers?: Record<string, string>;
  /** One entry per slide id of the deck; a test keeps the two in sync. */
  slides: Record<string, SlideDirection>;
}

/** Identity helper that type-checks a directions literal. */
export function defineDirections(directions: DeckDirections): DeckDirections {
  return directions;
}
