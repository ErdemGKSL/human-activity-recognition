# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, …) working in this repo.
`CLAUDE.md` is a symlink to this file. **Edit `AGENTS.md` only.**

This file is the overview. The depth lives in **skills** (`.claude/skills/`, mirrored at
`.agents/skills/`). The [skill map](#skill-map-read-this-when) below tells you which skill
to read for which task. Read the linked `SKILL.md` before you start that kind of work, and
follow its links into `references/` only as far as the task needs.

## What this is

A template monorepo that turns **typed deck data** into a **native `.pptx`**:

```
@pptx/mock-data      Deck objects (pure data, mock/fictional)
      │
@pptx/slides         React JSX layouts, one per slide `layout` (+ <Animate> blocks)
      │
@pptx/renderer       Takumi renderSvg()  →  <Animate> block layering  →  normalizeSvg()
      │
@pptx/ppt-master     writes <out>/<deck>/svg_output + notes/ + animations.json, runs Python:
      │                svg_quality_checker.py → animation_config.py validate → svg_to_pptx.py
      ▼
output/<deck>.pptx   native DrawingML shapes + native transitions/animations/Morph
```

- **Takumi** (`takumi-js`, <https://github.com/kane50613/takumi>) is a Rust JSX/CSS
  renderer that runs without a browser. We use `renderSvg()` for vectors and `render()` for
  PNG previews only.
- **ppt-master** (<https://github.com/hugohe3/ppt-master>) is vendored as a pinned git
  submodule at `vendor/ppt-master`. We only use its export stage.

## Skill map: read this when…

| When you are… | Read |
|---|---|
| Writing or debugging slide JSX, seeing odd SVG, clip errors, tofu glyphs | [takumi-rendering](.claude/skills/takumi-rendering/SKILL.md) |
| Hitting a quality-gate or export error, changing `normalizeSvg` or the Python bridge | [ppt-master-export](.claude/skills/ppt-master-export/SKILL.md) |
| Doing **anything with motion** (always start here) | [animate-slides](.claude/skills/animate-slides/SKILL.md) (the router) |
| Deciding whether or how much to animate, or reviewing motion quality | [motion-design](.claude/skills/motion-design/SKILL.md) |
| Building in-slide motion: builds, emphasis, exits, paths, click triggers | [pptx-object-animations](.claude/skills/pptx-object-animations/SKILL.md) |
| Making the same object move, resize, or re-rank across slides | [pptx-morph](.claude/skills/pptx-morph/SKILL.md) |
| Choosing slide transitions or auto-advance | [pptx-transitions](.claude/skills/pptx-transitions/SKILL.md) |
| Adding a slide layout | [add-slide-layout](.claude/skills/add-slide-layout/SKILL.md) |
| Adding a mock deck | [add-mock-deck](.claude/skills/add-mock-deck/SKILL.md) |
| Generating, inspecting, or debugging decks | [generate-deck](.claude/skills/generate-deck/SKILL.md) |
| Bumping the ppt-master pin | [update-ppt-master](.claude/skills/update-ppt-master/SKILL.md) |

## Layout

```
apps/cli/                 @pptx/cli — `bun run generate` entry point (orchestration only)
packages/core/            @pptx/core — Deck/Slide types, PAGE_ROLE, theme tokens, canvas, motion types
packages/mock-data/       @pptx/mock-data — sample decks + registry (`decks`, `getDeck`)
packages/slides/          @pptx/slides — SlideFrame/Heading/Animate components, layouts/, registry
packages/renderer/        @pptx/renderer — renderDeck(), layers (block split), geometry, normalizeSvg(), Morph linking
packages/ppt-master/      @pptx/ppt-master — Python bridge: paths, workspace, animations sidecar, run
vendor/ppt-master/        git submodule — DO NOT EDIT (bump the pin instead)
scripts/setup.sh                 bootstrap (submodule + bun install + uv sync)
scripts/sync-motion-presets.py   generates motion types + skill catalogs from ppt-master
scripts/inspect-pptx.py          prints transitions / Morph names / animation rows of a .pptx
scripts/check-docs.py            validates skill cross-links, anchors and frontmatter
pyproject.toml, uv.lock   minimal Python env for the exporter (.venv)
.claude/skills/           project skills (mirrored at .agents/skills via symlink)
output/                   generated, gitignored
```

Dependencies only point downward: `cli → renderer → slides → core`,
`cli → ppt-master → core`, and `cli → mock-data → core`. `core` depends on nothing.

## Commands

| Task | Command |
| --- | --- |
| Bootstrap (first time / after pull) | `bun run setup` |
| Generate all decks / one deck | `bun run generate` / `bun run generate motion-showcase` |
| SVG only (no Python needed) | `bun run generate --svg-only` |
| Also PNG previews (final frame of each slide) | `bun run generate --png` → `output/<deck>/preview/*.png` |
| Raw Takumi SVG (debug) | `bun run generate --raw` |
| What a .pptx really contains | `bun run inspect output/<deck>.pptx [--slide N] [--json]` |
| List decks | `bun run decks` |
| Regenerate motion types + catalogs | `bun run sync:motion` (after bumping ppt-master) |
| Everything CI checks | `bun run check` (lint, docs links, typecheck, tests) |
| Auto-fix formatting | `bun run format` |

Toolchain: **Bun ≥ 1.3** (runtime, workspaces, and tests; it runs `.ts`/`.tsx` directly with
no build step), **uv** with Python ≥ 3.10 (exporter only), **Biome** for lint and format,
and **TypeScript** for types only (`noEmit`).

## Definition of done

1. `bun run check` passes.
2. `bun run generate --png` ends with `✓ output/<deck>.pptx` for every deck. That means the
   quality gate, sidecar validation, and export read-back all passed.
3. You looked at the PNG previews of every slide you touched.
4. For motion changes, `bun run inspect` shows the transitions, `!!` Morph names, and
   animation rows you intended.
5. If you changed behavior that a skill describes, update that skill in the same commit.
   `lint:docs` catches broken links, but not stale facts.

## Slide authoring rules (Takumi → ppt-master)

The reasons are in [takumi-rendering](.claude/skills/takumi-rendering/SKILL.md) and
[ppt-master-export](.claude/skills/ppt-master-export/SKILL.md).

1. **No clipping around content**: no `overflow: hidden`, and no single-side borders. Draw
   rules and accent bars as sized `<div>`s. Full borders and `borderRadius` are fine.
2. **Every box is `display: "flex"`**, styled with inline `style` objects that read theme
   tokens. Never hard-code colors. Decks override tokens with `deck.theme`.
3. **The canvas is fixed at 1280×720** (`CANVAS`, which is ppt-master's `ppt169`).
4. **Text exports as vector glyph outlines**, not editable PowerPoint text. Don't promise
   editable text, and don't use text-formatting animation effects.
5. **Geist is the only font** unless you register another. `→` and similar symbols render
   as tofu boxes. Emoji and remote images are unverified.
6. **Root groups must not overlap** (a ppt-master rule). `<Animate>` blocks must not nest or
   overlap each other or static content, and their ids avoid chrome tokens
   (`SLIDE_CHROME_TOKENS`).

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
- `visibility: hidden` hides a whole subtree, and children can't opt back in.
- ppt-master fails any root-group overlap larger than 1px. It needs a passing
  `--json` quality report before quick export, and notes need `--with-notes` →
  [ppt-master-export](.claude/skills/ppt-master-export/SKILL.md).
- Adding easing to `path_*` presets fails export read-back (accel + decel > 100%) →
  [modifiers](.claude/skills/pptx-object-animations/references/modifiers-and-triggers.md).
- Morph pairs need an explicit `morph` transition on the destination slide, and shapes are
  named `!!key` on both slides → [pptx-morph](.claude/skills/pptx-morph/SKILL.md).
- LibreOffice in the cloud container can't open any PPTX, so verify with `bun run inspect`
  and the PNG previews.

## Conventions

- ESM, strict TypeScript, and `noUncheckedIndexedAccess`. Use `import type` for types
  (`verbatimModuleSyntax`).
- Workspace packages export `./src/index.ts` directly. There's no build output and no
  `dist/`.
- Package names use the `@pptx/*` scope, and internal dependencies use `"workspace:*"`.
- Tests are `*.test.ts` files next to the source, using `bun:test`. They must not need
  Python.
- Comments explain *why* (especially constraints that come from ppt-master), not *what*.
- **Mock data is fictional.** No real companies, people, or figures, and contact details
  use `.example` domains.
- Never edit `vendor/ppt-master`. Adapt `normalizeSvg` or `@pptx/ppt-master` instead.
- Never pass `--enable-dangerous-nonconforming-svg-export`.
- Never hand-edit generated files. That means `motion-presets.generated.ts`,
  `effect-catalog.md`, and `transition-catalog.md`; run `bun run sync:motion` instead.
- Skills link to each other with relative Markdown links. Keep the links and `#anchors`
  valid (`bun run lint:docs`).

## Environment overrides

- `PPT_MASTER_DIR`: an alternative ppt-master checkout (default `vendor/ppt-master`)
- `PPT_MASTER_PYTHON`: the Python interpreter (default `.venv/bin/python`)
