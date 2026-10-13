---
name: deckcraft
description: Build PowerPoint decks with DeckCraft, the open-source Rust presentation app (storytold/deckcraft), from a headless CLI. Covers the binary (release builds only), the deck-to-command pipeline in scripts/deckcraft.ts, every verified command and parameter we use, export to .pptx / slide PDF / PNG, layout and theme choices, and the gotchas that broke real builds. Use when creating, changing or debugging a .pptx or a slide PDF, when a deckcraft-cli call fails, when adding a slide layout, or when a subagent needs to drive DeckCraft.
---

# DeckCraft

DeckCraft is a PowerPoint-compatible presentation editor written in Rust. This repo uses only
its **headless CLI**, `deckcraft-cli`, to write `.pptx` files and export slide PDFs. Its source
is `storytold/deckcraft` (MIT OR Apache-2.0). Nothing in this repo uses takumi for PPTX work.
takumi-pdf renders the presenter guide only, see [pdf-documents](../pdf-documents/SKILL.md).

## Rules for this repo

1. **Release builds only.** Never run `cargo build` without `--release`, never keep a debug
   build. Debug artifacts fill the disk. A release build of `deckcraft-cli` took about 6 min from
   scratch on this machine.
2. **Never run `cargo clean`** in the DeckCraft checkout. A clean release rebuild takes far
   longer than an incremental one. If the disk is short, delete only what you know is stale.
3. **Never write the `.pptx` by hand** and never call an alternative library for PPTX. The
   whole deck goes through `scripts/deckcraft.ts`.
4. **Content comes from `deck/<id>.ts`.** Layout, theme and export logic live in
   `scripts/deckcraft.ts`. Do not put text into command strings anywhere else.

## Get the binary

```sh
git clone https://github.com/storytold/deckcraft ~/storytold/deckcraft   # or reuse an existing checkout
cd ~/storytold/deckcraft
cargo build --release -p deckcraft-cli      # produces target/release/deckcraft-cli
```

The build script finds the binary through `DECKCRAFT_CLI`, default `deckcraft-cli` on `PATH`:

```sh
export DECKCRAFT_CLI=~/storytold/deckcraft/target/release/deckcraft-cli
bun run build proposal                     # writes dist/proposal/
```

Verify with `"$DECKCRAFT_CLI" --version`. The Linux build of the CLI needs no ALSA headers;
the desktop app does.

## The pipeline

```
deck/<id>.ts (DeckSpec)
   │  planDeck()          scripts/deckcraft.ts: DeckSpec → ordered Stage[] of command strings
   ▼
runStages()               one `deckcraft-cli run --in prev --cmd … --save next --print` per stage
   │                      (the CLI keeps no state between calls: the .deckcraft file carries it)
   ▼
exportDeck()              file.export: slide.pptx, slide.pdf (layout slides), slide1.png…
   ▼
dist/<id>/slide.pptx  slide.pdf  slide-directions.pdf (takumi-pdf, built from the PNGs)
```

Commands are plain strings `id={json params}`, the form `--cmd` reads. `cmd(id, params)` in
`scripts/deckcraft.ts` builds them. Use it and never hand-write JSON quoting.

### Stages

- Stage 0: `file.new` plus the theme (`design.colors`, `design.fonts`).
- One stage per spec slide. `slide.new` appends the slide and `slide.go` selects it.
- Last stage: `slide.go {index:0}` and `slide.delete {index:0}`, removing the blank slide that
  `file.new` creates.
- A table takes two stages. `insert.table` prints its id, `after(printed)` builds the cell
  commands from that id. Read the id from `--print` output, never guess it.

## Verified commands and parameters

Everything below was run against `deckcraft-cli 0.6.1`. Ids and params come from
`deckcraft-cli commands` and `deckcraft-cli describe <id>`, which are the source of truth.

