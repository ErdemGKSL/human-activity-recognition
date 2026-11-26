/**
 * texts:export / texts:apply / texts:check. All paths resolve against `root`, so tests run
 * on a copy of the repo; Biome always runs from the real repo (its config lives there).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  type Change,
  extractSlots,
  parseTextFile,
  planApply,
  renderTextFile,
  SOURCES,
  sha256,
  short,
  type TextSource,
  verifyApplied,
} from "./slots";

export const REPO_ROOT = join(import.meta.dir, "../..");

const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

function write(root: string, rel: string, content: string) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
}

/** Formats `content` as if it were the repo file `rel`, through Biome on stdin. */
export function biomeFormat(content: string, rel: string): string {
  const result = Bun.spawnSync({
    cmd: [join(REPO_ROOT, "node_modules/.bin/biome"), "format", `--stdin-file-path=${rel}`],
    cwd: REPO_ROOT,
    stdin: new TextEncoder().encode(content),
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0)
    throw new Error(`Biome biçimlendirmesi başarısız (${rel}):\n${result.stderr.toString()}`);
  return result.stdout.toString();
}

export function exportTexts(root: string, sources: TextSource[] = SOURCES) {
  return sources.map((source) => {
    const text = read(root, source.source);
    const slots = extractSlots(text, source);
    write(root, source.output, renderTextFile(source, text, slots));
    return { source, slots: slots.length };
  });
}

export interface ApplyResult {
  source: TextSource;
  errors: string[];
  changes: Change[];
  written: boolean;
}

export interface ApplyOptions {
  dryRun?: boolean;
  force?: boolean;
  /** Run Biome on changed sources (default true). */
  format?: boolean;
}

/**
 * Validates every text file first; writes nothing unless all of them pass. After writing,
 * the text files are exported again so their sha256 matches the new sources.
 */
export function applyTexts(
  root: string,
  options: ApplyOptions = {},
  sources: TextSource[] = SOURCES,
): ApplyResult[] {
  const planned = sources.map((source) => {
    const text = read(root, source.source);
    if (!existsSync(join(root, source.output))) {
      return {
        source,
        text,
        output: text,
        errors: [`${source.output} yok; önce texts:export`],
        changes: [],
        parsed: undefined,
      };
    }
    const parsed = parseTextFile(read(root, source.output));
    const slots = extractSlots(text, source);
    const plan = planApply(text, slots, parsed, options);
    let output = plan.output;
    const errors = [...plan.errors];
    if (!errors.length && plan.changes.length) {
      if (options.format !== false) output = biomeFormat(output, source.source);
      errors.push(...verifyApplied(output, source, parsed));
    }
    return { source, text, output, errors, changes: plan.changes, parsed };
  });
  const failed = planned.some((p) => p.errors.length);
  const results: ApplyResult[] = planned.map((p) => ({
    source: p.source,
    errors: p.errors,
    changes: p.changes,
    written: false,
  }));
  if (failed || options.dryRun) return results;
  planned.forEach((p, i) => {
    if (p.output !== p.text) {
      write(root, p.source.source, p.output);
      const r = results[i];
      if (r) r.written = true;
    }
  });
  if (results.some((r) => r.written)) exportTexts(root, sources);
  return results;
}

export interface CheckResult {
  source: TextSource;
  ok: boolean;
  message: string;
}

export function checkTexts(root: string, sources: TextSource[] = SOURCES): CheckResult[] {
  return sources.map((source) => {
    const text = read(root, source.source);
    if (!existsSync(join(root, source.output)))
      return { source, ok: false, message: `${source.output} yok; texts:export çalıştırın` };
    const current = read(root, source.output);
    const expected = renderTextFile(source, text, extractSlots(text, source));
    if (current === expected) return { source, ok: true, message: "kaynakla eşleşiyor" };
    const parsed = parseTextFile(current);
    if (parsed.sha !== sha256(text))
      return {
        source,
        ok: false,
        message: "kaynak, metin dosyası üretildikten sonra değişmiş; texts:export çalıştırın",
      };
    return {
      source,
      ok: false,
      message: "metin dosyasında henüz uygulanmamış düzenlemeler var; texts:apply çalıştırın",
    };
  });
}

function main(argv: string[]): number {
  const [command, ...rest] = argv;
  const flags = new Set(rest);
  const rootAt = rest.indexOf("--root");
  const root = rootAt >= 0 && rest[rootAt + 1] ? rest[rootAt + 1] : REPO_ROOT;
  if (!root) return 2;
  if (command === "export") {
    for (const r of exportTexts(root)) console.log(`✓ ${r.source.output}: ${r.slots} yuva`);
    return 0;
  }
  if (command === "apply") {
    const results = applyTexts(root, {
      dryRun: flags.has("--dry-run"),
      force: flags.has("--force"),
      format: !flags.has("--no-format"),
    });
    let failed = false;
    for (const r of results) {
      if (r.errors.length) {
        failed = true;
        console.error(`✗ ${r.source.output}:`);
        for (const e of r.errors) console.error(`  ${e}`);
        continue;
      }
      const verb = flags.has("--dry-run") ? "değişecek" : "değişti";
      console.log(`${r.source.output}: ${r.changes.length} yuva ${verb}`);
      for (const c of r.changes) {
        console.log(`  ${c.id} | ${c.context}`);
        console.log(`    "${short(c.before)}" -> "${short(c.after)}"`);
      }
    }
    if (failed) console.error("Hiçbir dosya değiştirilmedi.");
    return failed ? 1 : 0;
  }
  if (command === "check") {
    const results = checkTexts(root);
    for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.source.output}: ${r.message}`);
    return results.every((r) => r.ok) ? 0 : 1;
  }
  console.error("kullanım: bun scripts/texts/texts.ts export|apply|check [--dry-run] [--force]");
  return 2;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
