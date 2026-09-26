# Object animation recipes

Back to [../SKILL.md](../SKILL.md). Every recipe here exports and validates. The
**Reference** line names a real slide by `deck → slide id`. Its files are named
`NN_<id>`, and `NN` is the number to pass to
`bun run inspect output/<deck>.pptx --slide NN`. Timing guidance is in
[motion-design](../../motion-design/SKILL.md#timing-seconds).

Contents: [Sequential list](#sequential-list) ·
[Presenter-paced list with dim-after](#presenter-paced-list-with-dim-after) ·
[KPI cards](#kpi-cards) · [Chart that grows](#chart-that-grows) ·
[Emphasis that points](#emphasis-that-points) ·
[Looping attention](#looping-attention-kiosk-or-demo) ·
[Lifecycle](#lifecycle-enter-emphasize-exit) · [Click to reveal](#click-to-reveal) ·
[Motion path](#motion-path) · [Two things move together](#two-things-move-together)

---

## Sequential list

Items appear one after another without clicks, all from the same side.

```tsx
// Agenda.tsx (layout default)
<Animate id={`item-${i}`}
  animation={{ effect: "entrance_fly", options: { direction: "right" }, duration: 0.4 }}
  style={{ alignItems: "center", gap: theme.space.gap }}>
```

- Put one block per item. The number badge and the text belong to the same block.
- `direction: "right"` travels left to right, which PowerPoint calls "From Left".
- Reference: `quarterly-review` → `agenda`.

## Presenter-paced list with dim-after

Each click brings in the next point, and the previous one fades to a muted color so
attention stays on the current point.

```ts
// deck data override on an agenda slide
animations: Object.fromEntries([0, 1, 2, 3, 4].map((i) => [`item-${i}`, {
  effect: "entrance_fly", options: { direction: "right" }, duration: 0.4,
  trigger: "on-click",
  afterEffect: { type: "dim", color: "#94A3B8" },
}])),
```

- The dim is applied **when the next animation starts**, so the last item stays bright.
- Pick a dim color close to `theme.colors.textMuted` so it reads as "done", not "disabled".
- Reference: `motion-showcase` → `recap`.

## KPI cards

Cards rise in order. The headline metric can lead.

```tsx
<Animate id={`metric-${i}`} animation={{ effect: "entrance_rise_up", duration: 0.5 }}
  style={{ flexDirection: "column", flex: 1, padding: …, borderRadius: theme.radius }}>
```

- The **whole card** is the block: background, label, value, and delta.
- Paint order already makes the first card lead. To lead with a **non-first** card, give
  its step `order: 1` and every other card's step `order: 2`. That's the
  [every-row rule](modifiers-and-triggers.md#ordering-rows-across-blocks): leaving the
  others unordered doesn't reliably move them after it.
- If only one card should move, override the others to `"none"`.
- Presenter-paced cards followed by a pulse: see
  [emphasis that points](#emphasis-that-points) (`quarterly-review` → `highlights`).
- Reference (layout default, auto-play): `product-launch` → `beta-results`.

## Chart that grows

Bars read as data arriving when they wipe in along their axis.

```tsx
<Animate id={`bar-${i}`}
  animation={{ effect: "entrance_wipe", options: { direction: "right" }, duration: 0.5 }}
  style={{ alignItems: "center", gap: theme.space.gap }}>   {/* label + bar + value */}
```

- Vertical bars use `direction: "up"`.
- Presenter-paced storytelling: override each bar with `trigger: "on-click"`, and set bars
  that don't matter to `"none"`. Reference: `product-launch` → `channel-mix`.
- If the *same bars change value between periods*, use Morph instead:
  [pptx-morph → re-sort](../../pptx-morph/references/recipes.md#re-sort-or-re-rank).

## Emphasis that points

Use one pulse on the slide's point, **after everything else has built**.

By default rows play in paint order, and a block's own steps play together. So putting
the pulse as step 2 of `metric-0` fires it straight after metric-0's entrance, *before*
metric-1 to metric-3 appear. To make it wait, put an explicit `order` on **every** row of
the slide: all entrances get `order: 1`, and the pulse gets `order: 2`.

```ts
// quarterly-review → highlights: each card on click, then Revenue pulses once
animations: {
  "metric-0": [
    { effect: "entrance_rise_up", duration: 0.5, trigger: "on-click", order: 1 },
    { effect: "emphasis_grow_shrink", options: { size: 110 }, duration: 0.4,
      autoReverse: true, delay: 0.3, order: 2 },            // after-previous → plays after the last card
  ],
  ...Object.fromEntries([1, 2, 3].map((i) => [`metric-${i}`,
    { effect: "entrance_rise_up", duration: 0.5, trigger: "on-click", order: 1 }])),
},
```

`inspect` confirms it: four `on-click entrance_rise_up` rows, then
`after-previous emphasis_grow_shrink → anim-metric-0 dur=0.4s delay=0.3s auto_reverse=yes`.
Reference: `quarterly-review` → `highlights`. For auto-play, drop the
`trigger: "on-click"`s and keep the orders.

- `size` is a percentage. 105–115 reads as a pulse, while 150 and above reads as a jump.
- `autoReverse: true` returns the object to its size. Without it the object stays scaled.
- `emphasis_teeter` means "look here / careful", and `emphasis_transparency` fades things
  down (the inverse of pointing).

## Looping attention (kiosk or demo)

```ts
{ effect: "emphasis_spin", options: { amount: 360 }, duration: 1.2, repeatCount: 2 }
{ effect: "emphasis_teeter", duration: 0.5, repeatCount: 2 }
```

- Keep `repeatCount` at 3 or fewer for anything shown to people who are reading. Use
  `repeatDuration` (seconds) for "keep moving while the slide is up" on kiosks.
- Reference: `motion-showcase` → `paths-emphasis`.

## Lifecycle (enter, emphasize, exit)

One object goes through states, and then the next object takes over. This is good for
process and status stories.

```ts
{ id: "saving", …, animation: [
  { effect: "entrance_fly", options: { direction: "up" }, duration: 0.5 },
  { effect: "emphasis_teeter", duration: 0.6 },
  { effect: "exit_fade", duration: 0.4, delay: 0.8 },
]},
{ id: "saved", …, animation: { effect: "entrance_zoom", duration: 0.4, bounceEnd: 0.3 } },
```

- The steps run in array order. Blocks that come later in paint order follow automatically.
- The two objects still need **separate, non-overlapping positions**, because ppt-master
  forbids overlapping root groups. "Replace in place" isn't possible, so stack the states
  vertically. Alternatively, use Morph across two slides for a true in-place change
  ([pptx-morph](../../pptx-morph/SKILL.md)).
- Reference: `motion-showcase` → `lifecycle`.

## Click to reveal

Clicking object A (the question) reveals object B (the answer). Other clicks don't.

```ts
{ id: "question", … },
{ id: "answer", …, animation: {
  effect: "entrance_wipe", options: { direction: "right" }, duration: 0.6,
  triggerShape: "question",          // block id on the same slide
}},
```

- `triggerShape` implies `on-click`. An explicit non-click `trigger` is rejected.
- The trigger object must be another block on the same slide, and the renderer checks this.
  Give it a visual cue that it can be clicked (label it "Click me", or use a primary fill).
- This only works in Slide Show (F5). Put the instruction in the caption or notes.
- The trigger may be a **Morph-paired** object (verified): after a push-in, clicking the
  zoomed card can reveal a note. `inspect` then shows `on click of !!<morphKey>`, because
  paired shapes are renamed. Reference: `motion-showcase` → `push-focus`.
- Reference: `motion-showcase` → `click-reveal`.

## Motion path

```ts
{ id: "launch", shape: "pill", x: 80, y: 170, …, animation: {
  effect: "path_right", options: { relative: true }, duration: 2,
}},
```

- `relative: true` (the default) moves from wherever the object is. Leave room along the
  path. The bounds only cover the start position, so nothing stops the object from
  travelling over other content, and that's a design decision you have to make yourself.
- Don't add `accelerate`/`decelerate`, because path presets already ease.
- Reference: `motion-showcase` → `paths-emphasis`.

## Two things move together

```ts
"bar-0": { effect: "entrance_wipe", options: { direction: "right" } },
"note-0": { effect: "entrance_fade", trigger: "with-previous" },
```

`with-previous` starts at the same moment as the preceding row. Use it for pairs that
belong together but live in separate blocks.
