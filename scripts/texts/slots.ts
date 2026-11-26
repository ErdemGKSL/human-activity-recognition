/**
 * Text slots: every piece of user-visible text in a source file, found through the
 * TypeScript AST, with its exact source range. Export renders the slots as a plain text
 * file; apply reads that file back and rewrites only the slots whose text changed, so an
 * untouched file round-trips byte for byte.
 */
import { createHash } from "node:crypto";
import ts from "typescript";

export type SlotKind = "jsxText" | "stringLiteral" | "template" | "number";

export interface Slot {
  id: string;
  kind: SlotKind;
  /** Quote character of a string literal (`"` or `'`). */
  quote?: '"' | "'";
  /** A string literal written directly as a JSX attribute value (no escapes allowed there). */
  jsxAttr: boolean;
  /** Source range replaced on apply. */
  start: number;
  end: number;
  context: string;
  /** Text as shown in the text file: one logical line, whitespace runs collapsed. */
  display: string;
  /** JsxText only: raw leading and trailing whitespace, kept on apply. */
  lead?: string;
  trail?: string;
  /** JsxText only: whether the cooked value starts or ends with a significant space. */
  sigLead?: boolean;
  sigTrail?: boolean;
}

/** How one source file is scanned. Names are JSX attribute or object property names. */
export interface SlotRules {
  mode: "report" | "deck";
  /** JSX attributes whose values are never text (keys, sizes, styles). */
  skipJsxAttrs: string[];
  /** Object properties whose values (and everything below them) are never text. */
  skipProps: string[];
  /** JSX attributes holding `[key, caption]` tuples: element 0 is an identifier. */
  tupleKeyAttrs?: string[];
  /** `[arrayProp, prop]` pairs whose numeric values are visible (chart values). */
  numberProps?: Array<[string, string]>;
}

export interface TextSource {
  /** Short name used in messages, e.g. "rapor". */
  name: string;
  /** Repo-relative source file. */
  source: string;
  /** Repo-relative text file. */
  output: string;
  /** Slot id prefix, one capital letter. */
  prefix: string;
  /** First header line of the text file. */
  title: string;
  rules: SlotRules;
}

export const SOURCES: TextSource[] = [
  {
    name: "rapor",
    source: "report/src/documents/final-results.tsx",
    output: "texts/rapor_metni.txt",
    prefix: "R",
    title: "Final Results raporu metni",
    rules: {
      mode: "report",
      skipJsxAttrs: ["src", "key", "id", "style", "available", "width", "aspect", "widths"],
      skipProps: ["style", "id", "key", "src"],
      tupleKeyAttrs: ["left", "right"],
    },
  },
  {
    name: "sunum",
    source: "slides/packages/decks/src/decks/final-results.ts",
    output: "texts/sunum_metni.txt",
    prefix: "S",
    title: "Final Results sunumu metni",
    rules: {
      mode: "deck",
      skipJsxAttrs: [],
      skipProps: [
        "id",
        "key",
        "src",
        "layout",
        "lang",
        "tone",
        "effect",
        "morph",
        "transition",
        "animations",
        "animate",
        "theme",
        "trigger",
        "direction",
      ],
      numberProps: [["data", "value"]],
    },
  },
];

export const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

/** Collapses whitespace runs and trims: the form every comparison uses. */
export const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.startsWith("#x")) return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    return ENTITIES[body] ?? whole;
  });
}

/** JSX whitespace rules (as in Babel and TypeScript): what a JsxText node really renders. */
function cookJsxText(raw: string): string {
  const lines = raw.split(/\r\n|\n|\r/);
  let lastNonEmpty = -1;
  lines.forEach((line, i) => {
    if (/[^ \t]/.test(line)) lastNonEmpty = i;
  });
  let out = "";
  lines.forEach((line, i) => {
    let t = line.replace(/\t/g, " ");
    if (i !== 0) t = t.replace(/^ +/, "");
    if (i !== lines.length - 1) t = t.replace(/ +$/, "");
    if (!t) return;
    out += i === lastNonEmpty ? t : `${t} `;
  });
  return decodeEntities(out);
}

