# slides — presentations (PPTX)

The presentation part of the [Human Activity Recognition project](../README.md). It turns
**typed deck data** into a **native PowerPoint file**.
Slides are written as React JSX, rendered to vector SVG by [Takumi](https://github.com/kane50613/takumi),
and compiled to DrawingML shapes by [ppt-master](https://github.com/hugohe3/ppt-master).
No headless browser is involved, and the output contains no screenshots.

```
deck data  ──►  JSX layouts  ──►  Takumi SVG  ──►  normalize  ──►  ppt-master  ──►  .pptx
(@pptx/decks)   (@pptx/slides)   (@pptx/renderer)                 (@pptx/ppt-master)
```

## Quick start

Requirements: [Bun](https://bun.sh) ≥ 1.3, [uv](https://docs.astral.sh/uv/), and git.

```bash
git clone --recurse-submodules <this repo>
cd human-activity-recognition/slides
bun run setup            # submodule + bun install (repo root) + uv sync (slides/.venv)
bun run generate --png   # → output/*.pptx (+ PNG previews)
```

Project decks (`packages/decks`, skeletons for now; each has a presenter guide in
[`../slide-directions`](../slide-directions/README.md)):

| Deck | Presentation | Date |
| --- | --- | --- |
| `proposal` | 1. Sunum – Project Proposal (5–10 dk) | 19.10.2026 |
| `literature-review` | 2. Sunum – Literature Review (15–20 dk) | 02.11 or 09.11.2026 |
| `final-results` | 3. Sunum – Final Results (20–30 dk) | 30.11 or 07.12.2026 |

Template example decks (`packages/mock-data`, fictional, built with `--examples`):

| Deck | Slides | Notes |
| --- | --- | --- |
| `quarterly-review` | 8 | Every layout, light theme, speaker notes, fade/push transitions, auto-playing builds, a presenter-paced KPI slide with an ordered pulse |
| `product-launch` | 4 | Dark theme override, cover transition, click-to-reveal bar chart |
| `motion-showcase` | 13 | Morph resize/move/recolor, camera push-in and pull-out, Morph re-sort, motion paths, looping emphasis, enter→emphasize→exit, "On click of" triggers (including on a Morph-paired object), dim-after build |

## Commands

```bash
bun run generate [deck-id...]   # full pipeline (default: project decks)
  --examples                    #   also the template example decks
  --svg-only                    #   stop after SVG (no Python needed)
  --png                         #   also write PNG previews
  --raw                         #   raw Takumi SVG, skip normalization (debug)
  -o, --out <dir>               #   output root (default ./output)
bun run decks                   # list deck ids
bun run inspect output/<deck>.pptx   # transitions, Morph pairs, animation rows per slide
bun run check                   # biome lint + docs links + tsc + bun test (whole repo)
bun run format                  # biome auto-fix
```

## Repository layout

```
apps/
  cli/                 @pptx/cli         pipeline entry point (bun run generate)
packages/
  core/                @pptx/core        Deck/Slide types, theme tokens, canvas, page roles
  decks/               @pptx/decks       the project's decks + registry
  mock-data/           @pptx/mock-data   template example decks + registry
  slides/              @pptx/slides      JSX components and one layout per slide type
  renderer/            @pptx/renderer    Takumi renderSvg + SVG normalizer (tested)
  ppt-master/          @pptx/ppt-master  Python bridge: workspace, quality gate, export
vendor/
  ppt-master/          git submodule (pinned), used only for its SVG → PPTX exporter
scripts/setup.sh       bootstrap
pyproject.toml         minimal Python env for the exporter (uv)
../AGENTS.md           agent/contributor guide + skill map  (CLAUDE.md → symlink)
../.claude/skills/     project skills; all but pdf-documents are about slides/
```

## Slide layouts

`cover`, `agenda`, `section`, `metrics`, `bar-chart`, `table`, `quote`, `closing`, and
`stage`. `stage` places objects freely from data and is the layout for Morph and motion
work.

A deck is plain data:

```ts
import { defineDeck } from "@pptx/core";

export const myDeck = defineDeck({
  id: "my-deck",
  title: "My Deck",
  lang: "en-US",
  slides: [
    { id: "cover", layout: "cover", title: "Hello", subtitle: "World" },
    {
      id: "kpis",
      layout: "metrics",
      title: "KPIs",
      metrics: [{ label: "ARR", value: "$1.2M", delta: "+12%", tone: "positive" }],
      notes: "Speaker notes land in PowerPoint.",
    },
  ],
});
```

To add a layout, deck, or theme, see [AGENTS.md](../AGENTS.md) and the skills in `../.claude/skills/`.

## Transitions and animations

The exported decks use native PowerPoint motion. It shows up in PowerPoint's Transitions
tab and Animation Pane, and you can edit it there.

```ts
defineDeck({
  // …
  transition: { effect: "fade", duration: 0.5 },          // default for every slide
  slides: [
    { id: "part-2", layout: "section", title: "Part 2",
      transition: { effect: "push", options: { direction: "up" } } },
    { id: "kpis", layout: "metrics", title: "KPIs", metrics: [/* … */],
      animations: {                                        // override layout defaults
        "metric-0": [{ effect: "entrance_zoom" }, { effect: "emphasis_teeter" }],
        "metric-3": "none",
      } },
    { id: "cover", layout: "cover", title: "Hi", animate: false },
  ],
});
```

**Morph**: when two consecutive slides both have an object with the same `morph` key,
PowerPoint's Morph transition moves, resizes and recolors it between them. The pairs are
declared automatically:

```ts
{ id: "a", layout: "stage", objects: [{ id: "orb", shape: "circle", x: 140, y: 300,
  width: 160, height: 160, fill: "primary", morph: "orb" }] },
{ id: "b", layout: "stage", objects: [{ id: "orb", shape: "circle", x: 720, y: 150,
  width: 440, height: 440, fill: "accent", morph: "orb" }] },
```

Steps also support `triggerShape` (click one object to animate another), `repeatCount`,
`autoReverse`, `afterEffect` (dim or hide), easing, and multi-step lifecycles.

Layouts decide what can animate by wrapping boxes in `<Animate id animation>`. Every
built-in layout ships with sensible defaults: agenda items fly in, KPI cards rise, bars
wipe, and table rows fade. Effect and transition names are typed from ppt-master's
registry: 203 object effects and 48 transitions.

## Skills for AI agents

`../.claude/skills/` holds cross-linked guides that coding agents load on demand. They live
at the repo root but (except `pdf-documents`) apply to this folder. Start from the skill map
in [AGENTS.md](../AGENTS.md#skill-map-read-this-when).

| Skill | What it covers |
| --- | --- |
| `takumi-rendering` | Takumi's CSS and layout, fonts, SVG output anatomy, verified gotchas |
| `ppt-master-export` | The flat-page SVG contract, quality gate, CLI, sidecar mapping, error decoder |
| `animate-slides` | Where all motion work starts: a router, the `<Animate>` mechanism, and the verify loop |
| `motion-design` | When and how much to animate, timing, choreography, and anti-patterns |
| `pptx-object-animations` | Entrance, emphasis, exit, and path effects; triggers and modifiers; recipes; a catalog of all 203 effects |
| `pptx-morph` | Grow and move, camera push-in, re-sort, chains, and limits |
| `pptx-transitions` | Choosing transitions by slide relationship, auto-advance, and a catalog of all 48 |
| `add-slide-layout`, `add-mock-deck`, `generate-deck`, `update-ppt-master` | Step-by-step workflows |

The catalogs are generated from ppt-master (`bun run sync:motion`), and `bun run lint:docs`
keeps every cross-link and `#anchor` valid.

## How the SVG bridge works

Takumi's SVG is valid SVG, but ppt-master's exporter only accepts its own
"flat page" contract. `normalizeSvg` (`packages/renderer/src/normalize-svg.ts`)
makes the following changes:

- It stamps `lang` and `data-pptx-page-role` on the root, and hoists `<defs>`.
- It removes the empty clip groups that Takumi emits for rounded boxes.
- It marks the full-canvas rect as the background and wraps the rest of the page in one
  bounded `<g>`. On animated slides it instead creates one bounded `<g>` per `<Animate>`
  block, plus groups for the static content between them. To find a block's elements, it
  re-renders the slide with that block hidden and diffs the result.
- It canonicalizes colors to `#RRGGBB`.

After that, ppt-master's `svg_quality_checker.py` gates the SVG and `svg_to_pptx.py` writes
the deck.

## Known limitations

- **Text is exported as vector glyph outlines**, not editable text boxes, because Takumi's
  SVG backend outlines glyphs. It stays sharp at any zoom but can't be edited as text in
  PowerPoint. Shapes, bars, and cards are native, editable shapes.
- Layouts must avoid `overflow: hidden` and single-side borders, which Takumi turns into
  clip groups. The renderer throws a clear error if a layout uses them.

## License

This repo doesn't declare a license yet. Its dependencies are licensed separately:
`vendor/ppt-master` is MIT, and `takumi-js` is MIT/Apache-2.0.
