#!/usr/bin/env bun
/**
 * Deck generation pipeline:
 *
 *   deck data (@pptx/decks = the project's decks, @pptx/mock-data = template examples)
 *     → JSX layouts (@pptx/slides)
 *     → Takumi SVG + ppt-master normalization (@pptx/renderer)
 *     → quality gate + native PPTX export (@pptx/ppt-master → vendor/ppt-master)
 *
 * Usage:
 *   bun run generate                     # the project decks (@pptx/decks)
 *   bun run generate proposal            # one or more deck ids (project or example)
 *   bun run generate --examples          # also the template example decks
 *   bun run generate --svg-only          # stop after writing SVGs
 *   bun run generate --png               # also write PNG previews
 *   bun run generate --pdf               # also write <deck>.pdf (one page per slide)
 *   bun run generate --list
 */
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import type { Deck } from "@pptx/core";
import { decks as projectDecks } from "@pptx/decks";
import { decks as exampleDecks } from "@pptx/mock-data";
import {
  checkQuality,
  exportPptx,
  REPO_ROOT,
  validateAnimations,
  writeWorkspace,
} from "@pptx/ppt-master";
import { renderDeck, renderDeckPdf } from "@pptx/renderer";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    out: { type: "string", short: "o", default: join(REPO_ROOT, "output") },
    "svg-only": { type: "boolean", default: false },
    raw: { type: "boolean", default: false },
    png: { type: "boolean", default: false },
    pdf: { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    examples: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help) {
  console.log(`Usage: bun run generate [deck-id...] [--out dir] [--svg-only] [--raw] [--list]

  (no ids)      Build the project decks; add --examples for the template examples too

  --out, -o     Output root (default: <repo>/output)
  --svg-only    Render SVGs into <out>/<deck>/svg_output and skip PPTX export
  --png         Also write PNG previews to <out>/<deck>/preview
  --pdf         Also write <out>/<deck>.pdf, one page per slide (final state)
  --raw         Keep raw Takumi SVG (skip normalization; implies --svg-only)
  --examples    Also build the template example decks (@pptx/mock-data)
  --list        List available deck ids`);
  process.exit(0);
}

// Project decks win on an id clash so a real deck is never shadowed by an example.
const allDecks: Record<string, Deck> = { ...exampleDecks, ...projectDecks };

function getDeck(id: string): Deck {
  const deck = allDecks[id];
  if (!deck) {
    throw new Error(`Unknown deck "${id}". Available: ${Object.keys(allDecks).join(", ")}`);
  }
  return deck;
}

if (values.list) {
  for (const [group, decks] of [
    ["project", projectDecks],
    ["example", exampleDecks],
  ] as const) {
    for (const deck of Object.values(decks)) {
      console.log(
        `${deck.id.padEnd(24)} ${group.padEnd(8)} ${deck.slides.length} slides  ${deck.title}`,
      );
    }
  }
  process.exit(0);
}

const selected: Deck[] = positionals.length
  ? positionals.map(getDeck)
  : Object.values(values.examples ? allDecks : projectDecks);
const outRoot = values.out as string;
const svgOnly = values["svg-only"] || values.raw;
const rel = (p: string) => relative(REPO_ROOT, p) || ".";

for (const deck of selected) {
  const started = performance.now();
  const workspace = join(outRoot, deck.id);

  const pages = await renderDeck(deck, { raw: values.raw, png: values.png });
  const { hasNotes, hasMotion } = await writeWorkspace(workspace, pages);
  console.log(`▸ ${deck.id}: rendered ${pages.length} SVG slides → ${rel(workspace)}/svg_output`);

  if (!svgOnly) {
    await checkQuality(workspace);
    if (hasMotion) await validateAnimations(workspace);
    const output = join(outRoot, `${deck.id}.pptx`);
    await exportPptx(workspace, { output, notes: hasNotes });
    console.log(`  ✓ ${rel(output)}`);
  }
  if (values.pdf) {
    const output = join(outRoot, `${deck.id}.pdf`);
    await Bun.write(output, await renderDeckPdf(deck));
    console.log(`  ✓ ${rel(output)}`);
  }
  console.log(`  done in ${((performance.now() - started) / 1000).toFixed(1)}s`);
}
