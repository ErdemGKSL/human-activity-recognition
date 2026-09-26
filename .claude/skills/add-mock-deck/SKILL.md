---
name: add-mock-deck
description: Create a new mock/sample deck (typed Deck data) for the generator, optionally with a theme override, and register it. Use when the user asks for a new example presentation or new mock data.
---

# Add a mock deck

1. Create `packages/mock-data/src/decks/<deck-id>.ts`:

   ```ts
   import { defineDeck } from "@pptx/core";

   /** Mock data — <one-line description>. Every figure is invented. */
   export const myDeck = defineDeck({
     id: "my-deck",            // kebab-case; output file becomes output/my-deck.pptx
     title: "…",               // shown in every slide footer
     lang: "en-US",            // BCP-47; drives PPTX proofing language
     theme: { colors: { … } }, // optional ThemePatch over defaultTheme
     slides: [ … ],            // each { id, layout, …fields, notes? }
   });
   ```

   - `slide.id` must be unique within the deck, because it becomes the file stem `NN_<id>`.
   - `notes` are exported as PowerPoint speaker notes.
   - The available layouts are the `Slide` union in `packages/core/src/deck.ts`.
   - Motion: `transition` on the deck or slide, `animations` overrides per block,
     `animate: false`, and `morph` keys on `stage` objects. Decide the motion with
     [motion-design](../motion-design/SKILL.md) (see its
     [deck archetypes](../motion-design/references/slide-type-playbook.md#deck-archetypes)),
     then pick techniques through [animate-slides](../animate-slides/SKILL.md). The
     `stage` layout (free-positioned objects) is the tool for Morph and diagrams.
   - Data must be **fictional**: invented companies, people, and numbers, with `.example`
     domains for contact info.

2. Register it in `packages/mock-data/src/index.ts`: add it to the array in `decks` and
   re-export it.

3. Verify:

   ```bash
   bun run check
   bun run generate my-deck --png
   ```

   Check that text fits in the previews under `output/my-deck/preview/`. Long strings don't
   auto-shrink, so shorten the copy or split the content across slides.
