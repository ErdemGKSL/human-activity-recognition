---
name: add-slide-layout
description: Add a new slide layout (e.g. timeline, two-column, image+text) to the deck generator — data type in @pptx/core, JSX component in @pptx/slides, registry wiring, mock usage, and visual verification. Use when the user asks for a new kind of slide.
---

# Add a slide layout

> **Scope: `slides/`** — this skill covers the PPTX pipeline in `slides/` only. Paths below
> are relative to `slides/`, and `bun run …` commands run from there. PDFs (`report/`,
> `slide-directions/`) are covered by [pdf-documents](../pdf-documents/SKILL.md).

Read [takumi-rendering](../takumi-rendering/SKILL.md) first if you haven't written a
layout here before. Its rules (no single-side borders, no `overflow: hidden`, and the font's
missing glyphs) will fail the export if you ignore them.

The type system drives this: once the layout exists in `Slide`, `tsc` fails until it is
wired everywhere. Follow the steps in order.

## 1. Data type (`packages/core/src/deck.ts`)

Add an interface that extends `SlideBase`, with a unique `layout` literal and only the
fields the layout needs:

```ts
export interface TimelineSlide extends SlideBase {
  layout: "timeline";
  title: string;
  events: { date: string; label: string }[];
}
```

Add it to the `Slide` union, then add its entry to `PAGE_ROLE`. Use `content` unless it's a
cover, agenda (`toc`), section divider, or closing (`ending`) slide.

## 2. Component (`packages/slides/src/layouts/<Name>.tsx`)

```tsx
import { Heading, SlideFrame } from "../components";
import type { LayoutProps } from "../types";

export function Timeline({ slide, ...ctx }: LayoutProps<"timeline">) {
  const { theme } = ctx;
  return (
    <SlideFrame {...ctx}>
      <Heading theme={theme}>{slide.title}</Heading>
      {/* ... */}
    </SlideFrame>
  );
}
```

Follow the slide authoring rules in `AGENTS.md`:
- Every container is `display: "flex"`. Style with inline objects and theme tokens only.
- Don't use `overflow: hidden` or single-side borders. Draw rules and bars as sized divs
  with `backgroundColor`.
- Keep the content inside the 1280×720 canvas. `SlideFrame` already applies page padding
  and the footer.
- Give it motion: wrap each unit that should build in
  `<Animate id="…" animation={{ effect: "entrance_fade" }} style={…}>`, where `Animate` is
  the box itself. Blocks must not nest or overlap. Choose defaults with
  [motion-design](../motion-design/SKILL.md) (restraint, timing) and
  [pptx-object-animations](../pptx-object-animations/SKILL.md) (which effect). Add a
  `morph` prop if the element should carry across slides
  ([pptx-morph](../pptx-morph/SKILL.md)). The mechanism is described in
  [animate-slides](../animate-slides/SKILL.md#the-animate-block-mechanism).

## 3. Register (`packages/slides/src/layouts/index.ts`)

Import the component, add it to the `layouts` map under the same key as `layout`, and add
it to the named export list.

## 4. Mock usage (`packages/mock-data/src/decks/*.ts`)

Add at least one slide that uses the new layout, with fictional data only.

## 5. Verify

```bash
bun run check                                   # lint + docs + tsc + tests, whole repo
bun run generate <deck-id> --png                # full pipeline incl. ppt-master gate
```

Open `output/<deck-id>/preview/<NN>_<slide-id>.png` and check the layout visually. If the
normalizer throws `SvgNormalizeError`, a style is producing a clip group. See rule 1 in
`AGENTS.md`.
