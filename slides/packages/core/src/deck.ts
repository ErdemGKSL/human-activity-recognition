import type { BlockAnimation, Transition } from "./motion";
import type { ThemePatch } from "./theme";

/**
 * Deck data model. A deck is pure data: every slide picks a `layout` and
 * carries only the fields that layout needs. Layout components live in
 * @pptx/slides and are looked up by `layout`.
 */

interface SlideBase {
  /** Stable id; becomes the SVG / notes file stem (e.g. `03_revenue`). */
  id: string;
  /** Speaker notes (plain Markdown), exported as PowerPoint notes. */
  notes?: string;
  /** Page transition into this slide; overrides `deck.transition`. */
  transition?: Transition;
  /** `false` renders this slide without object animations. Default: `deck.animate`. */
  animate?: boolean;
  /**
   * Per-block overrides of the layout's default animations, keyed by the
   * `<Animate id>` the layout uses (e.g. `metric-0`, `item-2`, `contact`).
   */
  animations?: Record<string, BlockAnimation>;
}

export interface CoverSlide extends SlideBase {
  layout: "cover";
  title: string;
  subtitle?: string;
  presenter?: string;
  date?: string;
}

export interface AgendaSlide extends SlideBase {
  layout: "agenda";
  title: string;
  items: string[];
}

export interface SectionSlide extends SlideBase {
  layout: "section";
  eyebrow?: string;
  title: string;
  description?: string;
}

/** Whether a change is good or bad news — drives color, independent of direction. */
export type Tone = "positive" | "negative" | "neutral";

export interface Metric {
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
}

export interface MetricsSlide extends SlideBase {
  layout: "metrics";
  title: string;
  metrics: Metric[];
}

export interface BarDatum {
  label: string;
  value: number;
}

export interface BarChartSlide extends SlideBase {
  layout: "bar-chart";
  title: string;
  caption?: string;
  /** Suffix/prefix hint for value labels, e.g. "$M" or "%". */
  unit?: string;
  data: BarDatum[];
}

export interface TableSlide extends SlideBase {
  layout: "table";
  title: string;
  columns: string[];
  rows: string[][];
}

export interface QuoteSlide extends SlideBase {
  layout: "quote";
  quote: string;
  author: string;
  role?: string;
}

/** Theme color token or an explicit `#RRGGBB`. */
export type ColorRef =
  | "background"
  | "surface"
  | "surfaceMuted"
  | "text"
  | "textMuted"
  | "primary"
  | "primaryContrast"
  | "accent"
  | "positive"
  | "negative"
  | "border"
  | `#${string}`;

/**
 * A freely positioned object on a `stage` slide, in canvas pixels (1280×720).
 * Objects on one slide must not overlap (ppt-master root-group rule).
 */
export interface StageObject {
  /** Block id, unique per slide; key for `slide.animations` and `triggerShape`. */
  id: string;
  shape: "rect" | "rounded" | "circle" | "pill";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: ColorRef;
  text?: string;
  textColor?: ColorRef;
  fontSize?: number;
  /**
   * Morph identity. The same key on consecutive slides pairs the objects and
   * makes the destination slide transition with Morph, so PowerPoint animates
   * position, size and color between them.
   */
  morph?: string;
  animation?: BlockAnimation;
}

export interface StageSlide extends SlideBase {
  layout: "stage";
  title?: string;
  caption?: string;
  objects: StageObject[];
}

export interface ClosingSlide extends SlideBase {
  layout: "closing";
  title: string;
  subtitle?: string;
  contact?: string;
}

export type Slide =
  | CoverSlide
  | AgendaSlide
  | SectionSlide
  | MetricsSlide
  | BarChartSlide
  | TableSlide
  | QuoteSlide
  | StageSlide
  | ClosingSlide;

export type SlideLayout = Slide["layout"];

export type SlideOf<L extends SlideLayout> = Extract<Slide, { layout: L }>;

export interface Deck {
  /** Kebab-case id; used as the output folder / file name. */
  id: string;
  title: string;
  /** BCP-47 tag; written to the root <svg lang> and PPTX proofing language. */
  lang: string;
  author?: string;
  theme?: ThemePatch;
  /** Default page transition for every slide. Omitted: ppt-master's default (fade, 0.4s). */
  transition?: Transition;
  /** Object animations declared by layouts via `<Animate>`. Default: `true`. */
  animate?: boolean;
  slides: Slide[];
}

/**
 * ppt-master flat-structure page role for each layout
 * (`cover` / `toc` / `section` / `content` / `ending`).
 */
export type PageRole = "cover" | "toc" | "section" | "content" | "ending";

export const PAGE_ROLE: Record<SlideLayout, PageRole> = {
  cover: "cover",
  agenda: "toc",
  section: "section",
  metrics: "content",
  "bar-chart": "content",
  table: "content",
  quote: "content",
  stage: "content",
  closing: "ending",
};

/** Zero-padded file stem for slide `index` (0-based): `01_cover`. */
export function slideStem(slide: Slide, index: number): string {
  return `${String(index + 1).padStart(2, "0")}_${slide.id}`;
}

/** Identity helper that gives deck literals full type-checking. */
export function defineDeck(deck: Deck): Deck {
  return deck;
}
