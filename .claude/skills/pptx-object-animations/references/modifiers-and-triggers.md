# Step modifiers and triggers — full reference

Back to [../SKILL.md](../SKILL.md). All fields live on `AnimationStep`
(`packages/core/src/motion.ts`) and map 1:1 to ppt-master sidecar fields
([mapping table](../../ppt-master-export/references/cli-cheatsheet.md#sidecar-mapping)).

| Field | Type | Effect in PowerPoint | Rules enforced (by us or ppt-master) |
|---|---|---|---|
| `effect` | `AnimationEffect` | The preset | must be one of 203 keys (tsc) |
| `trigger` | `on-click` \| `with-previous` \| `after-previous` | Start | default `after-previous`; `on-click` default when `triggerShape` set |
| `triggerShape` | block id | Timing → Triggers → On click of | another block on the same slide; forces `on-click`; separate interactive sequence, doesn't interleave with the main one |
| `duration` | s > 0 | Duration | `entrance_appear` stays instant; value still spaces `after-previous` |
| `delay` | s ≥ 0 | Delay | for `triggerShape` rows it's the delay after the click |
| `order` | int ≥ 1 | Animation Pane order | ties keep paint order; unlisted blocks follow the nearest listed one above |
| `options` | per effect | Effect Options | only keys the effect supports — `--describe <effect>` |
| `repeatCount` | number | Repeat: N | exclusive with `repeatDuration` |
| `repeatDuration` | s | Repeat: until time | exclusive with `repeatCount` |
| `autoReverse` | bool | Auto-reverse | doubles visible time |
| `rewind` | bool | Rewind when done playing | restores pre-animation state |
| `accelerate`, `decelerate` | 0..1 | Smooth start / end | sum ≤ 1; **not on `path_*`** (built-in easing makes the total exceed 1 at export read-back) |
| `bounceEnd` | 0..1 | Bounce end | interpolated effects only; not with `decelerate` |
| `restart` | `always` \| `when-not-active` \| `never` | Restart | mostly for trigger-driven rows |
| `afterEffect` | `none` \| `hide` \| `hide-on-next-click` \| `{type:"dim", color}` | After animation | dim applies when the next row starts |

## Ordering rows across blocks

The default order is: blocks in paint (layout or array) order, and each block's steps in
array order. So all of block A's steps play before block B's first step.

`order` sorts rows across the whole page, with ties keeping the default order. When a
block has no `order`, ppt-master gives it the order of the nearest ordered block above it
in paint order (vendored `scripts/docs/pptx-animations.md` §8, the `order` row). That
inheritance gets hard to reason about once one block has several ordered steps.

**Rule: if any step on a slide must break paint order, give every step on that slide an
explicit `order`.** Same number means paint order within that tier. Typical tiers:

| Tier | Rows |
|---|---|
| `order: 1` | all entrances (in paint order) |
| `order: 2` | the one emphasis on the slide's point |
| `order: 3` | exits or follow-ups |

Each `triggerShape` row goes into its own interactive sequence, so it doesn't use up a
normal click and isn't affected by `order` relative to the main sequence. For a worked
example, see [emphasis that points](recipes.md#emphasis-that-points).

## Worked combos

- **Pulse twice then settle:** `{ effect: "emphasis_grow_shrink", options: { size: 115 }, duration: 0.5, autoReverse: true, repeatCount: 2 }`
- **Appear, hold, disappear:** `[{ effect: "entrance_fade" }, { effect: "exit_fade", delay: 1.5 }]`
- **Clear a hint when the answer shows:** give a third block (e.g. `hint`) an `exit_fade`
  step with `triggerShape: "question"` — both rows run on the same click. A block can't
  trigger itself (rejected by the renderer and by ppt-master), so the clicked object
  itself can't exit on its own click.
- **Click-through with memory:** `trigger: "on-click", afterEffect: { type: "dim", color }` on
  each item ([recipe](recipes.md#presenter-paced-list-with-dim-after)).

## Diagnosing

`bun run inspect output/<deck>.pptx --slide N` prints each row in its final order with
`start`, `effect`, `target`, `dur`, `delay`, `repeat`, `auto_reverse` and `after_effect`,
plus the `on click of` rows. Compare it against what you wrote. It doesn't print
effect-specific `options` (for example `size: 110`). Those are in
`output/<deck>/animations.json`, which is the exact request ppt-master validated. Failures and their fixes:
[animate-slides/references/verify-and-troubleshoot.md](../../animate-slides/references/verify-and-troubleshoot.md).