const propName = (name: ts.PropertyName): string =>
  ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)
    ? name.text
    : name.getText();

const tagName = (el: ts.JsxOpeningLikeElement) => el.tagName.getText();

/** A string-literal attribute value of a JSX element, if it has one. */
function attrText(el: ts.JsxOpeningLikeElement, name: string): string | undefined {
  for (const a of el.attributes.properties) {
    if (!ts.isJsxAttribute(a) || a.name.getText() !== name || !a.initializer) continue;
    const init = a.initializer;
    if (ts.isStringLiteral(init)) return decodeEntities(init.text);
    if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteralLike(init.expression))
      return init.expression.text;
  }
  return undefined;
}

const isExported = (s: ts.VariableStatement) =>
  s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;

/** Whether a string, template or number node is user-visible text under `rules`. */
function isVisible(node: ts.Node, rules: SlotRules): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isNumericLiteral(node)) {
    const pairs = rules.numberProps ?? [];
    if (!ts.isPropertyAssignment(parent) || parent.initializer !== node) return false;
    const obj = parent.parent;
    const arr = obj.parent;
    const holder = arr?.parent;
    return pairs.some(
      ([arrayProp, prop]) =>
        propName(parent.name) === prop &&
        ts.isArrayLiteralExpression(arr) &&
        holder !== undefined &&
        ts.isPropertyAssignment(holder) &&
        propName(holder.name) === arrayProp,
    );
  }
  // Direct positions that are always code: module paths, keys, call arguments, comparisons.
  if (
    ts.isImportDeclaration(parent) ||
    ts.isExportDeclaration(parent) ||
    ts.isExternalModuleReference(parent) ||
    ts.isCallExpression(parent) ||
    ts.isNewExpression(parent) ||
    ts.isBinaryExpression(parent) ||
    ts.isCaseClause(parent) ||
    ts.isElementAccessExpression(parent) ||
    ts.isBindingElement(parent) ||
    ts.isParameter(parent) ||
    ts.isComputedPropertyName(parent) ||
    ts.isTaggedTemplateExpression(parent)
  )
    return false;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  // Tuple keys such as left={["cm-mlp", "Şekil 3: MLP"]}.
  if (ts.isArrayLiteralExpression(parent) && parent.elements[0] === node) {
    const holder = ts.isJsxExpression(parent.parent) ? parent.parent.parent : undefined;
    if (
      holder &&
      ts.isJsxAttribute(holder) &&
      (rules.tupleKeyAttrs ?? []).includes(holder.name.getText())
    )
      return false;
  }
  for (let p: ts.Node | undefined = parent; p; p = p.parent) {
    if (ts.isTypeNode(p)) return false;
    if (ts.isPropertyAssignment(p) && rules.skipProps.includes(propName(p.name))) return false;
    if (ts.isJsxAttribute(p) && rules.skipJsxAttrs.includes(p.name.getText())) return false;
    // Top-level constants that are not exported hold ids and file paths, not text.
    if (ts.isVariableStatement(p) && ts.isSourceFile(p.parent) && !isExported(p)) return false;
  }
  return true;
}

type Seg =
  | { k: "idx"; i: number; node: ts.Node }
  | { k: "prop"; name: string }
  | { k: "attr"; name: string; el: ts.JsxOpeningLikeElement }
  | { k: "child"; el: ts.JsxElement };

/** Path from the nearest JSX anchor (attribute or element child) down to the node. */
function localPath(node: ts.Node): Seg[] {
  const segs: Seg[] = [];
  let cur: ts.Node = node;
  for (let p = cur.parent; p; cur = p, p = p.parent) {
    if (ts.isArrayLiteralExpression(p)) {
      segs.unshift({ k: "idx", i: p.elements.indexOf(cur as ts.Expression), node: cur });
    } else if (ts.isPropertyAssignment(p) && p.initializer === cur) {
      segs.unshift({ k: "prop", name: propName(p.name) });
    } else if (
      ts.isVariableDeclaration(p) &&
      p.initializer === cur &&
      !ts.isSourceFile(p.parent.parent.parent)
    ) {
      segs.unshift({ k: "prop", name: p.name.getText() });
    } else if (ts.isJsxAttribute(p)) {
      segs.unshift({ k: "attr", name: p.name.getText(), el: p.parent.parent });
      return segs;
    } else if (ts.isJsxElement(p) && p.children.includes(cur as ts.JsxChild)) {
      segs.unshift({ k: "child", el: p });
      return segs;
    }
  }
  return segs;
}

