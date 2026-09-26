---
name: pptx-transitions
description: Slide-to-slide PowerPoint transitions in this repo — choosing an effect by the relationship between two slides (continuation, new section, direction, finale), durations and options like direction, deck defaults vs per-slide overrides, auto-advance for kiosks, and how Morph fits in. Use whenever the user mentions transitions, "how slides change", slide advance timing, kiosk/looping decks, or wants a section change or ending to feel different.
---

# Slide transitions

A transition plays when a slide *enters*. In this repo it's data:

```ts
defineDeck({ transition: { effect: "fade", duration: 0.4 }, slides: [
  { …, transition: { effect: "push", options: { direction: "up" }, duration: 0.6 } },  // override
  { …, transition: { effect: "fade", autoAdvance: 8 } },                               // kiosk timing
]})
```

- `deck.transition` is the default for every slide. `slide.transition` overrides it.
- If both are omitted, ppt-master applies **fade, 0.4 s** everywhere, which is also a good
  default.
- `effect: "none"` gives a hard cut. `autoAdvance` (seconds) still works with it.
- `options` are per effect, for example `direction` for push/wipe/cover or `style` for fade.
  All 48 keys with their exact options:
  [references/transition-catalog.md](references/transition-catalog.md). Check one live with
  `pptx_animations.py --describe-transition <key>`.
- **Morph is special.** Don't set it by hand unless you're tuning a paired slide. It's
  assigned automatically when objects share a `morph` key. See
  [pptx-morph](../pptx-morph/SKILL.md).

## Choosing by slide relationship

Choose the transition from what the change *means*, not from the gallery. This is adapted
from ppt-master's `references/animations.md` §3:

| Relationship between the slides | Transition | Duration |
|---|---|---|
| Ordinary continuation inside a section | `fade` (the deck default) | 0.3–0.5 |
| Same object or space, changed | `morph` (automatic via keys) | 0.8–1.4 |
| Moving forward to a new section | `push` with `direction` = the narrative direction (`up` or `left`) | 0.5–0.7 |
| Stepping into detail, then back out | `morph` push-in and pull-out ([recipe](../pptx-morph/references/recipes.md#camera-push-in)) | 1–1.4 |
| Deliberate break, change of topic | `fade` with `style: "through_black"`, or `cut` | 0.6 / instant |
| Something layered on top of the previous slide | `cover` (new on top) or `uncover` (old slides away) | 0.5–0.7 |
| Finale or celebration | one [exciting](#the-exciting-category) effect | 1.2–2 |
| Recorded or kiosk playback | the deck default plus `autoAdvance` per slide | — |

**Direction consistency.** If sections push `up`, every section push goes `up`. Mixed
directions read as random. Nothing enforces this automatically. When you add a section
slide, copy the existing section's `transition`, and check with
`bun run inspect … | grep push`.

## The three categories (from PowerPoint)

- **Subtle** (`fade`, `push`, `wipe`, `split`, `reveal`, `cut`, `cover`, `uncover`, `flash`,
  `shape`, `random_bars`, plus `morph`): your everyday palette.
- **Exciting** (`vortex`, `origami`, `page_curl`, `airplane`, `crush`, `fracture`,
  `curtains`, `wind`, `prestige`, …): see [the exciting category](#the-exciting-category).
- **Dynamic content** (`pan`, `ferris_wheel`, `conveyor`, `rotate`, `window`, `orbit`,
  `fly_through`): the background stays still and only the content moves. This fits decks
  with a consistent full-bleed background.

## The exciting category

These are showpieces. Use **at most one per deck**, on a slide that earns it (a launch
reveal, a closing slide), with a longer duration (1.2–2 s). Using them on content slides
is the fastest way to make a deck look amateur. The `motion-showcase` closing slide uses
`vortex` at 1.5 s as the example.

## Auto-advance and kiosks

```ts
transition: { effect: "fade", duration: 0.5, autoAdvance: 6 }  // move on after 6 s
```

- It's set per slide. For a whole looping deck, put it in `deck.transition`. Clicks still
  advance.
- Timed slides should build their content with `after-previous` (the default), because
  there's no presenter to click.
- ppt-master's `--kiosk` flag (loop, ignore clicks) isn't wired into our CLI. Add it in
  `packages/ppt-master/src/run.ts` if you need it.

## Verify

```bash
bun run inspect output/<deck>.pptx     # "transition: push dir=u 0.6s  auto-advance 6s"
```

Principles behind all of this: [motion-design](../motion-design/SKILL.md). Object motion
within a slide: [pptx-object-animations](../pptx-object-animations/SKILL.md).
