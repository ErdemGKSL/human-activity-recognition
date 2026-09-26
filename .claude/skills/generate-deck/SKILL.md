---
name: generate-deck
description: Run the JSX → SVG → PPTX pipeline, inspect outputs (PNG previews, `bun run inspect`), and debug failures (Takumi render errors, SvgNormalizeError, NativeTextError, LayerError, ppt-master quality gate or export failures, missing Python toolchain). Use when asked to build/regenerate decks, check what a .pptx contains, or when generation fails.
---

# Generate and debug decks

> **Scope: `slides/`** — this skill covers the PPTX pipeline in `slides/` only. Paths below
> are relative to `slides/`, and `bun run …` commands run from there. PDFs (`report/`,
> `slide-directions/`) are covered by [pdf-documents](../pdf-documents/SKILL.md).

## Run

```bash
bun run setup                          # first time: submodule + bun install (repo root) + uv sync
bun run generate                       # project decks (@pptx/decks) → output/<deck>.pptx
bun run generate --examples            # + template example decks (@pptx/mock-data)
bun run generate final-results --png   # any deck id, project or example
bun run decks                          # list ids (project / example)
```

Outputs for each deck:

```
output/<deck>.pptx
output/<deck>/svg_output/NN_<id>.svg    normalized SVG (exporter input)
output/<deck>/notes/NN_<id>.md          speaker notes
output/<deck>/preview/NN_<id>.png       with --png
output/<deck>/animations.json           transitions + object animations sidecar
output/<deck>/validation/               ppt-master quality + export reports
```

## Inspect a generated deck

```bash
bun run inspect output/<deck>.pptx            # per slide: transition, morph names, animation rows (start, effect, target, dur, delay, modifiers), notes, shapes
bun run inspect output/<deck>.pptx --slide 3  # one slide
bun run inspect output/<deck>.pptx --json
```

LibreOffice in the cloud container can't open any PPTX. Use `inspect` together with the
PNG previews instead.

## Debug by stage

Background reading: [takumi-rendering](../takumi-rendering/SKILL.md) covers the SVG Takumi
emits, and [ppt-master-export](../ppt-master-export/SKILL.md) covers the gate, the export,
and an [error decoder](../ppt-master-export/references/cli-cheatsheet.md#error-decoder).
For motion-specific failures, see
[animate-slides → troubleshoot](../animate-slides/references/verify-and-troubleshoot.md).


1. **Takumi render error.** The stack trace points into a layout. Check for unsupported
   CSS, and remember that every box needs `display: "flex"`.
2. **`SvgNormalizeError: <g clip-path> with content`.** A layout uses `overflow: hidden` or
   a single-side border. Replace it with sized divs. Run `bun run generate <deck> --raw` and
   grep `output/<deck>/svg_output/*.svg` for `clip-path` to find the element.
3. **Quality gate failed.** The error prints ppt-master's checker report. The `[ERROR]`
   lines are blocking, and `[WARN]` lines are advisory. Fix the issue in `normalizeSvg`
   (`packages/renderer/src/normalize-svg.ts`) if it's generic, or in the layout if it's
   specific. The contract docs are in
   `vendor/ppt-master/skills/ppt-master/scripts/docs/svg-contract.md` and
   `vendor/ppt-master/skills/ppt-master/references/semantic-svg.md`.
   To reproduce the check by hand:
   ```bash
   .venv/bin/python vendor/ppt-master/skills/ppt-master/scripts/svg_quality_checker.py \
     output/<deck> --quick-generate --canonical-authoring --stage final --format ppt169
   ```
4. **`LayerError` or `SvgNormalizeError: … overlaps …`.** These are `<Animate>` block
   problems: nesting, duplicate or chrome ids, a block that renders nothing, or blocks
   overlapping each other or static content. See the `animate-slides` skill. To check
   whether motion is the cause, add `animate: false` to the deck.
5. **`animations.json validation failed`.** The sidecar has an unknown effect, an invalid
   option, or a trigger conflict. Check the options with
   `pptx_animations.py --describe <effect>`.
6. **`NativeTextError`.** A text line could not be rebuilt as editable text: an SVG glyph
   run with no matching takumi-pdf line (or the reverse), or a face that isn't a registered
   slide font. Usual causes: a weight or style the fonts don't have (Takumi draws it as
   stroked outlines), or an unregistered `fontFamily`. See
   [native-text](../takumi-rendering/references/native-text.md).
7. **"ppt-master not found" or "Python not found".** Run `bun run setup`.

**Never** bypass the gate with `--enable-dangerous-nonconforming-svg-export`.
