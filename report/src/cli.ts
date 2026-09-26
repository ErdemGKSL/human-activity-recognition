#!/usr/bin/env bun
/**
 * Build reports to PDF:
 *
 *   bun run build                    # every report → report/output/<id>.pdf
 *   bun run build final-results      # one or more report ids
 *   bun run build --list
 */
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { getReport, reports } from "./documents";
import { writePdf } from "./pdf";

const PACKAGE_ROOT = join(import.meta.dir, "..");

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    out: { type: "string", short: "o", default: join(PACKAGE_ROOT, "output") },
    list: { type: "boolean", default: false },
  },
});

if (values.list) {
  for (const r of Object.values(reports)) console.log(`${r.id.padEnd(24)} ${r.pdf.title}`);
  process.exit(0);
}

const selected = positionals.length ? positionals.map(getReport) : Object.values(reports);
for (const report of selected) {
  const path = join(values.out as string, `${report.id}.pdf`);
  const bytes = await writePdf(path, report.render(), report.pdf);
  console.log(`✓ ${relative(process.cwd(), path)} (${(bytes / 1024).toFixed(0)} KB)`);
}
