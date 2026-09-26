---
name: pptx-morph
description: PowerPoint Morph in this repo — making the same object move, resize, recolor or re-rank between two consecutive slides via shared `morph` keys, camera push-in / zoom-into-detail, before→after comparisons, re-sorting bars, chaining morphs across several slides, and the limits (no off-canvas staging, no overlaps). Use whenever the user wants something to "grow", "move", "transform", "zoom into", "carry over to the next slide", "animate between slides" or compares two states of the same thing.
---

# Morph: the same object across slides

> **Scope: `slides/`** — this skill covers the PPTX pipeline in `slides/` only. Paths below
> are relative to `slides/`, and `bun run …` commands run from there. PDFs (`report/`,
> `slide-directions/`) are covered by [pdf-documents](../pdf-documents/SKILL.md).

Morph is a **slide transition**. PowerPoint looks at slide A and slide B, finds objects
that are "the same", and interpolates their position, size, rotation, and fill between
them. Objects that exist only on A fade out, and objects that exist only on B fade in.
Nothing is keyframed: **the difference between two still slides is the animation.**

When to use it rather than other motion: see [motion-design](../motion-design/SKILL.md).
The short version is to use Morph when the audience should read *"this is the same thing,
now changed"*.

## How pairing works here

1. Give the object the **same `morph` key** on two consecutive slides:
   - on a `stage` object: `{ id: "orb", …, morph: "orb" }`
   - in a layout: `<Animate id="hero" morph="hero-card" …>`
   A Morph always needs **two adjacent slides**, the "before" and the "after". If a request
   says "add a slide where X changes", you add a pair: a source slide and a destination
   slide, placed right after each other.
2. The renderer (`linkMorphs` in `packages/renderer/src/render.ts`) pairs every shared key
   between slide *N−1* and slide *N*:
   - It writes `morph: { from: <prev stem>, pairs: { key: { from: "anim-a", to: "anim-b" } } }`
     into the sidecar.
   - It forces the destination slide's transition to `morph`. **Omit `slide.transition`** to
     get the 1 s default. Set `slide.transition = { effect: "morph", duration: 1.2 }` only
     to change the timing (the recipes do this for large moves).
3. ppt-master names both shapes `!!<key>` (PowerPoint's forced-match convention) and
   verifies every pair at export. If a pair can't be resolved, export fails; it never falls
   back to guessing.

The block ids can differ between the two slides (`orb` → `big`). Only the **key** has to
match. Morph blocks exist even with `animate: false`.

## Which objects can morph

- **`stage` objects**: yes, via `morph`. This is the tool for Morph work.
- **Built-in layout blocks** (bar-chart bars, metric cards, …): only if the layout passes a
  `morph` prop to its `<Animate>`, and no built-in layout does today. You'd add it in the
  layout, for example `morph={`bar-${d.label}`}`. Until then, build Morph sequences with
  `stage` slides.
- The `stage` layout has **no footer and no page number** by design, because the whole
  canvas belongs to the objects. If a deck needs them, add them as stage objects or add a
  footer to `Stage.tsx`.

## Rules

- **Consecutive slides only.** A key on slides 3 and 5 does not pair. To chain A→B→C, put
  the key on all three. Each hop is its own Morph.
- **One object per key per slide.** A duplicate key on a slide throws.
- **The destination transition must be `morph`.** A deck-wide default like `fade` yields to
  Morph, but a slide that explicitly sets another transition throws
  (`morph pairs … need a morph transition`).
- **No overlaps within a slide**, the usual root-group rule. A big object on slide B must not
  overlap other objects *on slide B*. It may cover space that other objects used on slide A.
  To make room for a new object next to a full-frame one, shrink the paired object on the
  destination slide (for example `push-focus`: the Europe card is 780 px wide so a 300 px
  note fits). The Morph animates to whatever size you give it.
- Keep the **text inside the paired object** similar. Text is vector outlines here, so
  changed text cross-fades rather than morphing letter by letter, and that's usually fine
  (see the [re-sort recipe](references/recipes.md#re-sort-or-re-rank)).

## Recipes

Every recipe below is in [references/recipes.md](references/recipes.md), with coordinates
and verification:

| Want | Recipe | Live in `motion-showcase` |
|---|---|---|
| Object grows, moves, recolors | [Grow and move](references/recipes.md#grow-and-move) | `morph-start` → `morph-end` |
| Zoom into one item of a grid | [Camera push-in](references/recipes.md#camera-push-in) | `push-grid` → `push-focus` |
| Zoom back out to the grid | [Pull-out](references/recipes.md#pull-back-out) | `push-focus` → `pull-grid` |
| Bars re-rank and resize between periods | [Re-sort or re-rank](references/recipes.md#re-sort-or-re-rank) | `rank-before` → `rank-after` |
| Same element walks through several slides | [Chain](references/recipes.md#chain-across-several-slides) | — |
| Brand mark carries from cover to next slide | [Logo carry-over](references/recipes.md#logo-or-mark-carries-into-the-next-slide) | — |
| Before / after comparison | [Before-after](references/recipes.md#before-after-state) | — |

After the Morph lands, you can still build supporting blocks on the destination slide
with normal entrances, for example the detail card on `morph-end`. A paired object can
also be the `triggerShape` of a click-to-reveal (see `push-focus`).

**Don't give entrance animations to objects that Morph already brings in.** Unpaired
objects on the destination fade in during the Morph. An entrance would hide them until it
plays, so they'd appear, vanish, then appear again. Entrances are only for objects that
should arrive *after* the Morph has landed. See
[pptx-object-animations](../pptx-object-animations/SKILL.md).

## Limits

- **Off-canvas staging isn't supported yet.** ppt-master allows wholly off-canvas groups
  marked `data-pptx-morph-staging="true"` (for "slides in from outside"), but `snapBox`
  clamps bounds to the canvas and the stage layout doesn't mark staging. To support it,
  extend `normalize-svg.ts` and `geometry.ts`, and add a test.
- **Morph by word or character** (`morph_by: word|character`) is rejected with explicit
  pairs, and our text is outlines anyway.
- **Stacked in-place swaps** (the same spot, different object) aren't possible on one slide.
  Use two slides with Morph.

## Verify

```bash
bun run generate <deck>
bun run inspect output/<deck>.pptx --slide <destination>
#   transition: morph option=byObject 1.2s
#   morph: !!orb          ← must appear on BOTH slides
```

The PNG previews show the start and end frames. Motion is only visible in PowerPoint's
Slide Show. Troubleshooting is in
[animate-slides → verify](../animate-slides/references/verify-and-troubleshoot.md).
