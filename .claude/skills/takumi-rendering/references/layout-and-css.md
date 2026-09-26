# Takumi layout, CSS and fonts: what works here

Back to [../SKILL.md](../SKILL.md). **Verified** means it was exercised in this repo.
**Upstream** means Takumi's docs claim it but nothing here uses it yet, so render a PNG
preview (`bun run generate <deck> --png`) before relying on it.

## Layout

| Feature | Status | Notes |
|---|---|---|
| Flexbox (`display: flex`, direction, gap, grow, justify/align) | Verified | This is the default mental model. Every container sets `display: "flex"`. |
| `position: absolute` + `left`/`top`/`width`/`height` | Verified | Positions relative to the parent box. It's the basis of the `stage` layout. |
| Padding, margin, percentage widths | Verified | Bar widths use `%` in `BarChart.tsx`. |
| `visibility: hidden` | Verified | Hides the whole subtree while keeping the layout box. A child can't opt back in. |
| `borderRadius`, full `border` | Verified | Exports cleanly as rounded paths. |
| Single-side border, `overflow: hidden` | Verified problem | Produces content clip groups, which can't be exported. Use sized divs instead. |
| Grid, `text-wrap: balance`, `text-fit`, transforms, filters, gradients, shadows | Upstream | Gradients and filters go through ppt-master's effect rules, so run the quality gate before shipping. |

## Text

- Wrapping and line height work (see the quote slide). Nothing auto-shrinks text to fit, so
  shorten copy or size the box.
- `textTransform: "uppercase"` and `letterSpacing` are verified (section eyebrow).
- Output is glyph outlines. PowerPoint sees shapes, not text, so there's no spell-check, no
  font substitution, and no text editing.

## Fonts

- Takumi **never reads system fonts**. With no `fonts` option you get the built-in **Geist**
  (Latin, weights 300–800), which is a **subset**: `ç ö ü ı İ` render but `ş` and `ğ` are
  tofu (verified). So `packages/renderer/src/fonts.ts` registers the full static Geist faces
  from the `geist` npm package (Light 300 … Black 800) as family **`Geist Sans`**, and
  `defaultTheme.font.family` is `Geist Sans`. A registered face named plain `Geist` loses to
  the built-in one at the same weight (verified), hence the distinct name.
- Missing glyphs render as tofu boxes. Verified missing: `→`. Treat other arrows and check
  marks (`✓`, `✔`), plus emoji, as missing. Verified present: `—`, `…`, `·`, `“ ”`, `$`, `%`.
- To use another font, add it to `loadFonts()` in `packages/renderer/src/fonts.ts` (every
  `renderSvg` / `render` call in `render.ts` passes those fonts), with entries like `{ name, data }` or helper output
  such as `googleFonts([...])` (upstream API). Then set `theme.font.family` to match.
  CJK, Arabic, and similar scripts need a font that covers them. After that, the deck's
  `lang` should use the right BCP-47 tag.

## Images and emoji

These are upstream only here. Remote images must be fetchable at render time, and ppt-master
embeds `<image>` elements as pictures. Nothing in this repo uses them yet, so verify the
quality gate and export before relying on them.
