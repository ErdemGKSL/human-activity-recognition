# Verify and troubleshoot motion

Back to [../SKILL.md](../SKILL.md).

## What "done" looks like

1. `bun run check` passes. It covers types (effect and transition keys), the renderer and
   layer tests, and the sidecar tests.
2. `bun run generate <deck>` prints `✓ output/<deck>.pptx`. That means it passed the quality
   gate, `animation_config.py validate`, and ppt-master's read-back of every transition,
   animation row, and Morph pair.
3. `bun run inspect output/<deck>.pptx` shows what you intended:

```
── slide 3  transition: morph option=byObject 1.2s  notes: no
   morph: !!orb
    1. after-previous entrance_rise_up           → anim-detail
── slide 11  transition: fade 0.4s  notes: no
   ⇢ on click of anim-question: entrance_wipe → anim-answer
```

   Check each of these:
   - **transition**: the effect, direction, and duration you asked for (the deck default
     where you didn't override it).
   - **morph**: `!!key` appears on both the source and the destination slide.
   - **rows**: one line per step, in order, with the Start mode you meant, targeting
     `anim-<blockId>`. Paired Morph blocks show as `!!key` instead of `anim-…`.
   - **modifiers**: `repeat=2`, `auto_reverse=yes`, `after_effect=dim`.
   - **on click of**: trigger rows live in their own interactive sequence.
4. `output/<deck>/animations.json` holds the exact request that was sent to ppt-master,
   which is useful to diff.
5. Look at `--png` previews for the final frame of each slide. For Morph, both frames must
   read well on their own.

## Failure → cause → fix

| Symptom / error | Cause | Fix |
|---|---|---|
| `animations.<id> matches no <Animate> block (available: …)` | typo, or the layout has no such block | use one of the listed ids, or add an `<Animate>` to the layout |
| `triggerShape "x" must be another block` | unknown id, or self-trigger | point at a different block on the same slide |
| `<Animate id="…"> contains "footer", which ppt-master treats as static chrome` | chrome token in the id | rename it (`contact`, not `footer-contact`) |
| `<Animate id> is nested inside …` / `duplicate` / `morph key used by two blocks` | structure | flatten blocks; make ids and keys unique per slide |
| `<Animate id="…"> rendered nothing` | empty or zero-size block | give it content or a size |
| `"anim-x" overlaps "static-2"` (or two `anim-*`) | root-group overlap > 1px | move things apart, or merge the overlapping content into the block |
| `morph pairs (…) need a morph transition` | slide sets a non-morph transition | remove `slide.transition` or set `effect: "morph"` |
| `animations.json validation failed` | bad option key or value, or a trigger conflict | `pptx_animations.py --describe <effect>`, then fix `options` |
| `accel + decel exceeds 100000` at export | easing added to a preset that already eases (`path_*`) | drop `accelerate`/`decelerate` |
| Animation missing in inspect output | slide or deck has `animate: false`, the block's animation is `"none"`, or the override replaced it | check `slide.animations` and layout defaults |
| Objects appear, vanish, then appear again after a Morph | an entrance on an object that Morph already fades in | remove its entrance ([why](../../pptx-morph/SKILL.md#how-pairing-works-here)) |
| Morph plays as a plain crossfade | keys differ, or the slides aren't consecutive | same key, adjacent slides; inspect shows `!!key` on both |
| Emphasis "does nothing" in PowerPoint | text-formatting effect on a block group | use shape-level emphasis ([why](../../pptx-object-animations/SKILL.md#effects-that-dont-fit-this-pipeline)) |
| Tofu boxes in previews | glyph missing from Carlito (`→`, `✓`) | use words, or register a font ([fonts](../../takumi-rendering/references/layout-and-css.md#fonts)) |

## Hand-checking the sidecar

```bash
.venv/bin/python vendor/ppt-master/skills/ppt-master/scripts/animation_config.py list-groups output/<deck>
.venv/bin/python vendor/ppt-master/skills/ppt-master/scripts/animation_config.py validate output/<deck>
```

`list-groups` shows the real `anim-*` and `static-*` groups per slide, which helps when an
override "doesn't match".
