import type {
  AnimationEffect,
  AnimationTrigger,
  TransitionEffect,
} from "./motion-presets.generated";

export * from "./motion-presets.generated";

/**
 * Motion model, mapped 1:1 onto ppt-master's `animations.json` sidecar
 * (vendor/ppt-master/skills/ppt-master/scripts/docs/pptx-animations.md §8).
 */

/** Effect-specific PowerPoint options, e.g. `{ direction: "right" }` for `entrance_fly`. */
export type EffectOptions = Record<string, string | number | boolean>;

/** One row in PowerPoint's Animation Pane for an animated block. */
export interface AnimationStep {
  effect: AnimationEffect;
  /** Start mode. Default: `after-previous`, so slides play without clicks. */
  trigger?: AnimationTrigger;
  /** Seconds. */
  duration?: number;
  /** Seconds added after the resolved start. */
  delay?: number;
  /** Page-wide order; ties keep paint order. */
  order?: number;
  /** See `pptx_animations.py --describe <effect>` for valid keys per effect. */
  options?: EffectOptions;
  /**
   * PowerPoint "On click of": another block id on the same slide that
   * triggers this step when clicked. Implies `trigger: "on-click"`.
   */
  triggerShape?: string;
  /** Play the effect N times (mutually exclusive with `repeatDuration`). */
  repeatCount?: number;
  /** Keep repeating for this many seconds. */
  repeatDuration?: number;
  /** Play backwards after each forward cycle (pulses, wobbles). */
  autoReverse?: boolean;
  /** Restore the pre-animation state when done. */
  rewind?: boolean;
  /** 0..1 share of the duration spent accelerating / decelerating (sum ≤ 1). */
  accelerate?: number;
  decelerate?: number;
  /** 0..1 bounce at the end (interpolated effects only; not with `decelerate`). */
  bounceEnd?: number;
  restart?: "always" | "when-not-active" | "never";
  /** What happens to the object after this step. `dim` recolors it (e.g. read agenda items). */
  afterEffect?: "none" | "hide" | "hide-on-next-click" | { type: "dim"; color: string };
}

/** A block's animation: one step, a lifecycle (enter → emphasize → exit), or `"none"`. */
export type BlockAnimation = AnimationStep | AnimationStep[] | "none";

export interface Transition {
  effect: TransitionEffect | "none";
  /** Seconds. */
  duration?: number;
  /** See `pptx_animations.py --describe-transition <effect>`. */
  options?: EffectOptions;
  /** Auto-advance to the next slide after this many seconds (click still works). */
  autoAdvance?: number;
}

export function toSteps(animation: BlockAnimation): AnimationStep[] {
  if (animation === "none") return [];
  return Array.isArray(animation) ? animation : [animation];
}

/**
 * Group-id tokens ppt-master's animation resolver treats as static page chrome
 * (pptx-animations.md §8). Animated block ids must avoid them.
 */
export const SLIDE_CHROME_TOKENS: readonly string[] = [
  "bg",
  "background",
  "header",
  "footer",
  "decor",
  "decoration",
  "decorations",
  "chrome",
  "nav",
  "watermark",
  "logo",
  "pagenumber",
  "pagenum",
  "slidenumber",
  "slidenum",
  "rule",
];
