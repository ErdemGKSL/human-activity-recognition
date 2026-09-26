---
name: animate-slides
description: Entry point for ANY motion work in the generated decks — routes to the right detailed skill (motion-design, pptx-object-animations, pptx-morph, pptx-transitions), explains the <Animate> block mechanism that every animation depends on, the deck-data vs layout decision, and the verify loop with `bun run inspect`. Use first whenever the user mentions animation, transitions, builds, reveals, Morph, "make it move", "more dynamic", presenter clicks, kiosk playback, or when motion fails to export.
---

# Motion in the generated decks: start here

> **Scope: `slides/`** — this skill covers the PPTX pipeline in `slides/` only. Paths below
> are relative to `slides/`, and `bun run …` commands run from there. PDFs (`report/`,
> `slide-directions/`) are covered by [pdf-documents](../pdf-documents/SKILL.md).

This skill is the map. Find your intent in the router, read the linked skill, then come
back here for the [mechanism](#the-animate-block-mechanism) and the
[verify loop](#verify-loop).

## Router: "I want…" → read this

| I want… | Read | Then maybe |
|---|---|---|
| To decide *whether* or *how much* to animate, or to review a deck's motion | [motion-design](../motion-design/SKILL.md) | [slide-type playbook](../motion-design/references/slide-type-playbook.md) |
| Bullets, cards or bars to appear one by one | [pptx-object-animations](../pptx-object-animations/SKILL.md) | [recipes → sequential list](../pptx-object-animations/references/recipes.md#sequential-list) |
| To pace a live talk: one click per point, previous points dimmed | [recipes → dim-after](../pptx-object-animations/references/recipes.md#presenter-paced-list-with-dim-after) | [modifiers](../pptx-object-animations/references/modifiers-and-triggers.md) |
| To highlight or pulse one number | [recipes → emphasis](../pptx-object-animations/references/recipes.md#emphasis-that-points) | |
| To reveal an answer when a specific object is clicked | [recipes → click to reveal](../pptx-object-animations/references/recipes.md#click-to-reveal) | |
| Something to appear, react, then disappear | [recipes → lifecycle](../pptx-object-animations/references/recipes.md#lifecycle-enter-emphasize-exit) | |
| An object to travel along a path | [recipes → motion path](../pptx-object-animations/references/recipes.md#motion-path) | |
| **The same object to grow, move or recolor across slides** | [pptx-morph](../pptx-morph/SKILL.md) | [grow and move](../pptx-morph/references/recipes.md#grow-and-move) |
| To zoom into one item of a grid, then back out | [pptx-morph → camera push-in](../pptx-morph/references/recipes.md#camera-push-in) | [pull back out](../pptx-morph/references/recipes.md#pull-back-out) |
| Bars to re-rank between periods | [pptx-morph → re-sort](../pptx-morph/references/recipes.md#re-sort-or-re-rank) | |
| To choose how slides change, or the section and finale feel | [pptx-transitions](../pptx-transitions/SKILL.md) | [catalog](../pptx-transitions/references/transition-catalog.md) |
| A kiosk or looping deck | [pptx-transitions → auto-advance](../pptx-transitions/SKILL.md#auto-advance-and-kiosks) | |
| The exact option values for an effect | [effect catalog](../pptx-object-animations/references/effect-catalog.md) | `.venv/bin/python vendor/ppt-master/skills/ppt-master/scripts/pptx_animations.py --describe <key>` |
| One step to play after *other* blocks (e.g. pulse after all cards) | [ordering rows across blocks](../pptx-object-animations/references/modifiers-and-triggers.md#ordering-rows-across-blocks) | [emphasis recipe](../pptx-object-animations/references/recipes.md#emphasis-that-points) |
| To fix a failing export, or motion that didn't show up | [verify-and-troubleshoot](references/verify-and-troubleshoot.md) | [ppt-master-export](../ppt-master-export/SKILL.md) |
| To understand why text can't be animated as text, or clip errors | [takumi-rendering](../takumi-rendering/SKILL.md) | |

A reference deck with every technique: `packages/mock-data/src/decks/motion-showcase.ts`.
Run `bun run generate motion-showcase`, then `bun run inspect output/motion-showcase.pptx`.

## The `<Animate>` block mechanism

Everything that moves, whether in-slide or through Morph, is an **`<Animate>` block**
(`packages/slides/src/components/Animate.tsx`):

```tsx
<Animate id="metric-0"                                  // unique per slide → group "anim-metric-0"
         animation={{ effect: "entrance_rise_up" }}     // optional layout default (step | step[] | "none")
         morph="kpi-revenue"                            // optional Morph key
         style={{ flexDirection: "column", padding: 24 }}>  {/* Animate IS the box */}
  …
</Animate>
```

1. Takumi's SVG has no element ids, so the renderer re-renders the slide once per block
   with that block hidden and diffs the result. That's how each block becomes its own
   `<g id="anim-<id>">`, with static content in `static-N` groups
   ([details](../takumi-rendering/references/svg-output-anatomy.md#pipeline-stages-packagesrenderersrc)).
2. `@pptx/ppt-master` writes `output/<deck>/animations.json` from the resolved motion, and
   ppt-master compiles it into native `p:timing` and `p:transition` elements.

**Rules**, each enforced with a clear error:

- Blocks don't nest, and ids are unique per slide.
- Ids avoid chrome tokens (`footer`, `header`, `rule`, `bg`, `logo`, `nav`, …), because
  ppt-master would silently treat those as static.
- A block must not overlap another block or static content (a ppt-master root-group rule).
  So there are no flip cards and no stacked objects.
- One block is one semantic unit: a whole card, a whole bar row, or a whole list item.

## Where to put motion

| Situation | Put it in |
|---|---|
| A layout's sensible default for every deck | `animation` on `<Animate>` in `packages/slides/src/layouts/*.tsx` |
| One deck or slide wants something different | `slide.animations[blockId]` (step, step[], or `"none"`) |
| Turning motion off | `animate: false` on the slide or deck (Morph blocks still pair) |
| Free-form objects (Morph demos, diagrams) | the `stage` layout with `objects[].animation` / `.morph` |
| Transitions | `deck.transition` / `slide.transition` |

Unknown ids in `slide.animations` and bad `triggerShape` references throw, and the error
lists the available block ids.

Built-in block ids: `stage` objects use their own `id`s, `title`/`subtitle` (cover),
`item-N` (agenda), `description` (section), `metric-N` (metrics), `bar-N` (bar-chart),
`row-N` (table), `quote`/`author` (quote), `contact` (closing).

## Verify loop

```bash
bun run check                                  # types reject unknown effect keys; tests
bun run generate <deck> --png                  # quality gate + sidecar validation + export read-back
bun run inspect output/<deck>.pptx --slide N   # what PowerPoint will actually play
```

The PNG previews show only the **final frame**. Motion itself can only be checked by
inspection, or by opening the file in PowerPoint's Slide Show. When something fails or
doesn't appear, see [references/verify-and-troubleshoot.md](references/verify-and-troubleshoot.md).
