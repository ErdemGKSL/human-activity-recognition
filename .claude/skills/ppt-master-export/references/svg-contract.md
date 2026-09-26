# The flat-page SVG contract: what ppt-master checks, and how we comply

Back to [../SKILL.md](../SKILL.md). The source documents are
`vendor/ppt-master/skills/ppt-master/scripts/docs/svg-contract.md`,
`references/semantic-svg.md` and `references/shared-standards-core.md`.
The rules below are the subset our pipeline hits, with the component that satisfies each one.

| Rule (checker) | Blocking? | How we comply |
|---|---|---|
| Root `viewBox` is the canvas authority; `ppt169` = 1280×720 | yes | `CANVAS` in `packages/core/src/canvas.ts`; Takumi emits the matching viewBox |
| Root declares **one** `data-pptx-page-role` (`cover`/`toc`/`section`/`content`/`ending`) on flat pages | yes | `PAGE_ROLE[layout]` → `normalizeSvg` |
| Root `lang` (BCP-47) for proofing language | advisory | `deck.lang` → `normalizeSvg` |
| `<clipPath>` must be a direct child of `<defs>` | yes | hoisted by `normalizeSvg` |
| `clip-path` only on `<image>` or a crop wrapper | yes | empty clip groups dropped; content clip groups throw (avoid in layouts) |
| Every visible root `<g>` declares `data-pptx-bounds="x y w h"` | yes | `slide-content` = canvas, or per block/static-run geometry bounds |
| Root groups may not overlap > 1px on both axes | yes | checked earlier in `normalizeSvg` with a clearer error |
| Module text overflow > 5% of its bounds | yes (text only) | n/a — our text is outlines, not `<text>`, so the estimator skips it |
| Full-canvas background primitive may carry `data-pptx-role="background"` | — | first full-canvas `<rect>` gets it |
| Ungrouped root primitives | advisory | avoided; everything visible is grouped |
| Uppercase `#RRGGBB` paints | advisory | canonicalized |
| Structural roles (`data-pptx-role`) never on titles, body copy, cards, KPIs | policy | we only use `background` |

## Overlap exemptions (and why we don't use them)

Structured-template slots, structural-role groups and **wholly off-canvas Morph staging
groups** (`data-pptx-morph-staging="true"`) are exempt from overlap checks. We don't author
structured templates, and roles are reserved for page chrome, so ordinary content must not
overlap. Off-canvas staging would enable "slide in from outside the frame" Morphs, but
`snapBox` clamps bounds to the canvas today — see
[../../pptx-morph/SKILL.md#limits](../../pptx-morph/SKILL.md#limits).

## Group naming contract

- `anim-<blockId>` — an `<Animate>` block; these are the sidecar `groups` keys and the Morph
  pair endpoints.
- `static-N` — static content between blocks (never animated; ids chosen to avoid chrome
  tokens but also never listed in the sidecar).
- `slide-content` — the single group on slides without blocks.
- Morph pairs: PowerPoint shape names become `!!<morphKey>` on both slides.
