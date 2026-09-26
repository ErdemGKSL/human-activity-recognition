import type { AnimationStep, Transition } from "@pptx/core";

/**
 * Builds ppt-master's `animations.json` sidecar
 * (vendor/ppt-master/skills/ppt-master/scripts/docs/pptx-animations.md §8).
 * Slide keys are SVG stems; group keys are top-level `<g id>`s.
 */

export interface MotionPage {
  stem: string;
  motion: {
    transition?: Transition;
    /** `triggerShape` must already be a group id. */
    groups: Record<string, AnimationStep[]>;
    morph?: { from: string; pairs: Record<string, { from: string; to: string }> };
  };
}

interface SidecarRow {
  effect: string;
  trigger: string;
  duration?: number;
  delay?: number;
  order?: number;
  effect_options?: Record<string, string | number | boolean>;
  trigger_shape?: string;
  repeat_count?: number;
  repeat_duration?: number;
  auto_reverse?: boolean;
  rewind?: boolean;
  accelerate?: number;
  decelerate?: number;
  bounce_end?: number;
  restart?: string;
  after_effect?: string | { type: string; color: string };
}

interface SidecarTransition {
  effect: string;
  duration?: number;
  effect_options?: Record<string, string | number | boolean>;
  auto_advance?: number;
}

export interface AnimationSidecar {
  version: 1;
  slides: Record<
    string,
    {
      transition?: SidecarTransition;
      groups?: Record<string, { effects: SidecarRow[] }>;
      morph?: { from: string; pairs: Record<string, { from: string; to: string }> };
    }
  >;
}

/** Default Start mode: rows chain after each other so slides play without clicks. */
const DEFAULT_TRIGGER = "after-previous";

/** Returns undefined when no slide carries motion (so no sidecar is written). */
export function buildAnimationSidecar(pages: MotionPage[]): AnimationSidecar | undefined {
  const slides: AnimationSidecar["slides"] = {};
  for (const { stem, motion } of pages) {
    const entry: AnimationSidecar["slides"][string] = {};
    if (motion.transition) entry.transition = toTransition(motion.transition);
    const groups = Object.entries(motion.groups);
    if (groups.length > 0) {
      entry.groups = Object.fromEntries(
        groups.map(([id, steps]) => [id, { effects: steps.map(toRow) }]),
      );
    }
    if (motion.morph) entry.morph = motion.morph;
    if (entry.transition || entry.groups || entry.morph) slides[stem] = entry;
  }
  return Object.keys(slides).length > 0 ? { version: 1, slides } : undefined;
}

function toRow(step: AnimationStep): SidecarRow {
  return prune({
    effect: step.effect,
    // "On click of" rows must be on-click; ppt-master rejects any other Start.
    trigger: step.trigger ?? (step.triggerShape ? "on-click" : DEFAULT_TRIGGER),
    duration: step.duration,
    delay: step.delay,
    order: step.order,
    effect_options: step.options,
    trigger_shape: step.triggerShape,
    repeat_count: step.repeatCount,
    repeat_duration: step.repeatDuration,
    auto_reverse: step.autoReverse,
    rewind: step.rewind,
    accelerate: step.accelerate,
    decelerate: step.decelerate,
    bounce_end: step.bounceEnd,
    restart: step.restart,
    after_effect: step.afterEffect,
  });
}

function toTransition(t: Transition): SidecarTransition {
  return prune({
    effect: t.effect,
    duration: t.duration,
    effect_options: t.options,
    auto_advance: t.autoAdvance,
  });
}

function prune<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}
