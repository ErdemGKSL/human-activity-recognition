---
name: ppt-master-export
description: How the vendored ppt-master (vendor/ppt-master) turns our normalized SVG into a native .pptx — the flat-page SVG contract, the quality gate, the animations.json sidecar, which CLI flags and scripts we call, what it validates and rejects, and how to read its errors. Use when an export or quality-gate step fails, when changing packages/ppt-master or normalizeSvg, when adding anything that must survive into PowerPoint (notes, motion, images), or when you need a ppt-master script such as --describe or list-groups.
---

# ppt-master export stage

> **Scope: `slides/`** — this skill covers the PPTX pipeline in `slides/` only. Paths below
> are relative to `slides/`, and `bun run …` commands run from there. PDFs (`report/`,
> `slide-directions/`) are covered by [pdf-documents](../pdf-documents/SKILL.md).

[ppt-master](https://github.com/hugohe3/ppt-master) is a complete AI deck workflow. This
repo uses **only its export stage**: the SVG → native DrawingML compiler in
`vendor/ppt-master/skills/ppt-master/scripts/`, pinned as a submodule. Never edit it. Adapt
our side instead (`normalizeSvg`, `@pptx/ppt-master`). To bump it, use
[update-ppt-master](../update-ppt-master/SKILL.md).

## What we run, in order (`packages/ppt-master/src/run.ts`)

```
output/<deck>/
  svg_output/NN_<id>.svg     ← renderer output (normalized)
  notes/NN_<id>.md           ← speaker notes, matched by stem
  animations.json            ← motion sidecar (only if any slide has motion)
  validation/                ← reports ppt-master writes
```

1. `svg_quality_checker.py <ws> --quick-generate --canonical-authoring --stage final --format ppt169 --json`
   is the gate. Export under `--quick-generate` refuses to run without a *passing, current*
   report. On failure we re-run it without `--json` and throw the human-readable report.
2. `animation_config.py validate <ws>` checks the sidecar against the real SVG group ids.
   It runs only when `animations.json` exists.
3. `svg_to_pptx.py <ws> --quick-generate -o <out> --with-notes|--no-notes` writes the deck,
   then **reads the package back** and verifies every transition and animation row. Some
   invalid combinations only fail at this step (for example, accel + decel > 100%).

Speaker notes need an explicit `--with-notes` under quick-generate. The bridge adds it
automatically whenever any slide has notes.

## Rules you can't bypass

- **Don't use `--enable-dangerous-nonconforming-svg-export`.** It's a safety bypass. Fix the
  SVG so it passes the gate.
- The **flat page contract** (root `lang`, one `data-pptx-page-role`, bounded
  non-overlapping root groups, no content clip groups, and so on) is summarized with the
  reasons in [references/svg-contract.md](references/svg-contract.md). `normalizeSvg`
  satisfies it for everything Takumi emits today.
- **Root groups must not overlap by more than 1px.** This single rule drives most layout
  constraints in motion work: no stacked or flip-card objects, and blocks kept clear of
  static content.
- **Group ids containing chrome tokens** (`footer`, `header`, `rule`, `bg`, `logo`, …) are
  treated as static and never animated. See `SLIDE_CHROME_TOKENS` in
  `packages/core/src/motion.ts`.

## Handy scripts (run with `.venv/bin/python vendor/ppt-master/skills/ppt-master/scripts/<script>`)

| Script | Use |
|---|---|
| `pptx_animations.py --list` | All transition and animation keys by category |
| `pptx_animations.py --describe <effect>` | The exact options and timing fields for one object effect |
| `pptx_animations.py --describe-transition <key>` | The same for a transition |
| `animation_config.py list-groups output/<deck>` | Real animatable group ids per slide, plus excluded chrome |
| `animation_config.py validate output/<deck>` | Validate a hand-edited sidecar |
| `svg_quality_checker.py output/<deck> --quick-generate --canonical-authoring --stage final --format ppt169` | Readable gate report |

Our own inspector, `bun run inspect output/<deck>.pptx`, shows what actually landed in the
PPTX: transitions, `!!` morph names, and Animation Pane rows with their triggers. More
flags and troubleshooting are in [references/cli-cheatsheet.md](references/cli-cheatsheet.md).

## Where to go next

- Sidecar field mapping (our `AnimationStep` / `Transition` to ppt-master fields):
  [references/cli-cheatsheet.md#sidecar-mapping](references/cli-cheatsheet.md#sidecar-mapping)
- Why the SVG looks the way it does before normalization:
  [takumi-rendering](../takumi-rendering/SKILL.md)
- Designing motion: start at [animate-slides](../animate-slides/SKILL.md)
- A failing `bun run generate`: [generate-deck](../generate-deck/SKILL.md)
