# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, …) working in this repo.
`CLAUDE.md` is a symlink to this file. **Edit `AGENTS.md` only.**

This file is the overview. The depth lives in **skills** (`.claude/skills/`, mirrored at
`.agents/skills/`). The [skill map](#skill-map-read-this-when) below tells you which skill
to read for which task. Read the linked `SKILL.md` before you start that kind of work, and
follow its links into `references/` only as far as the task needs.

## What this is

A course project on **Human Activity Recognition (HAR)** from smartphone accelerometer and
gyroscope data (MLP, 1D CNN, LSTM, GRU). This repo produces its deliverables. It has three
areas that share one Bun workspace and one toolchain:

| Folder | Produces | How |
| --- | --- | --- |
| [`slides/`](slides/README.md) | The presentations as native `.pptx` | deck data → Takumi JSX → SVG → ppt-master |
| [`report/`](report/README.md) | The written reports as PDF, plus the shared JSX → PDF converter | JSX → takumi-pdf |
| [`slide-directions/`](slide-directions/README.md) | One presenter guide PDF per deck (narrator script, what each number means, fun facts, tips) | deck data + directions → takumi-pdf |

Slides show numbers and few words; the presenter guide carries the story. Every deck in
`slides/packages/decks` has a guide in `slide-directions/src/directions/` with one entry per
slide (a test keeps them in sync).

### Deliverables

| Deliverable | Area | Id | Due |
| --- | --- | --- | --- |
| 1. Sunum – Project Proposal (5–10 dk): problem and its importance, dataset, ANN models, expected results | slides + guide; **upload: the deck as PDF only** (`--pdf`) | `proposal` | PDF 18.10.2026 23:55; talk 19.10.2026 |
| Literature Review Raporu | report | `literature-review` | 01.11.2026 23:55 |
| 2. Sunum – Literature Review (15–20 dk) | slides + guide | `literature-review` | 02.11 or 09.11.2026 |
| Final Results Raporu (plain PDF for the instructor) | report | `final-results` | 29.11.2026 23:55 |
| 3. Sunum – Final Results (20–30 dk, live demo if possible) | slides + guide | `final-results` | 30.11 or 07.12.2026 |

The source of truth for these is `report/src/project.ts` (`deliverables`). Everything is a
skeleton for now: unfinished parts are `todoSlide()` slides, `<Todo>` blocks, and empty
`SlideDirection` entries.

## Skill map: read this when…

**Scope matters.** Every skill except `pdf-documents` and `academic-humanizer` is about
**`slides/` only** (the PPTX
pipeline): its paths are relative to `slides/`, and its `bun run …` commands run from
`slides/`. They do not apply to `report/` or `slide-directions/`.

| When you are… | Scope | Read |
|---|---|---|
| Writing or revising **any prose**: report text, presenter-guide scripts, slide text, speaker notes | all areas | [academic-humanizer](.claude/skills/academic-humanizer/SKILL.md) + [Writing prose](#writing-prose) |
| Writing or building a report, filling a presenter guide, adding a PDF component, fixing a PDF render | `report/`, `slide-directions/` | [pdf-documents](.claude/skills/pdf-documents/SKILL.md) |
| Writing or debugging slide JSX, seeing odd SVG, clip errors, tofu glyphs | `slides/` | [takumi-rendering](.claude/skills/takumi-rendering/SKILL.md) |
| Hitting a quality-gate or export error, changing `normalizeSvg` or the Python bridge | `slides/` | [ppt-master-export](.claude/skills/ppt-master-export/SKILL.md) |
| Doing **anything with motion** (always start here) | `slides/` | [animate-slides](.claude/skills/animate-slides/SKILL.md) (the router) |
| Deciding whether or how much to animate, or reviewing motion quality | `slides/` | [motion-design](.claude/skills/motion-design/SKILL.md) |
| Building in-slide motion: builds, emphasis, exits, paths, click triggers | `slides/` | [pptx-object-animations](.claude/skills/pptx-object-animations/SKILL.md) |
| Making the same object move, resize, or re-rank across slides | `slides/` | [pptx-morph](.claude/skills/pptx-morph/SKILL.md) |
| Choosing slide transitions or auto-advance | `slides/` | [pptx-transitions](.claude/skills/pptx-transitions/SKILL.md) |
| Adding a slide layout | `slides/` | [add-slide-layout](.claude/skills/add-slide-layout/SKILL.md) |
| Adding a project deck or a mock (example) deck | `slides/` | [add-mock-deck](.claude/skills/add-mock-deck/SKILL.md) |
| Generating, inspecting, or debugging decks | `slides/` | [generate-deck](.claude/skills/generate-deck/SKILL.md) |
| Bumping the ppt-master pin | `slides/` | [update-ppt-master](.claude/skills/update-ppt-master/SKILL.md) |

## Layout

```
package.json, bun.lock    one Bun workspace: slides/, slides/apps/*, slides/packages/*, report/, slide-directions/
biome.json, tsconfig*.json shared lint/format/type config for all three areas
scripts/check-docs.py     validates skill cross-links, anchors and frontmatter (repo-wide)
.claude/skills/           project skills (mirrored at .agents/skills via symlink)

slides/                   @har/slides — the PPTX pipeline (see below)
report/                   @har/report — reports + the shared converter (@har/report/pdf)
  src/pdf/                  components, fonts, theme, renderPdf()/writePdf() over takumi-pdf
  src/documents/            one .tsx per report + registry
  src/project.ts            project facts and deliverable dates
  output/                   generated PDFs, gitignored
slide-directions/         @har/slide-directions — presenter guides
  src/directions/           one guide per deck id (data)
  src/DirectionsDocument.tsx, src/build.tsx   guide layout; slide thumbnails via @pptx/renderer
  output/                   generated PDFs, gitignored
```

Inside `slides/`:

```
apps/cli/                 @pptx/cli — `bun run generate` entry point (orchestration only)
packages/core/            @pptx/core — Deck/Slide types, PAGE_ROLE, theme tokens, canvas, motion types
packages/decks/           @pptx/decks — the project's real decks + registry (`decks`, `getDeck`)
packages/mock-data/       @pptx/mock-data — template example decks (fictional) + registry
packages/slides/          @pptx/slides — SlideFrame/Heading/Animate components, layouts/, registry
packages/renderer/        @pptx/renderer — renderDeck(), fonts, layers (block split), geometry, normalizeSvg(), Morph linking
packages/ppt-master/      @pptx/ppt-master — Python bridge: paths, workspace, animations sidecar, run
vendor/ppt-master/        git submodule — DO NOT EDIT (bump the pin instead)
scripts/setup.sh                 bootstrap (submodule + bun install + uv sync)
scripts/sync-motion-presets.py   generates motion types + skill catalogs from ppt-master
scripts/inspect-pptx.py          prints transitions / Morph names / animation rows of a .pptx
pyproject.toml, uv.lock   minimal Python env for the exporter (slides/.venv)
output/                   generated, gitignored
```

Dependencies only point downward. In `slides/`: `cli → renderer → slides → core`,
`cli → ppt-master → core`, `cli → decks → core`, and `cli → mock-data → core`; `core`
depends on nothing. Across areas: `slide-directions → report/pdf`, and
`slide-directions → @pptx/decks, @pptx/renderer`. Nothing in `slides/` or `report/` imports
from `slide-directions/`, and `slides/` never imports from `report/`.

## Commands

From the repo root:

| Task | Command |
| --- | --- |
| Bootstrap (first time / after pull) | `bun run setup` |
| Project decks (PPTX + PDF) / reports / presenter guides | `bun run slides` / `bun run report` / `bun run directions` |
| All of the above | `bun run build` |
| Everything that must pass | `bun run check` (lint, docs links, typecheck, tests) |
| Auto-fix formatting | `bun run format` |

From `slides/` (what the `slides/` skills assume):

| Task | Command |
| --- | --- |
| Project decks / also the examples / one deck | `bun run generate` / `bun run generate --examples` / `bun run generate final-results` |
| SVG only (no Python needed) | `bun run generate --svg-only` |
| Also PNG previews (final frame of each slide) | `bun run generate --png` → `slides/output/<deck>/preview/*.png` |
| Also the deck as one PDF (one page per slide, final frame) | `bun run generate --pdf` → `slides/output/<deck>.pdf` |
| Raw Takumi SVG (debug) | `bun run generate --raw` |
| What a .pptx really contains | `bun run inspect output/<deck>.pptx [--slide N] [--json]` |
| List decks | `bun run decks` |
| Regenerate motion types + catalogs | `bun run sync:motion` (after bumping ppt-master) |
| Check / format (proxies to the root) | `bun run check` / `bun run format` |

From `report/` and `slide-directions/`: `bun run build [id…]` (see
[pdf-documents](.claude/skills/pdf-documents/SKILL.md)).

Toolchain: **Bun ≥ 1.3** (runtime, workspaces, and tests; it runs `.ts`/`.tsx` directly with
no build step), **uv** with Python ≥ 3.10 (slide exporter only), **Biome** for lint and
format, and **TypeScript** for types only (`noEmit`). There is no CI (private repo), so
`bun run check` locally is the gate.

## Definition of done

1. `bun run check` passes (repo root).
2. Slides: `bun run generate --png --examples` (in `slides/`) ends with
   `✓ output/<deck>.pptx` for every deck. That means the quality gate, sidecar validation,
   and export read-back all passed.
3. You looked at the PNG previews of every slide you touched, and at the pages of every
   PDF you touched.
4. For motion changes, `bun run inspect` shows the transitions, `!!` Morph names, and
   animation rows you intended.
5. A deck change (slide added, removed or renamed) updates its presenter guide in the same
   commit.
6. If you changed behavior that a skill describes, update that skill in the same commit.
   `lint:docs` catches broken links, but not stale facts.

## Writing prose

Every piece of prose you write or revise goes through
[academic-humanizer](.claude/skills/academic-humanizer/SKILL.md). That covers report sections,
presenter-guide fields (`summary`, `opening`, `script`, `data`, `questions`…), slide text and
speaker notes. Follow its process (read, audit, rewrite, report), and end with its short change
report in your reply to the user.

The skill is written for English papers. This is how it applies here:

- **Document type.** Reports (`report/`) are papers: use Layers 1–5. The proposal deck and its
  guide are a course project proposal: use Layer 6's claim ↔ feasibility discipline, not the
  NSF/NIH structure rules. Presenter-guide scripts are spoken text, so they may be shorter and
  more direct than report prose, but they get the same claim discipline.
- **Turkish AI tells** to remove, in addition to the English catalog: "Son yıllarda … giderek
  artan bir ilgi görmektedir", "… büyük önem taşımaktadır", "… kritik/önemli bir rol
  oynamaktadır", "… yol açmaktadır / zemin hazırlamaktadır", "… ışık tutmaktadır",
  "kapsamlı/geniş çaplı deneyler", "yenilikçi/çığır açan", "Ayrıca/Bunun yanı sıra/Öte yandan"
  at the start of consecutive sentences, "belirtmek gerekir ki", "şunu vurgulamak
  gerekir", and "-mektedir" sentences stacked with "ve", "ile", "olup".
- **Em-dash (—)** is removed from prose, as the skill says. Layout labels generated by code
  (e.g. `Slayt 4/10 — Veri Seti`) are not prose.
- **Tense stays honest.** Before experiments exist, use proposal tense ("planlanmaktadır",
  "karşılaştırılacaktır", "beklenmektedir"). Never state a result that no experiment produced.
  Once results exist, every number in text points to its table or figure (Layer 4).
- **Never change** a number, dataset fact, citation, metric name, or English technical term
  (MLP, 1D CNN, LSTM, GRU, F1-score, Confusion Matrix…) during a pass.
- **Terminology: don't translate jargon whose Turkish form is rarely used.** Keep it in
  English with Turkish suffixes after an apostrophe: feature (not öznitelik), feature
  vector, feature engineering, window/windowing (not pencere), overlap, baseline (not
  referans model), pattern (not örüntü), temporal dependency, representation, recurrent,
  convolutional, gate, cell state, hidden size, validation set, data leakage, class-weighted
  loss, low-pass filter, postural transition, flatten. Turkish that is in common use stays
  Turkish: eğitim/test kümesi, ön işleme, normalizasyon, sınıflandırma, veri seti, model,
  katman, parametre.
- No voice sample from the author is in the repo yet. Default to clean, precise, neutral
  Turkish academic prose; if the author supplies earlier writing, match it (Layer 5).

The skill is vendored from
[AIScientists-Dev/academic-humanizer](https://github.com/AIScientists-Dev/academic-humanizer)
(MIT, commit `94b88b2`). Don't edit its files; put project-specific rules here instead, and
update it by copying the upstream `SKILL.md`, `LICENSE` and `examples/` again.

## Slide authoring rules (Takumi → ppt-master, `slides/`)

The reasons are in [takumi-rendering](.claude/skills/takumi-rendering/SKILL.md) and
[ppt-master-export](.claude/skills/ppt-master-export/SKILL.md).

1. **No clipping around content**: no `overflow: hidden`, and no single-side borders. Draw
   rules and accent bars as sized `<div>`s. Full borders and `borderRadius` are fine.
2. **Every box is `display: "flex"`**, styled with inline `style` objects that read theme
   tokens. Never hard-code colors. Decks override tokens with `deck.theme`.
3. **The canvas is fixed at 1280×720** (`CANVAS`, which is ppt-master's `ppt169`).
4. **Text exports as native, editable PowerPoint text**: one text box per paragraph, rebuilt
   from takumi-pdf's real PDF text ([native-text](.claude/skills/takumi-rendering/references/native-text.md)).
   Text-formatting animation effects are still off: animations target block groups.
5. **Carlito is the only font**, and PowerPoint shows it as Calibri (identical metrics, so
   lines break the same). Weights snap to 400/700. Uppercase with `upper(text, lang)`, not
   `textTransform` (not Turkish-aware). `→` and similar symbols render as tofu boxes.
   Emoji and remote images are unverified.
6. **Root groups must not overlap** (a ppt-master rule). `<Animate>` blocks must not nest or
   overlap each other or static content, and their ids avoid chrome tokens
   (`SLIDE_CHROME_TOKENS`).
7. **Slides stay light.** Put numbers and visuals on the slide; put the explanation in the
   deck's presenter guide, not in long slide text.

## Motion in one paragraph

Everything that moves is an **`<Animate>` block**: a layout's box that becomes its own
PowerPoint group (`anim-<id>`). Layouts set default animations. Deck data overrides them
per slide (`slide.animations[blockId]`) or turns them off (`animate: false`). Transitions
come from `deck.transition` / `slide.transition`. Blocks that share a `morph` key on
consecutive slides get paired, and the destination slide gets a Morph transition. Effect
and transition names are generated TypeScript unions (203 and 48). `motion-showcase` is the
reference deck. The details are in [animate-slides](.claude/skills/animate-slides/SKILL.md)
and the skills it links to.

## Research notes (verified in this repo)

These facts took experiments to establish. Each links to the skill that owns it.

- Takumi's SVG has **no element ids or `data-*`**, text is `<use>` glyph outlines, and
  def ids are renumbered per render. That's why blocks are found by re-rendering with one
  block hidden and diffing →
  [svg-output-anatomy](.claude/skills/takumi-rendering/references/svg-output-anatomy.md).
- `fromJsx` **keeps** `id` and `data-*` on the node tree. `@takumi-rs/core` has
  `measure()`, which `takumi-js` doesn't re-export →
  [takumi-rendering](.claude/skills/takumi-rendering/SKILL.md#apis-you-may-need).
- Takumi's SVG has no text, but **takumi-pdf writes real text** from the same layout: per
  line the face, size, colour, alpha and baseline in CSS px (letter-spacing hides in `TJ`
  offsets, centring in a leading `TJ` offset). Reading it back and pairing it with the SVG
  glyph runs and `measure()` paragraphs gives editable PPTX text →
  [native-text](.claude/skills/takumi-rendering/references/native-text.md).
- Carlito ≡ Calibri metrics (ppt-master's Calibri table matches to 4 decimals). ppt-master's
  width estimate lacks Turkish `ı`, so group bounds widen into free space to pass the gate →
  [native-text](.claude/skills/takumi-rendering/references/native-text.md#the-quality-gate-and-bounds).
- Takumi's built-in Geist is a subset (`ş`/`ğ` are tofu), and it synthesizes missing
  weights as stroked outlines → [fonts](.claude/skills/takumi-rendering/references/layout-and-css.md#fonts).
- `visibility: hidden` hides a whole subtree, and children can't opt back in.
- ppt-master fails any root-group overlap larger than 1px. It needs a passing
  `--json` quality report before quick export, and notes need `--with-notes` →
  [ppt-master-export](.claude/skills/ppt-master-export/SKILL.md).
- Adding easing to `path_*` presets fails export read-back (accel + decel > 100%) →
  [modifiers](.claude/skills/pptx-object-animations/references/modifiers-and-triggers.md).
- Morph pairs need an explicit `morph` transition on the destination slide, and shapes are
  named `!!key` on both slides → [pptx-morph](.claude/skills/pptx-morph/SKILL.md).
- takumi-pdf rejects `break-after: avoid`; `break-inside: avoid` and `break-before: page`
  work → [pdf-documents](.claude/skills/pdf-documents/SKILL.md#gotchas-verified-with-takumi-pdf-015).
- LibreOffice in the cloud container can't open any PPTX, so verify with `bun run inspect`
  and the PNG previews. PDFs can be rasterized with PyMuPDF (`uv run --with pymupdf`).

## Conventions

- ESM, strict TypeScript, and `noUncheckedIndexedAccess`. Use `import type` for types
  (`verbatimModuleSyntax`).
- Workspace packages export `./src/index.ts` directly. There's no build output and no
  `dist/`.
- Package scopes: `@pptx/*` inside `slides/`, `@har/*` for the areas themselves. Internal
  dependencies use `"workspace:*"`.
- Tests are `*.test.ts(x)` files next to the source, using `bun:test`. They must not need
  Python.
- Comments explain *why* (especially constraints that come from ppt-master or Takumi), not
  *what*.
- **Mock data is fictional** (`@pptx/mock-data`): no real companies, people, or figures,
  and contact details use `.example` domains. Project decks, reports and guides hold the
  real project content.
- Project content (slides, reports, guides) is written in Turkish (`lang: "tr-TR"`);
  technical terms (MLP, F1-score, confusion matrix…) stay in English.
- Never edit `slides/vendor/ppt-master`. Adapt `normalizeSvg` or `@pptx/ppt-master` instead.
- Never pass `--enable-dangerous-nonconforming-svg-export`.
- Never hand-edit generated files. That means `motion-presets.generated.ts`,
  `effect-catalog.md`, and `transition-catalog.md`; run `bun run sync:motion` instead.
- Skills link to each other with relative Markdown links. Keep the links and `#anchors`
  valid (`bun run lint:docs`).

## Environment overrides

- `PPT_MASTER_DIR`: an alternative ppt-master checkout (default `slides/vendor/ppt-master`)
- `PPT_MASTER_PYTHON`: the Python interpreter (default `slides/.venv/bin/python`)
