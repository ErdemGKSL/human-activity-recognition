#!/usr/bin/env bun
/**
 * Build presenter guides (one PDF per deck in @pptx/decks):
 *
 *   bun run build                     # every deck → slide-directions/output/<deck-id>.pdf
 *   bun run build final-results       # one or more deck ids
 *   bun run build --no-thumbnails     # skip slide images (faster)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { getDeck } from "@pptx/decks";
import { buildDirectionsPdf } from "./build";
import { directions, getDirections } from "./directions";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    out: { type: "string", short: "o", default: join(import.meta.dir, "..", "output") },
    "no-thumbnails": { type: "boolean", default: false },
  },
});

const ids = positionals.length ? positionals : Object.keys(directions);
await mkdir(values.out as string, { recursive: true });
for (const id of ids) {
  const bytes = await buildDirectionsPdf(getDeck(id), getDirections(id), {
    thumbnails: !values["no-thumbnails"],
  });
  const path = join(values.out as string, `${id}.pdf`);
  await writeFile(path, bytes);
  console.log(`✓ ${relative(process.cwd(), path)} (${(bytes.byteLength / 1024).toFixed(0)} KB)`);
}
