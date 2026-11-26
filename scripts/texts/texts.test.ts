import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractSlots, parseTextFile, type Slot, SOURCES } from "./slots";
import { applyTexts, biomeFormat, checkTexts, exportTexts, REPO_ROOT } from "./texts";

// Every test works on a sandbox copy of the two sources (plus what the report build and
// the typecheck need); the real files are never written.
const SANDBOX = mkdtempSync(join(tmpdir(), "har-texts-"));
const [REPORT, DECK] = SOURCES as [(typeof SOURCES)[0], (typeof SOURCES)[0]];
const ORIGINAL = Object.fromEntries(
  SOURCES.map((s) => [s.source, readFileSync(join(REPO_ROOT, s.source), "utf8")]),
);

function setupSandbox() {
  const copy = (rel: string) =>
    cpSync(join(REPO_ROOT, rel), join(SANDBOX, rel), {
      recursive: true,
      filter: (src) => !/[/\\](node_modules|output)$/.test(src),
    });
  const link = (rel: string) => {
    if (existsSync(join(REPO_ROOT, rel))) symlinkSync(join(REPO_ROOT, rel), join(SANDBOX, rel));
  };
  copy("report");
  copy("slides/packages/decks");
  copy("tsconfig.base.json");
  link("node_modules");
  link("report/node_modules");
  link("slides/packages/decks/node_modules");
  writeFileSync(
    join(SANDBOX, "tsconfig.json"),
    JSON.stringify({
      extends: "./tsconfig.base.json",
      include: ["report/src", "slides/packages/decks/src"],
    }),
  );
}
setupSandbox();

afterAll(() => rmSync(SANDBOX, { recursive: true, force: true }));

beforeEach(() => {
  for (const s of SOURCES) writeFileSync(join(SANDBOX, s.source), ORIGINAL[s.source] ?? "");
  rmSync(join(SANDBOX, "texts"), { recursive: true, force: true });
  exportTexts(SANDBOX);
});

const src = (s: (typeof SOURCES)[0]) => readFileSync(join(SANDBOX, s.source), "utf8");
const txt = (s: (typeof SOURCES)[0]) => readFileSync(join(SANDBOX, s.output), "utf8");
const setTxt = (s: (typeof SOURCES)[0], content: string) =>
  writeFileSync(join(SANDBOX, s.output), content);
const slotsOf = (s: (typeof SOURCES)[0]) => extractSlots(src(s), s);

/** Replaces the text of one block in a text file. */
function editBlock(content: string, id: string, text: string): string {
  const lines = content.split("\n");
  const at = lines.findIndex((l) => l.startsWith(`@@ ${id} |`));
  expect(at).toBeGreaterThanOrEqual(0);
  let end = at + 1;
  while (end < lines.length && !lines[end]?.startsWith("@@")) end++;
  lines.splice(at + 1, end - at - 1, ...text.split("\n"), "");
  return lines.join("\n");
}

function find(slots: Slot[], pred: (s: Slot) => boolean): Slot {
  const slot = slots.find(pred);
  if (!slot) throw new Error("slot not found");
  return slot;
}

function run(cmd: string[], cwd: string) {
  const r = Bun.spawnSync({ cmd, cwd, stdout: "pipe", stderr: "pipe" });
  return { code: r.exitCode, out: `${r.stdout.toString()}${r.stderr.toString()}` };
}

/** Lines outside [first, last] of the slot's line range must be identical. */
function expectOnlyLinesChanged(before: string, after: string, slot: Slot) {
  const a = before.split("\n");
  const b = after.split("\n");
  const firstLine = before.slice(0, slot.start).split("\n").length - 1;
  const lastLine = before.slice(0, slot.end).split("\n").length - 1;
  expect(b.slice(0, firstLine)).toEqual(a.slice(0, firstLine));
  const tail = a.length - 1 - lastLine;
  expect(b.slice(b.length - tail)).toEqual(a.slice(a.length - tail));
}

