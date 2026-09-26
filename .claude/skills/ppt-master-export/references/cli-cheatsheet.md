# ppt-master CLI cheat sheet, sidecar mapping and error decoder

Back to [../SKILL.md](../SKILL.md).

## `svg_to_pptx.py` flags that matter here

| Flag | Meaning | We use |
|---|---|---|
| `--quick-generate` | Export without a design-spec lock; requires a passing final quality report | always |
| `-o <file>` | Output path | always |
| `--with-notes` / `--no-notes` | Speaker notes (quick mode needs explicit opt-in) | auto from notes presence |
| `-t <transition>` / `--transition-duration` | CLI-wide transition; **sidecar wins per slide** | no — use `deck.transition` |
| `-a auto\|mixed\|random\|none` | Generic auto-builds for every group | no — explicit per block is better design |
| `--auto-advance <s>` / `--kiosk` | Timed playback / looping kiosk | not wired; `Transition.autoAdvance` covers per-slide timing |
| `--no-animations` | Strip transitions and animations | debugging only |
| `--native-charts-and-tables` | Replace marked SVG charts with native charts | not used (charts are drawn boxes) |
| `--enable-dangerous-nonconforming-svg-export` | Skip the contract | **forbidden** |

Default transition when nothing is specified: **fade, 0.4 s** on every slide.

## Sidecar mapping

`@pptx/ppt-master` builds `animations.json` (`packages/ppt-master/src/animations.ts`).
Field grammar source: `vendor/.../scripts/docs/pptx-animations.md` §8.

| Ours (`@pptx/core`) | Sidecar | Notes |
|---|---|---|
| `slide.transition` / `deck.transition` | `slides.<stem>.transition` | written per slide (deck default is copied to each) |
| `Transition.effect/duration/options/autoAdvance` | `effect/duration/effect_options/auto_advance` | |
| block group | `slides.<stem>.groups["anim-<id>"].effects[]` | always the `effects[]` form |
| `AnimationStep.effect` | `effect` | canonical key |
| `trigger` (default `after-previous`) | `trigger` | `on-click` default when `triggerShape` set |
| `triggerShape` (block id) | `trigger_shape` (group id) | resolved in the renderer |
| `options` | `effect_options` | per-effect, see `--describe` |
| `delay/duration/order` | same | seconds |
| `repeatCount/repeatDuration/autoReverse/rewind` | `repeat_count/repeat_duration/auto_reverse/rewind` | |
| `accelerate/decelerate/bounceEnd/restart` | `accelerate/decelerate/bounce_end/restart` | |
| `afterEffect` | `after_effect` | `"hide"`, `"hide-on-next-click"`, `{type:"dim", color}` |
| morph pairing (automatic) | `slides.<stem>.morph = {from, pairs:{key:{from,to}}}` + `transition.effect = "morph"` | destination slide only |

## Error decoder

| Message (abridged) | Stage | Cause → fix |
|---|---|---|
| `requires a passing final SVG quality report … found not-provided/failed` | export | gate didn't run or failed → read the gate output above it |
| `[ERROR] … clip-path` | gate | content clip group → layout rule (see [takumi-rendering](../../takumi-rendering/SKILL.md)) |
| `[ERROR] … root-level <g> without explicit data-pptx-bounds` | gate | normalizer skipped a group → bug in `normalize-svg.ts` |
| `root-group overlap` | gate | caught earlier by `normalizeSvg` normally → move content |
| `animations.json validation failed` | validate | unknown effect/option, trigger conflict, missing group |
| `object-animation accel + decel exceeds 100000` | export read-back | preset already eases (all `path_*`) → drop `accelerate`/`decelerate` |
| `morph pairs … need a morph transition` | renderer | slide sets a non-morph transition while pairing → remove it or use `morph` |
| `LibreOffice: source file could not be loaded` | local preview | LibreOffice in this container can't open any PPTX; use `bun run inspect` + PNG previews |
