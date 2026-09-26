---
name: takumi-rendering
description: How Takumi (takumi-js) turns this repo's React JSX slides into SVG/PNG — supported CSS and layout, fonts and missing glyphs, the exact shape of its SVG output (glyph outlines, <use> refs, clip groups), node tree / measure APIs, and verified gotchas. Use whenever you write or debug JSX in packages/slides, see odd SVG output, missing-glyph boxes, clip-path errors, layout that renders differently than a browser, or need to change packages/renderer.
---

# Takumi rendering

> **Scope: `slides/`** — this skill covers the PPTX pipeline in `slides/` only. Paths below
> are relative to `slides/`, and `bun run …` commands run from there. PDFs (`report/`,
> `slide-directions/`) are covered by [pdf-documents](../pdf-documents/SKILL.md).

[Takumi](https://github.com/kane50613/takumi) is a Rust layout and paint engine for JSX
and CSS. This repo uses `takumi-js@2.x` in two ways (`packages/renderer/src/render.ts`):

- `renderSvg(node, { width: 1280, height: 720 })` produces the vector slide, which ppt-master
  then converts to native PPTX shapes.
- `render(node, { format: "png" })` produces PNG previews only (`--png`).

The facts below were **verified in this repo**, not taken from the docs alone. When you
build on one of them, keep it true, and when a Takumi upgrade changes one, update this
file.

## Mental model

Takumi behaves like a Satori-style flexbox renderer: every element is a box, layout is
Flexbox, Grid, block, or absolute positioning, and there are no browser defaults you can
rely on. Write every container with `display: "flex"` and explicit sizes, gaps, and
padding. Style comes from inline `style={{…}}` objects that read theme tokens
(`packages/core/src/theme.ts`).

## Rules that matter for PPTX export

These rules exist because of how Takumi's SVG output meets ppt-master's contract. The
reasons are in [references/svg-output-anatomy.md](references/svg-output-anatomy.md).

1. **No `overflow: hidden` and no single-side borders** (`borderLeft`, `borderBottom`, and so
   on). Takumi emits these as `<g clip-path>` wrapping content, which ppt-master can't
   export, so `normalizeSvg` throws. Draw rules and bars as sized `<div>`s with
   `backgroundColor`. Full borders and `borderRadius` are fine, because they only produce
   empty clip groups that get dropped.
2. **Text becomes vector glyph outlines**, not PowerPoint text. It's crisp but not editable
   as text, and text-formatting animation effects have nothing to act on (see
   [pptx-object-animations](../pptx-object-animations/SKILL.md#effects-that-dont-fit-this-pipeline)).
3. **Fonts: the full Geist, registered as `Geist Sans`** by `packages/renderer/src/fonts.ts`
   (Takumi's built-in Geist is a subset that draws Turkish `ş`/`ğ` as tofu, verified). Geist
   has no `→` (verified), and likely no other symbols such as `✓`, arrows, or emoji. Missing
   glyphs render as tofu boxes. `—`, `…`, `·` and curly quotes are fine. See
   [references/layout-and-css.md#fonts](references/layout-and-css.md#fonts).
4. **`visibility: hidden` drops the whole subtree.** A child with `visibility: visible`
   inside a hidden parent is not shown (verified). The layering code relies on hiding one
   `<Animate>` block at a time while keeping its layout box.
5. **Absolute positioning** (`position: "absolute"`, `left`, `top`) positions relative to the
   parent box. The `stage` layout puts objects directly under a full-canvas root, so
   `x`/`y` are canvas pixels.

## APIs you may need

| Need | API | Notes |
|---|---|---|
| JSX to Takumi node tree | `fromJsx(element)` from `takumi-js/helpers/jsx` | Returns `{ node, css }`. Keeps `id` and `attributes` (`data-*`), which is how `<Animate>` markers survive. |
| Vector output | `renderSvg(nodeOrElement, { width, height })` | Accepts the node tree, so render once and reuse. |
| Raster preview | `render(node, { width, height, format: "png" })` | |
| Layout boxes | `Renderer#measure(node, opts)` in `@takumi-rs/core` | Gives absolute `transform`, `width`, `height` and text runs per node. `takumi-js` doesn't re-export it. Not used today; geometry comes from the SVG instead. |

## Where to go next

- The SVG Takumi emits and how `normalizeSvg` / `layers.ts` reshape it:
  [references/svg-output-anatomy.md](references/svg-output-anatomy.md)
- CSS and layout support, fonts, and verified behaviors:
  [references/layout-and-css.md](references/layout-and-css.md)
- What the exporter needs from that SVG: [ppt-master-export](../ppt-master-export/SKILL.md)
- Making parts of a slide animatable (`<Animate>`): [animate-slides](../animate-slides/SKILL.md)
- Adding a whole layout: [add-slide-layout](../add-slide-layout/SKILL.md)