/** Words for 1-based positions inside well-known arrays, by nesting depth. */
const INDEX_WORDS: Record<string, string[]> = {
  rows: ["satır", "hücre"],
  columns: ["sütun"],
  items: ["madde"],
  points: ["madde"],
  steps: ["adım", "madde"],
  highlights: ["kutu"],
  metrics: ["kutu"],
  data: ["çubuk"],
};

/** Renders props and indices: `highlights 1 > label`, `satır 2, hücre 3`. */
function renderSegs(segs: Seg[]): string {
  const parts: string[] = [];
  let lastName = "";
  let depth = 0;
  segs.forEach((seg, n) => {
    if (seg.k === "prop") {
      lastName = seg.name;
      depth = 0;
      const words = INDEX_WORDS[seg.name];
      if (!(words && segs[n + 1]?.k === "idx")) parts.push(seg.name);
    } else if (seg.k === "idx") {
      const word = INDEX_WORDS[lastName]?.[depth] ?? (lastName || "öğe");
      const text = `${word} ${seg.i + 1}`;
      if (depth > 0 && parts.length > 0) parts[parts.length - 1] += `, ${text}`;
      else parts.push(text);
      depth++;
    }
  });
  return parts.join(" > ");
}

const ATTR_LABELS: Record<string, Record<string, string>> = {
  Step: { done: "Yapılan", result: "Sonuç", decision: "Karar" },
  Section: { title: "başlık", number: "numara" },
  SubSection: { title: "başlık", number: "numara" },
  FigurePair: { left: "sol şekil altyazısı", right: "sağ şekil altyazısı" },
};
const CHILD_LABELS: Record<string, string> = { Paragraph: "Paragraf" };

/** "Tablo 3" / "Şekil 1" from an element's caption, else the tag name. */
function elementLabel(el: ts.JsxOpeningLikeElement): string {
  const caption = attrText(el, "caption");
  const m = caption && /^(Tablo|Şekil) \d+/.exec(caption);
  return m ? m[0] : tagName(el);
}

function sectionLabel(el: ts.JsxOpeningLikeElement): string {
  const number = attrText(el, "number");
  const title = attrText(el, "title") ?? tagName(el);
  return number ? `${number} ${title}` : title;
}

function reportContext(node: ts.Node, segs: Seg[]): string {
  const anchor = segs[0];
  let where = "";
  let what = "";
  let start: ts.Node | undefined = node;
  if (anchor?.k === "attr") {
    const tag = tagName(anchor.el);
    if (tag === "Section" || tag === "SubSection") {
      const number = attrText(anchor.el, "number");
      where = number ? `Bölüm ${number}` : "Numarasız bölüm";
      return `${where} > ${ATTR_LABELS[tag]?.[anchor.name] ?? anchor.name}`;
    }
    const label = ATTR_LABELS[tag]?.[anchor.name];
    const idx = segs.find((s) => s.k === "idx");
    if (tag === "References" && idx?.k === "idx") what = `kaynak ${idx.i + 1}`;
    else if (label) what = label;
    else {
      const inner = renderSegs([{ k: "prop", name: anchor.name }, ...segs.slice(1)]);
      what = `${elementLabel(anchor.el)} > ${anchor.name === "caption" ? "altyazı" : inner}`;
    }
    // An opening element's parent is its own element, which must not count as the section.
    start = ts.isJsxOpeningElement(anchor.el) ? anchor.el.parent : anchor.el;
  } else if (anchor?.k === "child") {
    const tag = tagName(anchor.el.openingElement);
    what = CHILD_LABELS[tag] ?? tag;
    start = anchor.el;
  } else {
    what = renderSegs(segs) || "metin";
  }
  for (let p = start?.parent; p; p = p.parent) {
    if (ts.isJsxElement(p)) {
      const tag = tagName(p.openingElement);
      if (tag === "Section" || tag === "SubSection") {
        where = sectionLabel(p.openingElement);
        break;
      }
    }
    if (ts.isFunctionDeclaration(p) && p.name) {
      where = `${p.name.text} bileşeni`;
      break;
    }
  }
  return where ? `${where} > ${what}` : `Rapor ayarları > ${what}`;
}

