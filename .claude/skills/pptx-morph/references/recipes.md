# Morph recipes

Back to [../SKILL.md](../SKILL.md). Coordinates are canvas pixels (1280×720) in the
`stage` layout. The title sits at about y 48–100 and the caption at y 660, so keep objects
roughly within y 130–640. Durations follow
[motion-design → timing](../../motion-design/SKILL.md#timing-seconds).

Contents: [Grow and move](#grow-and-move) · [Camera push-in](#camera-push-in) ·
[Pull back out](#pull-back-out) ·
[Re-sort or re-rank](#re-sort-or-re-rank) · [Chain](#chain-across-several-slides) ·
[Logo carry-over](#logo-or-mark-carries-into-the-next-slide) ·
[Before-after](#before-after-state) · [Designing good Morphs](#designing-good-morphs)

---

## Grow and move

A small object becomes the hero of the next slide.

```ts
{ id: "morph-start", layout: "stage", title: "…", objects: [
  { id: "orb", shape: "circle", x: 140, y: 300, width: 160, height: 160,
    fill: "primary", text: "Q3", fontSize: 36, morph: "orb" },
  { id: "hint", shape: "rounded", x: 360, y: 330, width: 560, height: 100, … ,
    animation: { effect: "entrance_fade", duration: 0.6 } },
]},
{ id: "morph-end", layout: "stage", title: "…",
  transition: { effect: "morph", duration: 1.2 },
  objects: [
  { id: "orb", shape: "circle", x: 720, y: 150, width: 440, height: 440,
    fill: "accent", text: "Q3 revenue $48.2M", fontSize: 44, morph: "orb" },
  { id: "detail", shape: "rounded", x: 80, y: 300, width: 560, height: 140, …,
    animation: { effect: "entrance_rise_up", duration: 0.5, delay: 0.2 } },
]},
```

- Position, size, and color interpolate together. The text cross-fades.
- Keep the **same title** on both slides so that it stays still (an identical static group),
  which keeps the eye on the orb.
- The destination builds one supporting block *after* the Morph. More than one or two
  competes with it.

## Camera push-in

The grid of options zooms into the one you're about to talk about.

```ts
// slide A: three cards, each with its own key
{ id: "north",  …, x: 80,  y: 220, width: 340, height: 260, morph: "card-north" },
{ id: "europe", …, x: 470, y: 220, width: 340, height: 260, morph: "card-europe" },
{ id: "apac",   …, x: 860, y: 220, width: 340, height: 260, morph: "card-apac" },
// slide B: only Europe, filling the frame
{ id: "europe", …, x: 80, y: 140, width: 1120, height: 480, fontSize: 56, morph: "card-europe" },
```

- Unpaired cards (`north`, `apac`) fade out automatically.
- To zoom back out, see [pull back out](#pull-back-out).
- A paired card can trigger a click-to-reveal note on the focus slide:
  `triggerShape: "europe"` (verified; `inspect` shows `on click of !!card-europe`).
- Give it more time (1–1.4 s) because the travel is large.

## Pull back out

This is the reverse of the push-in. Slide C repeats the grid using the **same keys** as
the grid slide. Only the key shared with the focus slide pairs, so that card shrinks back
into the grid while the others fade in.

```ts
{ id: "pull-grid", layout: "stage", title: "Camera pull-out", objects: [
  { id: "north",  …, x: 80,  y: 220, width: 340, height: 260, morph: "card-north" },
  { id: "europe", …, x: 470, y: 220, width: 340, height: 260, morph: "card-europe" },
  { id: "apac",   …, x: 860, y: 220, width: 340, height: 260, morph: "card-apac" },
]},
```

- **No entrance animations on the returning cards.** Morph already fades them in, and an
  entrance would hide them until it plays.
- Keys only need to match *adjacent* slides. `card-north` on `pull-grid` has no partner on
  `push-focus`, so it simply fades in.
- Reference: `motion-showcase` → `push-grid` → `push-focus` → `pull-grid`.

## Re-sort or re-rank

The same entities with new values and a new order. The audience watches the ranking change
instead of comparing two charts.

```ts
// Q2: Europe leads
{ id: "europe", shape: "rounded", x: 300, y: 180, width: 613, height: 100, fill: "accent",
  text: "Europe $16.0M", morph: "rank-europe" },
{ id: "north",  …, y: 330, width: 582, text: "North America $15.2M", morph: "rank-north" },
{ id: "apac",   …, y: 480, width: 233, text: "APAC $6.1M",           morph: "rank-apac" },
// Q3: North America overtakes (y positions swap, widths follow values)
{ id: "north",  …, y: 180, width: 820, text: "North America $21.4M", morph: "rank-north" },
{ id: "europe", …, y: 330, width: 532, text: "Europe $13.9M",        morph: "rank-europe" },
{ id: "apac",   …, y: 480, width: 329, text: "APAC $8.6M",           morph: "rank-apac" },
```

- Compute widths from the values on a **shared scale** (here `value / max * 820`) so that
  growth is honest.
- Colors are tied to the entity, not the rank, so the eye can track each bar.
- The labels are part of the bar object, so they travel with it. The numbers cross-fade,
  which reads as the value updating.
- Reference: `motion-showcase` → `rank-before` → `rank-after`. Inspect the destination slide
  (its `NN_` number) and look for three `!!rank-*` names.

## Chain across several slides

```ts
// slides 3, 4, 5 each have an object with morph: "hero"
// 3→4 pairs, 4→5 pairs; each destination gets its own morph transition
```

Use this for walkthroughs: a product card goes to a detail view, then to a pricing view.
Keep the object recognizable throughout (same color family, similar shape).

## Logo or mark carries into the next slide

Put a small brand mark or accent shape on the cover and on slide 2 with the same key, for
example large and centered on the cover, then small in a corner on slide 2. Built-in
layouts would need an `<Animate morph>` block around the mark. The cover's accent bar is
static today, so wrap it (in `Cover.tsx`) if you want this.

## Before-after state

Two slides show the same layout with changed values or colors: a status that turns from
red to green, or a progress bar that fills. Key every object that changes. Static context
(titles, labels) stays identical and doesn't need keys.

## Designing good Morphs

- **Change a few properties.** Size and position together read well. Size, position,
  color, *and* text all at once is a lot, so consider splitting it into two hops.
- **Keep shapes compatible.** Circle to circle, and rounded rectangle to rounded rectangle.
  Changing shape type (circle to rectangle) morphs less smoothly.
- **Mind the path.** Objects travel in a straight line from A to B. If paths cross a busy
  area, re-lay out slide B.
- **Every frame should work as a still.** The previews (`--png`) are the start and end
  frames. Both must make sense on their own.
