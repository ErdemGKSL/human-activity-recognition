---
name: pptx-object-animations
description: In-slide PowerPoint object animations for this repo — choosing entrance, emphasis, exit and motion-path effects, options like direction/size/amount, Start modes (after-previous, on-click, with-previous), timing modifiers (repeat, auto-reverse, easing, bounce), "On click of" triggers, dim-after, and multi-step lifecycles; how to express them in deck data or in a layout's <Animate>. Use whenever a slide's contents should build, pulse, move, reveal on click, or disappear — including "make the bullets appear one by one", "highlight this number", "reveal the answer when I click".
---

# Object animations

An object animation is a row in PowerPoint's Animation Pane that targets one shape group.
In this repo a target is always an **`<Animate>` block**. It becomes the group
`anim-<id>` in the SVG and a named group in PowerPoint. If there's no block, nothing can
animate. See [animate-slides](../animate-slides/SKILL.md) for how blocks are made.

Before choosing an effect, check that the slide *should* move:
[motion-design](../motion-design/SKILL.md).

## Where to write it

```ts
// 1) Layout default — packages/slides/src/layouts/*.tsx
<Animate id={`metric-${i}`} animation={{ effect: "entrance_rise_up", duration: 0.5 }} style={…}>

// 2) Deck data override for one slide — packages/mock-data/src/decks/*.ts
animations: {
  "metric-0": [{ effect: "entrance_zoom" }, { effect: "emphasis_grow_shrink", options: { size: 115 }, autoReverse: true }],
  "metric-3": "none",
},

// 3) Free-form objects — stage layout
objects: [{ id: "badge", shape: "circle", …, animation: { effect: "entrance_zoom" } }]
```

A block's value is a single step, an array of steps (a lifecycle), or `"none"`. The type is
`AnimationStep` in `packages/core/src/motion.ts`, and `tsc` rejects unknown effect keys.

## The four families

| Family | Key prefix | Use it to | Typical picks |
|---|---|---|---|
| Entrance | `entrance_*` (53) | Make something appear | `entrance_fade` (text, quotes), `entrance_rise_up` (cards), `entrance_fly` + direction (list items), `entrance_wipe` + direction (bars, lines, timelines), `entrance_zoom` (badges, CTAs), `entrance_appear` (instant) |
| Emphasis | `emphasis_*` (33) | Point at something already visible | `emphasis_grow_shrink` + `size` + `autoReverse` (pulse), `emphasis_teeter` (wobble or warning), `emphasis_spin` + `amount`, `emphasis_transparency`, `emphasis_change_fill_color` |
| Exit | `exit_*` (53) | Remove something mid-slide | `exit_fade`, `exit_zoom`, `exit_fly` + direction (mirror the entrance) |
| Motion path | `path_*` (64) | Move along a path | `path_right` / `path_left` / `path_up` / `path_down` (straight, `relative: true`), `path_arc_*`, `path_turn_*`, `path_s_curve*`, and shapes like `path_circle` |

The full list, with PowerPoint names, default durations, and every option value, is
generated from ppt-master: [references/effect-catalog.md](references/effect-catalog.md).
Check one effect live:
`.venv/bin/python vendor/ppt-master/skills/ppt-master/scripts/pptx_animations.py --describe <key>`.

### Direction semantics (a frequent mistake)

`direction` names **where the motion travels**, and PowerPoint names the edge it starts
from. So `{ direction: "right" }` is PowerPoint's "From Left" and slides in left-to-right.
For lists and bars in left-to-right languages, use `right`. `entrance_zoom` directions are
`in`, `out`, `in_slightly` and so on, not edges.

## Start modes and ordering

| `trigger` | PowerPoint | Use |
|---|---|---|
| `after-previous` (**our default**) | After Previous | Auto-play chains. The whole slide builds without clicks. |
| `with-previous` | With Previous | Two blocks move together (a label with its bar, a matching pair) |
| `on-click` | On Click | Presenter-paced: one click per step |
| `triggerShape: "<block>"` | Trigger → On Click of | Only a click *on that object* starts it. See [click-to-reveal](references/recipes.md#click-to-reveal). |

The order is paint order (layout order) unless you set `order`. `delay` adds seconds after
the resolved start. The whole modifier set (repeat, auto-reverse, rewind, easing, bounce,
restart, after-effects), with the rules ppt-master enforces, is in
[references/modifiers-and-triggers.md](references/modifiers-and-triggers.md).

## Recipes

Ready-made patterns with working code, each verified end to end in the `motion-showcase`
or `quarterly-review` decks: [references/recipes.md](references/recipes.md)

- [Sequential list](references/recipes.md#sequential-list) ·
  [presenter-paced list with dim-after](references/recipes.md#presenter-paced-list-with-dim-after)
- [KPI cards](references/recipes.md#kpi-cards) · [chart that grows](references/recipes.md#chart-that-grows)
- [Emphasis that points](references/recipes.md#emphasis-that-points) ·
  [looping attention](references/recipes.md#looping-attention-kiosk-or-demo)
- [Lifecycle: enter, emphasize, exit](references/recipes.md#lifecycle-enter-emphasize-exit)
- [Click to reveal](references/recipes.md#click-to-reveal) ·
  [motion path](references/recipes.md#motion-path)

## Effects that don't fit this pipeline

- **Text-formatting emphasis** (anything that changes font, font color, font size, bold,
  underline, or other text styling) needs real PowerPoint text runs. Our text is vector
  outlines ([takumi-rendering](../takumi-rendering/SKILL.md)), so these have nothing to act
  on. Use shape-level emphasis instead: grow/shrink, teeter, spin, transparency, or fill
  color.
- **Flip cards and stacked reveals** need two groups in the same spot, but root groups may
  not overlap ([ppt-master-export](../ppt-master-export/SKILL.md#rules-you-cant-bypass)).
  Put them side by side and use a click-to-reveal instead.
- **`accelerate`/`decelerate` on `path_*`**: the presets already ease, and the sum exceeds
  100%, so export fails at read-back.
- **Paragraph-by-paragraph builds** inside one text box aren't possible. Split the content
  into separate blocks.

## Verify

```bash
bun run generate <deck>
bun run inspect output/<deck>.pptx --slide <n>   # rows, Start modes, targets, repeat, dim, triggers
```

More checks and fixes: [animate-slides → verify](../animate-slides/references/verify-and-troubleshoot.md).