function deckContext(segs: Seg[]): string {
  // segs come from the exported object: [defineDeck arg] ... slides > idx > rest
  const at = segs.findIndex((s, n) => s.k === "prop" && s.name === "slides" && segs[n + 1]);
  if (at < 0) return `Sunum > ${renderSegs(segs)}`;
  const idx = segs[at + 1];
  if (idx?.k !== "idx") return `Sunum > ${renderSegs(segs)}`;
  let id = "";
  if (ts.isObjectLiteralExpression(idx.node)) {
    for (const p of idx.node.properties)
      if (
        ts.isPropertyAssignment(p) &&
        propName(p.name) === "id" &&
        ts.isStringLiteral(p.initializer)
      )
        id = p.initializer.text;
  }
  const rest = renderSegs(segs.slice(at + 2));
  return `Slayt ${idx.i + 1}${id ? ` (${id})` : ""} > ${rest}`;
}

/** All text slots of `text` (the content of `source.source`), in source order. */
export function extractSlots(text: string, source: TextSource): Slot[] {
  const kind = source.source.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(source.source, text, ts.ScriptTarget.Latest, true, kind);
  const slots: Slot[] = [];
  const add = (slot: Omit<Slot, "id" | "context">, node: ts.Node) => {
    const segs = localPath(node);
    const context = source.rules.mode === "report" ? reportContext(node, segs) : deckContext(segs);
    const id = `${source.prefix}${String(slots.length + 1).padStart(4, "0")}`;
    slots.push({ id, context, ...slot });
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const raw = text.slice(node.pos, node.end);
      const cooked = cookJsxText(raw);
      const display = normalize(cooked);
      if (display) {
        add(
          {
            kind: "jsxText",
            jsxAttr: false,
            start: node.pos,
            end: node.end,
            display,
            lead: /^\s*/.exec(raw)?.[0] ?? "",
            trail: /\s*$/.exec(raw)?.[0] ?? "",
            sigLead: cooked.startsWith(" "),
            sigTrail: cooked.endsWith(" "),
          },
          node,
        );
      }
    } else if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      isVisible(node, source.rules)
    ) {
      const start = node.getStart(sf);
      const jsxAttr = ts.isJsxAttribute(node.parent);
      const value = jsxAttr ? decodeEntities(node.text) : node.text;
      const display = normalize(value);
      if (display) {
        const isTemplate = ts.isNoSubstitutionTemplateLiteral(node);
        add(
          {
            kind: isTemplate ? "template" : "stringLiteral",
            ...(isTemplate ? {} : { quote: text[start] === "'" ? "'" : '"' }),
            jsxAttr,
            start,
            end: node.end,
            display,
          },
          node,
        );
      }
    } else if (ts.isNumericLiteral(node) && isVisible(node, source.rules)) {
      const start = node.getStart(sf);
      add(
        { kind: "number", jsxAttr: false, start, end: node.end, display: node.getText(sf) },
        node,
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return slots;
}

// ---------------------------------------------------------------- text file

const NOTE = [
  "Kullanım notu:",
  "- Yalnızca '@@' ile başlayan satırların altındaki metni değiştirin.",
  "- '@@' satırlarını silmeyin, yenisini eklemeyin, sıralarını değiştirmeyin.",
  "- Boş bırakılan yuva hata verir. Metnin içinde '@@' yazmayın, satır başında hiç.",
  "- Bir yuvanın metni birkaç satıra yayılabilir; uygulamada satırlar tek boşlukla birleşir.",
  "- Araç yeni metin eklemez, yalnızca var olan metni değiştirir.",
  "- Sayı yuvaları (grafik değerleri) nokta ile yazılır: 0.841",
  "- Uygulamak için: bun run texts:apply (önce önizleme: bun run texts:apply --dry-run).",
  "- '@@' ile başlayan ilk satırdan önceki satırlar (bu not) uygulamada yok sayılır.",
];

export function renderTextFile(source: TextSource, text: string, slots: Slot[]): string {
  const head = [
    `# ${source.title}`,
    `# kaynak: ${source.source}`,
    `# sha256: ${sha256(text)}`,
    `# yuva sayısı: ${slots.length}`,
    "#",
    ...NOTE.map((l) => `# ${l}`),
    "",
  ];
  const body = slots.flatMap((s) => [`@@ ${s.id} | ${s.context}`, s.display, ""]);
  return `${[...head, ...body].join("\n").trimEnd()}\n`;
}

export interface ParsedBlock {
  id: string;
  context: string;
  text: string;
  line: number;
}

export interface ParsedFile {
  sha?: string;
  blocks: ParsedBlock[];
  errors: string[];
}

const HEADER = /^@@ ([A-Z]\d{4}) \| (.*)$/;

export function parseTextFile(content: string): ParsedFile {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  const errors: string[] = [];
  const blocks: ParsedBlock[] = [];
  let sha: string | undefined;
  let current: { block: ParsedBlock; lines: string[] } | undefined;
  const flush = () => {
    if (!current) return;
    current.block.text = normalize(current.lines.join(" "));
    blocks.push(current.block);
  };
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (line.startsWith("@@")) {
      const m = HEADER.exec(line);
      if (!m) {
        errors.push(`satır ${lineNo}: '@@' ile başlıyor ama geçerli bir yuva başlığı değil`);
        return;
      }
      flush();
      current = {
        block: { id: m[1] ?? "", context: m[2] ?? "", text: "", line: lineNo },
        lines: [],
      };
      return;
    }
    if (!current) {
      const m = /^# sha256: ([0-9a-f]{64})\s*$/.exec(line);
      if (m) sha = m[1];
      return;
    }
    if (line.includes("@@")) {
      errors.push(`satır ${lineNo} (${current.block.id}): metin '@@' içeriyor`);
    }
    current.lines.push(line);
  });
  flush();
  return { ...(sha ? { sha } : {}), blocks, errors };
}

