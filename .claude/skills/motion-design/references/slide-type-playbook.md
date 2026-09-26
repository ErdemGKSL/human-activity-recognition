# Slide-type motion playbook

Back to [../SKILL.md](../SKILL.md). These are sensible defaults per slide type. The
**Layout default** column shows what the built-in layouts already do (see
`packages/slides/src/layouts/*.tsx`). The **Consider** column lists deliberate upgrades,
with the skill that shows how.

| Slide type | Layout default | Consider | How |
|---|---|---|---|
| Cover | Title fades 0.8 s, subtitle rises | `animate: false` for a quieter open; a Morph from the cover mark into the agenda | [pptx-morph recipes](../../pptx-morph/references/recipes.md#logo-or-mark-carries-into-the-next-slide) |
| Agenda | Items fly in from the left, auto | Presenter-paced with dim-after when you talk through each item | [recipes → dim-after](../../pptx-object-animations/references/recipes.md#presenter-paced-list-with-dim-after) |
| Section divider | Description fades | A `push` transition *into* the section (direction = narrative forward) | [pptx-transitions](../../pptx-transitions/SKILL.md#choosing-by-slide-relationship) |
| KPI / metrics | Cards rise one after another | Emphasize the one KPI the slide is about | [recipes → emphasis](../../pptx-object-animations/references/recipes.md#emphasis-that-points) |
| Bar chart | Rows wipe in from the left | Click per bar for a story, or a Morph re-sort between periods | [recipes → chart build](../../pptx-object-animations/references/recipes.md#chart-that-grows) · [morph re-sort](../../pptx-morph/references/recipes.md#re-sort-or-re-rank) |
| Table | Body rows fade, header static | Usually leave it. Tables are read, not watched | — |
| Quote | Quote fades 0.8 s, author rises | Nothing more; quotes need stillness | — |
| Before → after / zoom into detail | — | Morph (grow and move, camera push-in) | [pptx-morph](../../pptx-morph/SKILL.md) |
| Q&A / quiz | — | Click-to-reveal with `triggerShape` | [recipes → click-to-reveal](../../pptx-object-animations/references/recipes.md#click-to-reveal) |
| Status / process | — | Lifecycle: enter → emphasize → exit, then the next state | [recipes → lifecycle](../../pptx-object-animations/references/recipes.md#lifecycle-enter-emphasize-exit) |
| Closing | Contact pill zooms | Optional one exciting transition as a finale | [pptx-transitions](../../pptx-transitions/SKILL.md#the-exciting-category) |

## Deck archetypes

| Deck | Transition | Builds | Morph |
|---|---|---|---|
| Board / finance review | fade 0.4–0.5 | Auto, subtle (fade, wipe for data) | Only for period comparisons |
| Product launch / pitch | fade + one `push` or `cover` | Presenter-paced key reveals | Hero object grows into feature detail |
| Training / education | fade | Presenter-paced, dim-after, click-to-reveal quizzes | Process steps |
| Kiosk / looping | fade + `autoAdvance` per slide | Auto only (no presenter) | Fine |
| Emailed / read-alone | fade or none | None or very light | Avoid, since viewers may not play it |

The reference implementation of most rows is `packages/mock-data/src/decks/motion-showcase.ts`.
