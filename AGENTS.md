# AGENTS.md

Instructions for AI coding agents working in this repo. `CLAUDE.md` is a symlink to this file.
**Edit `AGENTS.md` only.**

## What this is

A course project on Human Activity Recognition (HAR) from smartphone accelerometer and gyroscope
data. The repo is the project. Its deliverable build produces, per deck:

```
dist/<deck-id>/slide.pptx            the deck, written by DeckCraft
dist/<deck-id>/slide.pdf             the same deck as PDF, exported by DeckCraft
dist/<deck-id>/slide-directions.pdf  the presenter guide, rendered by takumi-pdf
```

Only the proposal deck (`proposal`) is in scope for now.

## Layout

```
deck/proposal.ts              the deck content (text and numbers), DeckSpec
deck/types.ts                 DeckSpec / SlideSpec types
scripts/build.ts              entry point: deck → dist/<id>/
scripts/deckcraft.ts          DeckSpec → DeckCraft commands → .pptx, slide PDF, PNGs
slide-directions/             presenter guide: data (src/directions/) + takumi layout
report/                       reports and the shared takumi-pdf converter (report/src/pdf)
.claude/skills/               project skills (mirrored at .agents/skills)
dist/                         generated, gitignored
```

Dependencies point one way: `scripts/` → `deck/`, `slide-directions/` → `report/pdf`.
`slide-directions/` never imports DeckCraft or PPTX code; it takes PNG bytes as input.

## Tools and skills

| Task | Read first |
| --- | --- |
| Building or changing a `.pptx` or the slide PDF | [deckcraft](.claude/skills/deckcraft/SKILL.md) |
| Building or changing a presenter guide or a report, or a takumi PDF render | [pdf-documents](.claude/skills/pdf-documents/SKILL.md) |
| Writing or revising prose (slide text, notes, guide text, reports) | [academic-humanizer](.claude/skills/academic-humanizer/SKILL.md) and [avoid-ai-writing](.claude/skills/avoid-ai-writing/SKILL.md) |

- **takumi is for PDFs only.** Never use takumi to make a PPTX.
- **DeckCraft is for PPTX only**, through the `deckcraft-cli` binary. Build it in release mode.

## Commands

| Task | Command |
| --- | --- |
| Build the proposal (PPTX, slide PDF, guide PDF) | `bun run build` (or `bun run build proposal`) |
| Build the reports | `bun run report` |
| Everything that must pass | `bun run check` (lint, docs links, typecheck, tests) |
| Auto-fix formatting | `bun run format` |
| Remove generated output | `bun run clean` |

The build needs the DeckCraft CLI. Point `DECKCRAFT_CLI` at it, or put `deckcraft-cli` on `PATH`:

```sh
export DECKCRAFT_CLI=~/storytold/deckcraft/target/release/deckcraft-cli
```

## Rules

1. **Release builds only.** Build DeckCraft with `cargo build --release -p deckcraft-cli`. Never
   keep a debug build: the disk is small.
2. **Never run `cargo clean`** on a DeckCraft checkout. A release rebuild from scratch takes
   minutes; deleting the cache throws that away.
3. **Content lives in `deck/`.** Words and numbers that go on a slide belong in `deck/<id>.ts`,
   copied exactly from the source. Layout and theme belong in `scripts/deckcraft.ts`.
4. **Keep the guide in sync.** A test fails unless the guide has exactly the deck's slide ids.
   Change the deck and its guide in the same commit.
5. **Slides stay light.** Numbers and short text go on the slide; the explanation goes in the
   presenter guide.
6. **Don't commit `dist/`.** It is generated and gitignored.
7. **No model identifiers** in commit messages, PR text or code comments.

## Writing prose

Every piece of prose goes through two passes: academic-humanizer (claims matched to evidence,
honest tense, numbers and citations untouched) and avoid-ai-writing (AI-pattern audit, technical
voice). Project content is Turkish (`lang: "tr-TR"`); technical terms (MLP, F1-score, confusion
matrix, window, overlap, feature) stay in English. Before results exist, use proposal tense
("planlanmaktadır", "karşılaştırılacaktır"). Never state a result that no experiment produced.
Em-dashes are removed from prose.

## Definition of done

1. `bun run check` passes.
2. `bun run build proposal` ends with the three files in `dist/proposal/`.
3. You checked the output: slide count and text in the `.pptx`, the pages of `slide.pdf` and
   `slide-directions.pdf`, and the PNG of every slide you touched.
4. Deck changes update the guide in the same commit.