// ---------------------------------------------------------------- apply

const NUMBER = /^-?\d+(\.\d+)?$/;
const JSX_TEXT_SPECIAL = /[{}<>&]/;

function quoteString(value: string, quote: '"' | "'"): string {
  if (quote === '"') return JSON.stringify(value);
  const body = JSON.stringify(value).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'");
  return `'${body}'`;
}

function quoteTemplate(value: string): string {
  return `\`${value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\``;
}

/** Source text that renders `value` in place of `slot`. */
export function renderSlot(slot: Slot, value: string): string {
  switch (slot.kind) {
    case "number":
      return value;
    case "template":
      return quoteTemplate(value);
    case "stringLiteral": {
      const quote = slot.quote ?? '"';
      if (!slot.jsxAttr) return quoteString(value, quote);
      // JSX attribute strings have no escapes; fall back to an expression when needed.
      if (value.includes(quote) || value.includes("&")) return `{${JSON.stringify(value)}}`;
      return `${quote}${value}${quote}`;
    }
    case "jsxText": {
      const lead = slot.lead ?? "";
      const trail = slot.trail ?? "";
      if (!JSX_TEXT_SPECIAL.test(value)) return `${lead}${value}${trail}`;
      // Characters JSX text cannot hold go through a string expression; whitespace that
      // was significant (no line break) moves inside the string.
      const cooked = `${slot.sigLead ? " " : ""}${value}${slot.sigTrail ? " " : ""}`;
      const keepLead = /[\r\n]/.test(lead) ? lead : "";
      const keepTrail = /[\r\n]/.test(trail) ? trail : "";
      return `${keepLead}{${JSON.stringify(cooked)}}${keepTrail}`;
    }
  }
}