describe("round trip", () => {
  test("export then unchanged apply keeps every source byte for byte", () => {
    for (const format of [false, true]) {
      const results = applyTexts(SANDBOX, { format });
      for (const r of results) {
        expect(r.errors).toEqual([]);
        expect(r.changes).toEqual([]);
      }
      for (const s of SOURCES) expect(src(s)).toBe(ORIGINAL[s.source] ?? "");
    }
    expect(checkTexts(SANDBOX).every((r) => r.ok)).toBe(true);
  });

  test("the sources are already Biome-formatted, so formatting after apply is a no-op", () => {
    for (const s of SOURCES) expect(biomeFormat(src(s), s.source)).toBe(src(s));
    const git = (...args: string[]) =>
      run(["git", "-c", "user.name=t", "-c", "user.email=t@example.com", ...args], SANDBOX);
    git("init", "-q");
    git("add", ...SOURCES.map((s) => s.source));
    git("commit", "-q", "-m", "base");
    applyTexts(SANDBOX, { format: true, force: true });
    expect(git("diff", "--exit-code", "--stat").code).toBe(0);
  });

  test("slot counts are stable and the text files carry the source sha256", () => {
    for (const s of SOURCES) {
      const parsed = parseTextFile(txt(s));
      expect(parsed.errors).toEqual([]);
      expect(parsed.blocks.map((b) => b.id)).toEqual(slotsOf(s).map((x) => x.id));
      expect(parsed.sha).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});

describe("single slot change", () => {
  const SPECIAL =
    `Özel karakterler: {süslü} <açı> "çift" 'tek' \\ters & şğüöçıİ. ` +
    "Bu cümle uzun bir satırın biçimlendirici tarafından yeniden sarıldığını sınamak için yazıldı ve yüz karakteri rahatça geçer.";

  test("a Paragraph (JsxText) slot changes alone; typecheck and report build pass", () => {
    const before = src(REPORT);
    const slot = find(slotsOf(REPORT), (s) => s.kind === "jsxText" && s.context.includes("4.1"));
    setTxt(REPORT, editBlock(txt(REPORT), slot.id, SPECIAL));
    const raw = applyTexts(SANDBOX, { format: false });
    expect(raw.flatMap((r) => r.errors)).toEqual([]);
    expect(raw[0]?.changes.map((c) => c.id)).toEqual([slot.id]);
    const unformatted = src(REPORT);
    expect(unformatted.slice(0, slot.start)).toBe(before.slice(0, slot.start));
    expect(unformatted.slice(unformatted.length - (before.length - slot.end))).toBe(
      before.slice(slot.end),
    );

    // Same edit again, this time through Biome.
    writeFileSync(join(SANDBOX, REPORT.source), before);
    exportTexts(SANDBOX);
    setTxt(REPORT, editBlock(txt(REPORT), slot.id, SPECIAL));
    expect(applyTexts(SANDBOX).flatMap((r) => r.errors)).toEqual([]);
    const after = src(REPORT);
    expectOnlyLinesChanged(before, after, slot);
    const slotsAfter = slotsOf(REPORT);
    const original = extractSlots(before, REPORT);
    expect(slotsAfter.length).toBe(original.length);
    slotsAfter.forEach((s, i) => {
      expect(s.display).toBe(s.id === slot.id ? SPECIAL : (original[i]?.display ?? ""));
    });
    expect(checkTexts(SANDBOX).every((r) => r.ok)).toBe(true);

    const tsc = run([join(REPO_ROOT, "node_modules/.bin/tsc"), "-p", "tsconfig.json"], SANDBOX);
    expect(tsc.out).toBe("");
    expect(tsc.code).toBe(0);
    const build = run(["bun", "./src/cli.ts", "final-results"], join(SANDBOX, "report"));
    expect(build.code).toBe(0);
    expect(existsSync(join(SANDBOX, "report/output/final-results.pdf"))).toBe(true);
  }, 240_000);

  test("string literals, JSX attributes, single quotes and numbers keep valid syntax", () => {
    const report = slotsOf(REPORT);
    const deck = slotsOf(DECK);
    const picks: Array<[(typeof SOURCES)[0], Slot, string]> = [
      [REPORT, find(report, (s) => s.context.includes("BulletList")), SPECIAL],
      [REPORT, find(report, (s) => s.jsxAttr && s.context.endsWith("altyazı")), SPECIAL],
      [REPORT, find(report, (s) => s.context.endsWith("> Yapılan")), 'Yapılan "iş" & {x}'],
      [DECK, find(deck, (s) => s.context.endsWith("> title")), SPECIAL],
      [DECK, find(deck, (s) => s.kind === "number"), "0.5"],
    ];
    // Biome only keeps single quotes around text that holds double quotes, so such a slot
    // exists only while some source has one (the report's old reference list did).
    for (const [source, slots] of [
      [REPORT, report],
      [DECK, deck],
    ] as const) {
      const single = slots.find((s) => s.quote === "'" && !picks.some(([, p]) => p.id === s.id));
      if (single) {
        picks.push([source, single, "Tek tırnaklı kaynak: 'a' \\ b"]);
        break;
      }
    }
    for (const s of SOURCES) {
      let content = txt(s);
      for (const [source, slot, text] of picks)
        if (source === s) content = editBlock(content, slot.id, text);
      setTxt(s, content);
    }
    const results = applyTexts(SANDBOX);
    expect(results.flatMap((r) => r.errors)).toEqual([]);
    expect(results.flatMap((r) => r.changes).length).toBe(picks.length);
    for (const [source, slot, text] of picks) {
      const now = slotsOf(source).find((x) => x.id === slot.id);
      expect(now?.display).toBe(text);
    }
    const tsc = run([join(REPO_ROOT, "node_modules/.bin/tsc"), "-p", "tsconfig.json"], SANDBOX);
    expect(tsc.out).toBe("");
  }, 120_000);

  test("multi-line text in the file joins into one logical line", () => {
    const slot = find(slotsOf(DECK), (s) => s.context.endsWith("> lead"));
    setTxt(DECK, editBlock(txt(DECK), slot.id, "  birinci satır\n\n  ikinci   satır  "));
    expect(applyTexts(SANDBOX).flatMap((r) => r.errors)).toEqual([]);
    expect(slotsOf(DECK).find((x) => x.id === slot.id)?.display).toBe("birinci satır ikinci satır");
  });
});

describe("errors", () => {
  const expectError = (pattern: RegExp, options = {}) => {
    const results = applyTexts(SANDBOX, options);
    const errors = results.flatMap((r) => r.errors);
    expect(errors.some((e) => pattern.test(e))).toBe(true);
    for (const s of SOURCES) expect(src(s)).toBe(ORIGINAL[s.source] ?? "");
  };
  const lines = () => txt(DECK).split("\n");
  const blockAt = (id: string) => lines().findIndex((l) => l.startsWith(`@@ ${id} |`));

  test("missing slot", () => {
    const l = lines();
    const at = blockAt("S0005");
    l.splice(at, 3);
    setTxt(DECK, l.join("\n"));
    expectError(/eksik yuvalar: S0005/);
  });

  test("extra slot", () => {
    setTxt(DECK, `${txt(DECK)}\n@@ S9999 | uydurma\nfazla metin\n`);
    expectError(/S9999.*kaynakta böyle bir yuva yok/);
  });

  test("duplicated slot", () => {
    setTxt(DECK, `${txt(DECK)}\n@@ S0002 | kopya\nikinci kez\n`);
    expectError(/S0002.*iki kez/);
  });

  test("empty slot", () => {
    setTxt(DECK, editBlock(txt(DECK), "S0003", "   "));
    expectError(/S0003.*boş/);
  });

  test("'@@' inside text and malformed '@@' line", () => {
    setTxt(DECK, editBlock(txt(DECK), "S0003", "metin @@ içinde"));
    expectError(/S0003.*'@@' içeriyor/);
    exportTexts(SANDBOX);
    setTxt(DECK, editBlock(txt(DECK), "S0003", "@@ satır başında"));
    expectError(/geçerli bir yuva başlığı değil/);
  });

  test("reordered blocks", () => {
    const l = lines();
    const a = blockAt("S0002");
    const moved = l.splice(a, 3);
    const b = l.findIndex((x) => x.startsWith("@@ S0004 |"));
    l.splice(b + 3, 0, ...moved);
    setTxt(DECK, l.join("\n"));
    expectError(/sırası değişmiş/);
  });

  test("source changed after export (sha256 drift) needs --force", () => {
    const drifted = `${ORIGINAL[DECK.source]}// sonradan eklendi\n`;
    writeFileSync(join(SANDBOX, DECK.source), drifted);
    const slot = find(slotsOf(DECK), (s) => s.context.endsWith("> title"));
    setTxt(DECK, editBlock(txt(DECK), slot.id, "Yeni başlık"));
    const results = applyTexts(SANDBOX);
    expect(results.flatMap((r) => r.errors).some((e) => /sha256/.test(e))).toBe(true);
    expect(src(DECK)).toBe(drifted);
    expect(checkTexts(SANDBOX).find((r) => r.source === DECK)?.message).toMatch(/değişmiş/);
    const forced = applyTexts(SANDBOX, { force: true });
    expect(forced.flatMap((r) => r.errors)).toEqual([]);
    expect(slotsOf(DECK).find((x) => x.id === slot.id)?.display).toBe("Yeni başlık");
  });

  test("a number slot only takes a number", () => {
    const slot = find(slotsOf(DECK), (s) => s.kind === "number");
    setTxt(DECK, editBlock(txt(DECK), slot.id, "0,841"));
    expectError(/bir sayı değil/);
  });

  test("dry run reports changes and writes nothing; check sees pending edits", () => {
    const slot = find(slotsOf(DECK), (s) => s.context.endsWith("> title"));
    setTxt(DECK, editBlock(txt(DECK), slot.id, "Önizleme"));
    const results = applyTexts(SANDBOX, { dryRun: true });
    expect(results.find((r) => r.source === DECK)?.changes.map((c) => c.after)).toEqual([
      "Önizleme",
    ]);
    for (const s of SOURCES) expect(src(s)).toBe(ORIGINAL[s.source] ?? "");
    expect(checkTexts(SANDBOX).find((r) => r.source === DECK)?.message).toMatch(/uygulanmamış/);
  });
});

test("sandbox stays separate from the repo", () => {
  mkdirSync(join(SANDBOX, "texts"), { recursive: true });
  for (const s of SOURCES)
    expect(readFileSync(join(REPO_ROOT, s.source), "utf8")).toBe(ORIGINAL[s.source] ?? "");
});
