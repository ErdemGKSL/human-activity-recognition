#!/usr/bin/env bun
/**
 * Deck generation pipeline:
 *
 *   mock data (@pptx/mock-data)
 *     → JSX layouts (@pptx/slides)
 *     → Takumi SVG + ppt-master normalization (@pptx/renderer)
 *     → quality gate + native PPTX export (@pptx/ppt-master → vendor/ppt-master)
 *
 * Usage:
 *   bun run generate                     # every deck
 *   bun run generate quarterly-review    # one or more deck ids
 *   bun run generate --svg-only          # stop after writing SVGs
 *   bun run generate --png               # also write PNG previews
 *   bun run generate --list
 */
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import type { Deck } from "@pptx/core";
import { decks, getDeck } from "@pptx/mock-data";
import {
  checkQuality,
  exportPptx,
  REPO_ROOT,
  validateAnimations,
  writeWorkspace,
} from "@pptx/ppt-master";
import { renderDeck } from "@pptx/renderer";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    out: { type: "string", short: "o", default: join(REPO_ROOT, "output") },
    "svg-only": { type: "boolean", default: false },
    raw: { type: "boolean", default: false },
    png: { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help) {
  console.log(`Usage: bun run generate [deck-id...] [--out dir] [--svg-only] [--raw] [--list]

  --out, -o     Output root (default: <repo>/output)
  --svg-only    Render SVGs into <out>/<deck>/svg_output and skip PPTX export
  --png         Also write PNG previews to <out>/<deck>/preview
  --raw         Keep raw Takumi SVG (skip normalization; implies --svg-only)
  --list        List available deck ids`);
  process.exit(0);
}

if (values.list) {
  for (const deck of Object.values(decks)) {
    console.log(`${deck.id.padEnd(24)} ${deck.slides.length} slides  ${deck.title}`);
  }
  process.exit(0);
}

const selected: Deck[] = positionals.length ? positionals.map(getDeck) : Object.values(decks);
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
  console.log(`  done in ${((performance.now() - started) / 1000).toFixed(1)}s`);
}