export interface Change {
  id: string;
  context: string;
  before: string;
  after: string;
}

export interface ApplyPlan {
  errors: string[];
  changes: Change[];
  /** Source with the changes applied (unformatted). Equal to the input when nothing changed. */
  output: string;
}

/** Checks a parsed text file against the current source and builds the new source. */
export function planApply(
  text: string,
  slots: Slot[],
  parsed: ParsedFile,
  options: { force?: boolean } = {},
): ApplyPlan {
  const errors = [...parsed.errors];
  const actual = sha256(text);
  if (!parsed.sha) errors.push("metin dosyasında '# sha256:' satırı yok");
  else if (parsed.sha !== actual && !options.force)
    errors.push(
      `kaynak dosya metin dosyası üretildikten sonra değişmiş (sha256 ${parsed.sha.slice(0, 12)}… yerine ${actual.slice(0, 12)}…). ` +
        "Metni yeniden üretmek için texts:export, yine de uygulamak için --force.",
    );
  const want = slots.map((s) => s.id);
  const got = parsed.blocks.map((b) => b.id);
  const wantSet = new Set(want);
  const seen = new Set<string>();
  for (const b of parsed.blocks) {
    if (seen.has(b.id)) errors.push(`${b.id} (satır ${b.line}): yuva iki kez yazılmış`);
    seen.add(b.id);
    if (!wantSet.has(b.id)) errors.push(`${b.id} (satır ${b.line}): kaynakta böyle bir yuva yok`);
  }
  const missing = want.filter((id) => !seen.has(id));
  if (missing.length) errors.push(`eksik yuvalar: ${missing.join(", ")}`);
  if (!missing.length && got.length === want.length && got.some((id, i) => id !== want[i]))
    errors.push("yuvaların sırası değişmiş; '@@' bloklarını özgün sıralarına geri koyun");
  for (const b of parsed.blocks) {
    if (!b.text) errors.push(`${b.id} (satır ${b.line}): yuva boş`);
  }
  const byId = new Map(slots.map((s) => [s.id, s]));
  for (const b of parsed.blocks) {
    const slot = byId.get(b.id);
    if (slot?.kind === "number" && b.text && !NUMBER.test(b.text))
      errors.push(
        `${b.id} (satır ${b.line}): sayı yuvası, '${b.text}' bir sayı değil (örnek: 0.841)`,
      );
  }
  if (errors.length) return { errors, changes: [], output: text };

  const changes: Change[] = [];
  const edits: Array<{ start: number; end: number; text: string }> = [];
  for (const b of parsed.blocks) {
    const slot = byId.get(b.id);
    if (!slot || b.text === slot.display) continue;
    changes.push({ id: slot.id, context: slot.context, before: slot.display, after: b.text });
    edits.push({ start: slot.start, end: slot.end, text: renderSlot(slot, b.text) });
  }
  let output = text;
  for (const e of edits.sort((a, b) => b.start - a.start))
    output = output.slice(0, e.start) + e.text + output.slice(e.end);
  return { errors, changes, output };
}

/** After apply: the new source must have the same slots, holding the requested texts. */
export function verifyApplied(output: string, source: TextSource, parsed: ParsedFile): string[] {
  const slots = extractSlots(output, source);
  const errors: string[] = [];
  if (slots.length !== parsed.blocks.length)
    return [`uygulamadan sonra yuva sayısı ${parsed.blocks.length} yerine ${slots.length}`];
  slots.forEach((s, i) => {
    const b = parsed.blocks[i];
    if (b && s.display !== b.text) errors.push(`${b.id}: uygulanan metin kaynakta farklı okundu`);
  });
  return errors;
}

export const short = (text: string, max = 70) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;