| Command | Params we use | Notes |
|---|---|---|
| `file.new` | `{}` | Creates one empty slide at index 0. Remove it at the end. |
| `design.colors` | `{colors: {dk1, lt1, dk2, lt2, accent1…accent6}}` | `#RRGGBB` values. |
| `design.fonts` | `{major, minor}` | We use `Inter` for both. Inter embeds and covers Turkish. |
| `slide.new` | `{layout, title, body, at}` | `layout`: `title`, `titleAndContent`, `titleOnly`, `sectionHeader`, `twoContent`, `comparison`, `blank`, … `body` is one paragraph per `\n`. **Always pass `at`** (see gotchas). |
| `slide.go` | `{index}` | Selects a slide. Needed before any slide-scoped command. |
| `slide.delete` | `{index}` | |
| `shape.insert` | `{preset, rect:[x,y,w,h], text}` | `rect` is in points, a slide is 960×540. `preset` e.g. `roundRect`, `rightArrow`. The shape becomes the selection. |
| `shape.fill` / `shape.line` | `{color}` / `{none:true}` | Apply to the selected shape. |
| `format.size` | `{size}` | Applies to the selected shape's text. |
| `insert.textBox` | `{rect, text}` | Plain text box, no bullets. |
| `insert.table` | `{rows, cols, rect}` | Prints `{id}`. Rows include the header. |
| `text.set` | `{id, text, cell:[r,c]}` or `{id, text}` | Replaces the whole text, keeps the first run's formatting. |
| `transition.set` | `{kind, duration (ms), index}` | `kind` e.g. `fade`, `push`, `none`. |
| `file.export` | `{path, format, layout?, all?, scale?}` | `format`: `pptx`, `pdf`, `png`, `jpeg`, `outline`. PDF `layout`: `slides`, `notes`, `handouts`. `all:true` with PNG writes `slide1.png`, `slide2.png`, … next to `path`. |

`deckcraft-cli run` options: `--in FILE`, `--cmd ID[=JSON]` (repeatable), `--save FILE`,
`--export FILE`, `--print` (prints `id → result` per command; required to read ids).

## Gotchas (each one broke a real build)

- **`slide.new` inserts after the selected slide.** Without `at`, a deck built in order comes
  out reversed. Always pass `at: <index>`.
- **A reloaded `.deckcraft` selects slide 0.** Every stage must start with, or contain, a
  `slide.go` before `text.set`, `shape.*` or `format.*`. Otherwise you get `no such shape`.
- **`text.set` on a table needs `slide.go` first too** (same cause).
- **Table ids survive a save and reload**, but only the printed value of `insert.table` tells
  you the id. Use it.
- **Newlines in text become paragraphs.** `"Veri\nİkinci"` becomes two separate paragraphs in the
  saved `.pptx`.
- **Shape text is white by default.** Give a light fill and the text disappears. Use a dark
  fill for plain steps, or set the text colour.
- **Long Turkish words break mid-word in small shapes** (`Normalizasyon`, `Değerlendirme`).
  Set `format.size` to 14 pt in shapes with four or more steps.
- **Bullets come from the layout.** `titleAndContent` gives bullets to every paragraph,
  including a lead line or a label. Keep lead lines and labels out of the body, or accept the
  bullet.
- **Turkish characters round-trip** through `.pptx`, `.deckcraft` and PDF (`ğ ü ş ö ç ı İ` checked).
- **Table rows count the header**: `rows = data rows + 1`.
- **Exports need the saved state.** `file.export` reads the file given by `--in`. Export after
  the last stage, not inside an earlier one.

## Looks: what the proposal deck uses

Design choices come from published guidance on presentation design (hierarchy through size and
weight, at most two fonts and a few colours, one accent colour reserved for the key message,
generous whitespace, a master for consistency, and large text, roughly 18 pt or more for body
text). The concrete values live in `THEME` and the layout functions in `scripts/deckcraft.ts`:

- Colours: ink `#1B2430` on white, one blue accent `#1F5FAD` for the outcome, grey for
  secondary text. No other hues.
- One font family (Inter) for headings and body.
- Layouts map to DeckCraft placeholders where they exist (title, bullets, table), so the
  deck stays editable in PowerPoint. The process diagram is shapes, not a picture.
- Keep slide text short. The explanation lives in the presenter guide.

When you change the look, change `THEME` or the layout function, rebuild, and check the PNG
of every slide you touched.

## Verify a build

```sh
bun run build proposal                                  # the three files
python3 -c "import zipfile,re; z=zipfile.ZipFile('dist/proposal/slide.pptx'); print(len([n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$',n)]))"
pdftoppm -r 50 -png dist/proposal/slide.pdf /tmp/claude-0/…/scratchpad/slide   # look at each page
bun test && bun run typecheck && bun run lint
```

Check, in this order: slide count, that every string of the deck appears in the `.pptx` text,
the PNG of every slide you changed, and the guide page count (one page per slide plus the
front matter).

## Subagents

A subagent that changes a deck should read this file first, then `scripts/deckcraft.ts`. It
does not need DeckCraft's own docs. Give it the deck id, the slide id to change and the target
output. It must not commit `dist/`, which is generated and gitignored.
