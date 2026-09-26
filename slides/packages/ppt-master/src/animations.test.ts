import { expect, test } from "bun:test";
import { buildAnimationSidecar } from "./animations";

test("maps motion to ppt-master's sidecar schema", () => {
  const sidecar = buildAnimationSidecar([
    {
      stem: "01_cover",
      motion: {
        transition: { effect: "push", options: { direction: "up" }, autoAdvance: 3 },
        groups: {
          "anim-title": [
            { effect: "entrance_fly", options: { direction: "right" }, duration: 0.4 },
            { effect: "emphasis_teeter", trigger: "on-click" },
          ],
        },
      },
    },
    { stem: "02_empty", motion: { groups: {} } },
  ]);
  expect(sidecar).toEqual({
    version: 1,
    slides: {
      "01_cover": {
        transition: { effect: "push", effect_options: { direction: "up" }, auto_advance: 3 },
        groups: {
          "anim-title": {
            effects: [
              {
                effect: "entrance_fly",
                trigger: "after-previous",
                duration: 0.4,
                effect_options: { direction: "right" },
              },
              { effect: "emphasis_teeter", trigger: "on-click" },
            ],
          },
        },
      },
    },
  });
});

test("returns undefined when no slide has motion", () => {
  expect(buildAnimationSidecar([{ stem: "01", motion: { groups: {} } }])).toBeUndefined();
});

test("writes morph links, trigger shapes and timing modifiers", () => {
  const sidecar = buildAnimationSidecar([
    {
      stem: "02_b",
      motion: {
        transition: { effect: "morph", duration: 1.2 },
        morph: { from: "01_a", pairs: { orb: { from: "anim-orb", to: "anim-orb" } } },
        groups: {
          "anim-answer": [{ effect: "entrance_fade", triggerShape: "anim-question" }],
          "anim-badge": [
            {
              effect: "emphasis_grow_shrink",
              options: { size: 115 },
              autoReverse: true,
              repeatCount: 2,
              afterEffect: { type: "dim", color: "#94A3B8" },
            },
          ],
        },
      },
    },
  ]);
  expect(sidecar?.slides["02_b"]).toEqual({
    transition: { effect: "morph", duration: 1.2 },
    morph: { from: "01_a", pairs: { orb: { from: "anim-orb", to: "anim-orb" } } },
    groups: {
      // "On click of" rows default to on-click; ppt-master rejects other Starts.
      "anim-answer": {
        effects: [{ effect: "entrance_fade", trigger: "on-click", trigger_shape: "anim-question" }],
      },
      "anim-badge": {
        effects: [
          {
            effect: "emphasis_grow_shrink",
            trigger: "after-previous",
            effect_options: { size: 115 },
            repeat_count: 2,
            auto_reverse: true,
            after_effect: { type: "dim", color: "#94A3B8" },
          },
        ],
      },
    },
  });
});
