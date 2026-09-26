# Takumi SVG output: anatomy and how we reshape it

Back to [../SKILL.md](../SKILL.md). This is what `renderSvg` returns for a slide and what
each pipeline stage does to it. Run `bun run generate <deck> --raw` to get unmodified
Takumi output in `output/<deck>/svg_output/` for comparison.

## Raw output (verified)

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect x="0" y="0" width="1280" height="720" fill="#0f172a"/>      <!-- root background -->
  <g fill="#fff">                                                   <!-- one text run -->
    <use href="#g0" x="80" y="273"/>                                <!--   one glyph each -->
    <use href="#g1" x="135.37" y="273"/>
  </g>
  <path d="M96 399h168c8.84 0 16 7.16 16 16v88…Z" fill="#3b82f6"/> <!-- rounded box -->
  <clipPath id="cp0"><path d="…same outline…"/></clipPath>          <!-- from border-radius -->
  <g clip-path="url(#cp0)"></g>                                      <!-- EMPTY clip group -->
  <defs>
    <path id="g0" d="M3.69 0v-28.41h3.44…Z"/>                       <!-- glyph outlines -->
  </defs>
</svg>
```

What to know about each part:

| Feature | Why it matters |
|---|---|
| **Flat, paint-ordered root children.** There are no groups per DOM element, and `id`/`data-*` from JSX are **not** emitted. | You can't find "the card" in the SVG. `layers.ts` works around this by diffing renders. |
| **Text is `<g fill>` + `<use href="#gN">`** per glyph, with outlines in `<defs>`. | There's no `<text>`, so there's no editable PPTX text, and ppt-master expands each `<use>` into a shape. |
| **Def ids (`g0`, `cp0`) are numbered per render.** | Two renders of the same slide number glyphs differently. Diffing has to compare *referenced content*, not ids. |
| **Lowercase / short hex** (`#fff`, `#3b82f6`). | ppt-master prefers `#RRGGBB`, so `normalizeSvg` uppercases and expands it. |
| **`border-radius` produces a path plus an empty `<g clip-path>`**. | It's harmless, and the normalizer drops it along with the unused `<clipPath>`. |
| **A single-side border (`borderLeft`) or `overflow: hidden` produces a `<g clip-path>` that has content.** | ppt-master can't export this, so the normalizer throws `SvgNormalizeError`. |
| **Root-level `<clipPath>` and a trailing `<defs>`.** | ppt-master wants every clipPath inside `<defs>`, and `<defs>` first. The normalizer hoists them. |

## Pipeline stages (`packages/renderer/src`)

1. **`render.ts`** calls `fromJsx` once and renders the full slide (plus a PNG if asked).
2. **`layers.ts`** runs only when the slide has `<Animate>` blocks:
   - `findBlocks` walks the node tree for `data-animate-id` and friends. It rejects nesting,
     duplicate ids, duplicate morph keys, and ids containing chrome tokens.
   - It renders the slide again with each block set to `visibility: hidden` (`hideAt`).
   - `tagBlocks` keys every root element by its markup, with `#id` references replaced by
     the referenced def's markup. Elements that are missing from block B's hidden render
     get `data-pptx-block="B"`.
3. **`normalize-svg.ts`** stamps `lang` and `data-pptx-page-role`, hoists `<defs>`, drops
   empty clip groups, and marks the full-canvas first rect as
   `id="background" data-pptx-role="background"`. Then it groups what's left:
   - **No blocks:** everything goes into `<g id="slide-content" data-pptx-bounds="0 0 1280 720">`.
   - **With blocks:** each block becomes `<g id="anim-<id>">`, and each run of static
     elements between blocks becomes `<g id="static-N">`. All of them get bounds from
     `geometry.ts` (conservative bounding boxes: path control points, `<use>` glyph extents,
     transforms). Overlaps larger than 1px throw here, before ppt-master's checker sees
     them.
4. It canonicalizes paints and serializes the result.

## Consequences you'll run into

- **"Block X overlaps static-N"**: some static content (often a title run or footer) has a
  bounding box that crosses a block. Either move the content, or put it inside the block.
- **"<Animate id> rendered nothing"**: the block is empty, or it's a zero-size box with no
  paint.
- **Cost**: each block adds one extra render. That's fine at deck scale (milliseconds per
  render), but avoid hundreds of blocks on one slide.

Related: [../../ppt-master-export/references/svg-contract.md](../../ppt-master-export/references/svg-contract.md)
covers the rules this reshaping satisfies.
