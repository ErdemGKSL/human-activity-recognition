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
- `letterSpacing` is verified (section eyebrow) and exports as run spacing (`spc`).
- `textTransform: "uppercase"` works but ignores the locale ("Girdi" becomes "GIRDI"). Use
  `upper(text, deck.lang)` from the slides components instead.
- The export is native PowerPoint text (editable, spell-checked, `lang` from the deck); see
  [native-text.md](native-text.md).

## Fonts

- Takumi **never reads system fonts**. With no `fonts` option you get the built-in **Geist**,
  a **subset**: `ç ö ü ı İ` render but `ş` and `ğ` are tofu (verified). Slides don't use it.
- Slides use **Carlito** (`packages/renderer/src/fonts.ts`, `defaultTheme.font.family`),
  metric-compatible with Calibri, which the PPTX names. See
  [native-text.md](native-text.md#fonts-carlito-on-our-side-calibri-in-powerpoint).
  Carlito covers Turkish. Its faces are 400/700 regular and italic, so `snapFontWeights`
  maps every weight to one of those: a synthesized weight is drawn as stroked outlines,
  which the text export rejects.
- Missing glyphs render as tofu boxes. Treat arrows (`→`), check marks (`✓`, `✔`) and emoji
  as missing. `—`, `…`, `·`, `“ ”`, `×`, `$` and `%` are present.
- Changing the font means changing both names in `fonts.ts`: the layout font (`FONT_FAMILY`,
  files in `FILES`) and the PowerPoint typeface (`POWERPOINT_TYPEFACE`). They must be
  metric-compatible, or PowerPoint will wrap lines differently from the previews. CJK,
  Arabic and similar scripts need a font that covers them, and the deck's `lang` should
  use the right BCP-47 tag.

## Images and emoji

These are upstream only here. Remote images must be fetchable at render time, and ppt-master
embeds `<image>` elements as pictures. Nothing in this repo uses them yet, so verify the
quality gate and export before relying on them.
