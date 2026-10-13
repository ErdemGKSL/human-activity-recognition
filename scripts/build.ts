#!/usr/bin/env bun
/**
 * Builds every deck into `dist/<deck-id>/`:
 *
 *   slide.pptx          the deck, written by DeckCraft
 *   slide.pdf           the same deck as PDF, exported by DeckCraft
 *   slide-directions.pdf the presenter guide, rendered by takumi-pdf
 *
 *   bun run build                      # every deck
 *   bun run build proposal             # one or more deck ids
 *   DECKCRAFT_CLI=/path/deckcraft-cli  # the CLI binary (default: on PATH)
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { proposal } from "../deck/proposal";
import type { DeckSpec } from "../deck/types";
import { buildDirectionsPdf } from "../slide-directions/src/build";
import { getDirections } from "../slide-directions/src/directions";
import { exportDeck, planDeck, runStages } from "./deckcraft";

const ROOT = resolve(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
const CLI = process.env.DECKCRAFT_CLI || "deckcraft-cli";

const decks: Record<string, DeckSpec> = { [proposal.id]: proposal };

async function buildDeck(deck: DeckSpec): Promise<void> {
  const outDir = join(DIST, deck.id);
  const work = join(outDir, ".work");
  await rm(outDir, { recursive: true, force: true });
  await mkdir(work, { recursive: true });

  const stages = planDeck(deck);
  const deckcraftFile = await runStages(CLI, stages, work);
  const exported = await exportDeck(CLI, deckcraftFile, outDir);

  const thumbnails = await Promise.all(exported.pngs.map((path) => readFile(path)));
  const guide = await buildDirectionsPdf(deck, getDirections(deck.id), { thumbnails });
  const guidePath = join(outDir, "slide-directions.pdf");
  await writeFile(guidePath, guide);

  await rm(join(outDir, ".png"), { recursive: true, force: true });
  await rm(work, { recursive: true, force: true });
  for (const path of [exported.pptx, exported.pdf, guidePath]) {
    const size = (await readFile(path)).byteLength;
    console.log(`✓ ${relative(ROOT, path)} (${(size / 1024).toFixed(0)} KB)`);
  }
}

const ids = Bun.argv.slice(2);
const selected = ids.length ? ids : Object.keys(decks);
for (const id of selected) {
  const deck = decks[id];
  if (!deck) throw new Error(`Unknown deck "${id}". Available: ${Object.keys(decks).join(", ")}`);
  await buildDeck(deck);
}
