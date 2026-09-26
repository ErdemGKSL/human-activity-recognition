# Native, editable text: how outlines become PowerPoint text

Back to [../SKILL.md](../SKILL.md). Takumi's SVG draws text as glyph outlines
([svg-output-anatomy](svg-output-anatomy.md)), and ppt-master exports outlines as shapes. Its
native text boxes come only from SVG `<text>`. The renderer therefore rebuilds every line
as `<text>` from two other views of the **same** Takumi layout. Nothing is re-measured or
guessed. Code: `packages/renderer/src/{pdf-text,native-text,fonts}.ts`.

## The three views of one slide

| View | API | What it gives | Used for |
|---|---|---|---|
| SVG | `renderSvg` (takumi-js) | shapes; each text line as `<g fill><use href="#gN" x y/>…</g>` (a one-glyph line is a bare `<use fill>`) | shapes, paint order, block tagging, line position |
| PDF | `render` from **takumi-pdf**, `viewport: 1280×720`, `tagged: false` | real PDF text: one `BT … Tf … Tm … TJ … ET` per line | the text string, face, size, colour, opacity, letter-spacing, baseline, advance width |
| Layout | `Renderer#measure` from `@takumi-rs/core` | per text node: its box and its lines | which lines form one paragraph, and the box the paragraph wrapped in |

## What the takumi-pdf output looks like (verified, takumi-pdf 0.15)

- Page content is wrapped in `cm 0.75 0 0 -0.75 0 540`, so inside it the coordinates are
  **CSS px, y down**, the same space as the SVG.
- Each line: `r g b rg`, `/fN size Tf`, `1 0 0 -1 x baseline Tm`, `[<cids> kern …] TJ`.
  Fonts are Type0 / Identity-H with a `ToUnicode` CMap (CID → Unicode) and `W` widths.
  BaseFont is `ABCDEF+<PostScript name>` (e.g. `Carlito-Bold`).
- Opacity comes as `/gN gs` (ExtGState `ca`) before a Form XObject `Do`.
- **Letter-spacing is not `Tc`.** It is a uniform offset in the `TJ` array between every
  pair of glyphs. `extractTextRuns` takes the value shared by at least 60% of the gaps.
- **Centred and right-aligned lines** start `Tm` at the line box and move the first glyph with
  a leading `TJ` offset. The line's x is that first glyph's pen position, which equals the
  SVG's first `<use x>`.

`extractTextRuns` is a small reader for exactly this output (it throws on object streams,
other font encodings, or unknown text operators), so a takumi-pdf upgrade that changes the
writer fails in tests instead of silently dropping text.

## Pairing and rewriting (`normalizeSvg` with `text`)

1. **PDF line → layout line:** same x (±1 px) with the baseline inside the measured line box.
   `measure()` runs are relative to the node's *content* box, while `transform` is the
   *border* box, so the node's padding (read from the node tree, walked in parallel) is
   added. That content box is also the paragraph's `frame`.
2. **SVG glyph run → PDF line:** first glyph `(x, y)` equals the PDF pen position and
   baseline (±0.75 px). A glyph run without a PDF line, or a PDF line without a glyph run,
   throws `NativeTextError`: outlines are never kept silently.
3. **Paragraphs:** consecutive sibling runs of one layout node, with the same style and
   block, a constant baseline step, and a shared left edge, centre or right edge, become
   one `<text>` (`text-anchor` start/middle/end):

   ```xml
   <text x="100" y="223" font-size="24" fill="#0F172A"
         data-paragraph-line-height="32.4" data-pptx-frame="100 199 739.2 64.8">
     <tspan x="100" dy="0">Accelerometer ve gyroscope, … time-series</tspan>
     <tspan x="100" dy="32.4" data-paragraph-soft-break="1">üretir</tspan>
   </text>
   ```

   ppt-master joins soft-broken rows into one `<a:p>` with `lnSpc` = the step. The export
   runs with `--reflow-text`, so the box keeps the frame width (the width Takumi wrapped in,
   plus about 2% slack) and PowerPoint re-wraps the paragraph when it is edited.
   Single lines get no frame: `wrap="none"` with auto-fit, so a kerning difference can
   never push a word onto a new line.
4. `font-family="Calibri"` is declared once on the root `<svg>`. Bold and italic come from
   the PDF face. `fill-opacity` is the PDF alpha divided by any ancestor opacity. Takumi's
   `<g opacity>` wrappers around text are dissolved into each text's `fill-opacity`.
5. Unused glyph `<path>` defs are pruned.

## Fonts: Carlito on our side, Calibri in PowerPoint

Editable text is drawn by PowerPoint with an installed font, so layout must use a font whose
metrics PowerPoint has everywhere. **Carlito is metric-compatible with Calibri** (identical
advances; ppt-master's Calibri table matches Carlito to 4 decimals), and Calibri ships with
Office on Windows and macOS. Takumi lays out and previews with Carlito (`@expo-google-fonts/
carlito`, OFL, faces 400/700 regular and italic), the SVG says `Calibri`, and lines break in
PowerPoint where they break in the previews. Nothing needs installing.

- Only four faces exist, so `snapFontWeights` maps every `fontWeight` to 400 or 700 before
  rendering. Takumi draws a missing weight as *stroked outlines*, which would be neither
  text nor matchable.
- `textTransform: "uppercase"` is locale-blind in Takumi ("Girdi" → "GIRDI"). Use
  `upper(text, deck.lang)` from `@pptx/slides` components instead ("GİRDİ"). That also puts
  real capitals into the PowerPoint text.

## The quality gate and bounds

ppt-master's checker fails text it *estimates* to overflow its root group by more than 5%
([svg-contract](../../ppt-master-export/references/svg-contract.md)). Its estimate is the
Calibri table times 1.06–1.12 headroom, and it lacks Turkish `ı` (estimated at 0.55 em
instead of 0.23 em). `pptMasterWidthEstimate` reproduces that. `normalizeSvg` computes group
bounds from the true text boxes, checks overlaps on those, then widens each group toward the
estimate **into free space only**, stopping at neighbouring groups and the canvas.
