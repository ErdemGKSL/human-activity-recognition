---
name: pdf-documents
description: The JSX → PDF side of the repo — the shared takumi-pdf converter (report/src/pdf), the course reports in report/ (Literature Review, Final Results), and the per-deck presenter guides in slide-directions/ (narrator script, what each number means, fun facts, tips, likely questions). Use when writing or building a report, adding/filling a presenter guide, adding a PDF component, or when a PDF render fails (missing glyph, unsupported CSS, page breaks).
---

# PDF documents (report/ and slide-directions/)

> **Scope: `report/` and `slide-directions/`.** Paths below are relative to the repo root.
> The slide decks themselves are the `slides/` skills (start at
> [generate-deck](../generate-deck/SKILL.md)).

## Pipeline

```
report/src/documents/*.tsx        slide-directions/src/directions/*.ts  +  @pptx/decks (slides)
        │                                    │  DirectionsDocument.tsx (+ slide PNGs via @pptx/renderer)
        └──────────────┬─────────────────────┘
                       ▼
        report/src/pdf  (@har/report/pdf)   components + renderPdf() → takumi-pdf (wasm, no browser)
                       ▼
  report/output/<id>.pdf            slide-directions/output/<deck-id>.pdf
```

- **takumi-pdf** (`takumi-pdf` on npm, same Takumi engine as the slides) lays out JSX with
  flexbox and writes vector PDF with selectable text, embedded font subsets, and a bookmark
  outline built from `h1`–`h6` (`outline: true`).
- `@har/report/pdf` is the only place that calls takumi-pdf. Both packages import from it.

## Commands (repo root)

| Task | Command |
| --- | --- |
| Build every report | `bun run report` (or `cd report && bun run build [id…]`) |
| Build every presenter guide | `bun run directions` (or `cd slide-directions && bun run build [deck-id…] [--no-thumbnails]`) |
| Everything (slides + PDFs) | `bun run build` |
| Tests (no Python needed) | `bun run check` |

## Where things live

| What | File |
| --- | --- |
| Project facts, authors, deliverable dates | `report/src/project.ts` |
| Components (`Document`, `TitlePage`, `Section`, `SubSection`, `Table`, `Callout`, `Todo`, `FigurePlaceholder`…) | `report/src/pdf/components.tsx` |
| Page setup (A4, margins, footer with page numbers, metadata) | `report/src/pdf/render.tsx` |
| Fonts | `report/src/pdf/fonts.ts` |
| Design tokens | `report/src/pdf/theme.ts` |
| Reports + registry | `report/src/documents/` |
| Presenter guide data model | `slide-directions/src/types.ts` |
| One guide per deck | `slide-directions/src/directions/<deck-id>.ts` |
| Guide layout | `slide-directions/src/DirectionsDocument.tsx` |

## Writing the text

All prose (report sections, guide scripts, Q&A answers) is written and revised with
[academic-humanizer](../academic-humanizer/SKILL.md), following the Turkish and project notes
in the "Writing prose" section of `AGENTS.md`.

## Adding or filling a report

1. Write sections as JSX in `report/src/documents/<id>.tsx` with the components above.
   Replace each `<Todo>` as you go; `grep -rn "<Todo" report/src` lists what is left.
2. A new report also needs a `deliverables` entry in `project.ts` and a registry entry in
   `documents/index.ts`.
3. `bun run report`, then look at the pages (see [Verify](#verify)).

## Filling a presenter guide

Slides carry numbers and few words; the guide carries the story. Each slide id of the deck
gets a `SlideDirection`: `time`, `goal` (one sentence), `script` (paragraphs to tell, not
read), `data` (each number or visual on the slide and what it means), `funFacts`, `tips`
(delivery cues: point, pause, click), `visuals` (suggested charts or diagrams), `questions`
(likely questions with answers), and `transition` (the bridge sentence into the next slide).
Talk-wide fields go on the guide itself: `summary` (one paragraph), `opening` (a timed
opening speech), `overview`, per-slide `speakers`, `questions` (the instructor's likely
questions, printed at the end), and `glossary` (terms kept in English with their meaning,
printed A to Z as an appendix). `proposal.ts` is the filled-in reference guide.

- A test fails unless the guide has **exactly** the deck's slide ids. After adding,
  removing or renaming a slide in `slides/packages/decks`, update the guide in the same
  commit.
- Thumbnails are rendered live from the deck (raw Takumi PNG, no Python), so the guide
  always shows the current slides.

## Gotchas (verified with takumi-pdf 0.15)

- **Fonts:** Takumi never reads system fonts, and an uncovered character fails the render.
  `fonts.ts` registers full Geist (sans + mono) from the `geist` npm package; it covers
  Turkish. Symbols such as `→` or emoji are not covered, so avoid them or register a font.
- **`break-after: avoid` is rejected** (only `auto`/`page`/`always`/`left`/`right`). To keep a
  heading with its content, `SubSection` uses `breakInside: "avoid"` on the whole block.
  Use `newPage` on `Section` or `breakBefore: "page"` for hard breaks.
- **Images** are never fetched or read by takumi-pdf. Pass bytes through
  `renderPdf(…, { images: [{ src, data }] })` and reference the same `src` in `<img>`.
- CSS `@page` is unsupported; page size and margins come from `renderPdf` options. Blur,
  `drop-shadow` and `backdrop-filter` are rejected.
- Every box should be `display: "flex"` with an explicit `flexDirection`, as in the slides.

## Verify

Look at the pages, not just the exit code. In the cloud container, rasterize with PyMuPDF:

```bash
uv run --with pymupdf python -c "import pymupdf,sys; d=pymupdf.open(sys.argv[1]); [p.get_pixmap(dpi=60).save(f'/tmp/p{i+1}.png') for i,p in enumerate(d)]; print(d.get_toc())" report/output/final-results.pdf
```

Check the bookmark outline (`get_toc`), orphaned headings at page bottoms, and tables that
overflow the page width.
