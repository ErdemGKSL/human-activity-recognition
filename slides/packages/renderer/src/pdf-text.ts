import { inflateSync } from "node:zlib";

/**
 * Reads the text back out of a takumi-pdf page.
 *
 * Takumi's SVG backend draws text as glyph outlines (`<use href="#gN">`), which
 * ppt-master can only export as shapes. takumi-pdf runs the same layout engine
 * but writes *real* PDF text: one `BT … Tf … Tm … TJ … ET` block per laid-out
 * line, with the resolved font face, size, colour, opacity and baseline, plus a
 * ToUnicode CMap per font. Interpreting that content stream gives us exactly
 * what an editable `<text>` element needs, in the same pixel space as the SVG.
 *
 * This is a deliberately small reader for takumi-pdf's own output (plain
 * `N 0 obj` objects, Flate streams, Type0/Identity-H fonts), not a general
 * PDF parser. Anything outside that shape throws, so a takumi-pdf upgrade that
 * changes its writer fails loudly in tests instead of silently losing text.
 */

export interface PdfTextRun {
  /** Unicode text of the run, decoded through the font's ToUnicode CMap. */
  text: string;
  /** Pen position of the first glyph, in CSS px from the top-left of the page. */
  x: number;
  /** Baseline, in CSS px from the top of the page. */
  baseline: number;
  /** Font size in CSS px. */
  fontSize: number;
  /** PostScript name of the face, subset prefix removed (e.g. `Carlito-Bold`). */
  postScriptName: string;
  /** Fill colour as `#RRGGBB`. */
  fill: string;
  /** Fill alpha from ExtGState `ca` (1 when opaque). */
  opacity: number;
  /** Extra space after every glyph (CSS `letter-spacing`), in px. */
  letterSpacing: number;
  /** Advance width of the run, trailing spaces excluded, in px. */
  width: number;
}

export class PdfTextError extends Error {
  override name = "PdfTextError";
}

// ── PDF object syntax ───────────────────────────────────────────────────────

type PdfValue =
  | number
  | boolean
  | null
  | { name: string }
  | { ref: number }
  | { str: Uint8Array }
  | PdfValue[]
  | PdfDict;
interface PdfDict {
  dict: Map<string, PdfValue>;
}
interface PdfOp {
  op: string;
  args: PdfValue[];
}

const isName = (v: PdfValue | undefined): v is { name: string } =>
  typeof v === "object" && v !== null && "name" in v;
const isRef = (v: PdfValue | undefined): v is { ref: number } =>
  typeof v === "object" && v !== null && "ref" in v;
const isStr = (v: PdfValue | undefined): v is { str: Uint8Array } =>
  typeof v === "object" && v !== null && "str" in v;
const isDict = (v: PdfValue | undefined): v is PdfDict =>
  typeof v === "object" && v !== null && "dict" in v;

const WHITESPACE = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIMITERS = new Set([0x28, 0x29, 0x3c, 0x3e, 0x5b, 0x5d, 0x7b, 0x7d, 0x2f, 0x25]);

/** Tokenizer + parser shared by object dictionaries and content streams. */
class Lexer {
  pos = 0;
  constructor(readonly bytes: Uint8Array) {}

  private skip() {
    const b = this.bytes;
    while (this.pos < b.length) {
      const c = b[this.pos] as number;
      if (WHITESPACE.has(c)) this.pos++;
      else if (c === 0x25) while (this.pos < b.length && b[this.pos] !== 0x0a) this.pos++;
      else break;
    }
  }

  private word(): string {
    const start = this.pos;
    const b = this.bytes;
    while (this.pos < b.length) {
      const c = b[this.pos] as number;
      if (WHITESPACE.has(c) || DELIMITERS.has(c)) break;
      this.pos++;
    }
    return String.fromCharCode(...b.subarray(start, this.pos));
  }

  /** Next value, or an operator keyword (returned as `{ op }`), or undefined at EOF. */
  next(): PdfValue | { op: string } | { end: string } | undefined {
    this.skip();
    const b = this.bytes;
    if (this.pos >= b.length) return undefined;
    const c = b[this.pos] as number;
    if (c === 0x2f) {
      this.pos++;
      return { name: this.word() };
    }
    if (c === 0x28) return { str: this.literalString() };
    if (c === 0x3c && b[this.pos + 1] === 0x3c) {
      this.pos += 2;
      return this.dictionary();
    }
    if (c === 0x3c) return { str: this.hexString() };
    if (c === 0x5b) {
      this.pos++;
      const items: PdfValue[] = [];
      for (;;) {
        const v = this.next();
        if (v === undefined) throw new PdfTextError("unterminated array");
        if (typeof v === "object" && v !== null && "end" in v && v.end === "]") break;
        items.push(this.resolveRef(items, v));
      }
      return items;
    }
    if (c === 0x5d || (c === 0x3e && b[this.pos + 1] === 0x3e)) {
      const end = c === 0x5d ? "]" : ">>";
      this.pos += end.length;
      return { end };
    }
    const w = this.word();
    if (w === "") throw new PdfTextError(`unexpected byte ${c} at ${this.pos}`);
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) return Number(w);
    if (w === "true" || w === "false") return w === "true";
    if (w === "null") return null;
    return { op: w };
  }

  /** `a b R` arrives as three tokens; fold the last two numbers into a reference. */
  private resolveRef(items: PdfValue[], v: PdfValue | { op: string } | { end: string }): PdfValue {
    if (typeof v === "object" && v !== null && "end" in v) {
      throw new PdfTextError(`mismatched ${v.end}`);
    }
    if (typeof v === "object" && v !== null && "op" in v) {
      if (v.op === "R" && typeof items.at(-1) === "number" && typeof items.at(-2) === "number") {
        items.pop();
        return { ref: items.pop() as number };
      }
      throw new PdfTextError(`unexpected keyword ${v.op} in object`);
    }
    return v;
  }

  private dictionary(): PdfDict {
    const flat: PdfValue[] = [];
    for (;;) {
      const v = this.next();
      if (v === undefined) throw new PdfTextError("unterminated dictionary");
      if (typeof v === "object" && v !== null && "end" in v && v.end === ">>") break;
      flat.push(this.resolveRef(flat, v));
    }
    const dict = new Map<string, PdfValue>();
    for (let i = 0; i + 1 < flat.length; i += 2) {
      const key = flat[i];
      if (!isName(key)) throw new PdfTextError("dictionary key is not a name");
      dict.set(key.name, flat[i + 1] as PdfValue);
    }
    return { dict };
  }

  private literalString(): Uint8Array {
    const b = this.bytes;
    const out: number[] = [];
    let depth = 0;
    this.pos++; // (
    while (this.pos < b.length) {
      const c = b[this.pos++] as number;
      if (c === 0x5c) {
        const e = b[this.pos++] as number;
        const simple: Record<number, number> = {
          110: 0x0a,
          114: 0x0d,
          116: 0x09,
          98: 0x08,
          102: 0x0c,
          40: 0x28,
          41: 0x29,
          92: 0x5c,
        };
        if (e in simple) out.push(simple[e] as number);
        else if (e >= 0x30 && e <= 0x37) {
          let oct = e - 0x30;
          for (let k = 0; k < 2; k++) {
            const d = b[this.pos] as number;
            if (d < 0x30 || d > 0x37) break;
            oct = oct * 8 + (d - 0x30);
            this.pos++;
          }
          out.push(oct & 0xff);
        } else if (e === 0x0d || e === 0x0a) {
          if (e === 0x0d && b[this.pos] === 0x0a) this.pos++;
        } else out.push(e);
      } else if (c === 0x28) {
        depth++;
        out.push(c);
      } else if (c === 0x29) {
        if (depth === 0) break;
        depth--;
        out.push(c);
      } else out.push(c);
    }
    return Uint8Array.from(out);
  }

  private hexString(): Uint8Array {
    const b = this.bytes;
    this.pos++; // <
    let hex = "";
    while (this.pos < b.length && b[this.pos] !== 0x3e) {
      const c = b[this.pos++] as number;
      if (!WHITESPACE.has(c)) hex += String.fromCharCode(c);
    }
    this.pos++; // >
    if (hex.length % 2) hex += "0";
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  /**
   * Like `operations`, for CMap streams: they contain keywords (begincmap,
   * def, findresource…) and dictionaries that are not content operators, so
   * unknown syntax is skipped and every operand run ends at a keyword.
   */
  operationsLoose(): PdfOp[] {
    const ops: PdfOp[] = [];
    let args: PdfValue[] = [];
    for (;;) {
      let v: ReturnType<Lexer["next"]>;
      try {
        v = this.next();
      } catch {
        this.pos++;
        continue;
      }
      if (v === undefined) break;
      if (typeof v === "object" && v !== null && "op" in v) {
        ops.push({ op: v.op, args });
        args = [];
      } else if (typeof v === "object" && v !== null && "end" in v) {
        args = [];
      } else args.push(v);
    }
    return ops;
  }

  /** Parse a content stream into operators with their operands. */
  operations(): PdfOp[] {
    const ops: PdfOp[] = [];
    let args: PdfValue[] = [];
    for (;;) {
      const v = this.next();
      if (v === undefined) break;
      if (typeof v === "object" && v !== null && "op" in v) {
        ops.push({ op: v.op, args });
        args = [];
      } else if (typeof v === "object" && v !== null && "end" in v) {
        throw new PdfTextError(`stray ${v.end} in content stream`);
      } else args.push(v);
    }
    return ops;
  }
}

// ── Document ────────────────────────────────────────────────────────────────

interface PdfObject {
  value: PdfValue;
  stream?: Uint8Array;
}

function readObjects(pdf: Uint8Array): Map<number, PdfObject> {
  const text = new TextDecoder("latin1").decode(pdf);
  const objects = new Map<number, PdfObject>();
  const re = /(\d+) 0 obj\b/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const start = m.index + m[0].length;
    const end = text.indexOf("endobj", start);
    if (end < 0) throw new PdfTextError(`object ${m[1]} has no endobj`);
    const lexer = new Lexer(pdf.subarray(start, end));
    const value = lexer.next();
    if (value === undefined || (typeof value === "object" && value !== null && "op" in value)) {
      throw new PdfTextError(`object ${m[1]} is empty`);
    }
    const obj: PdfObject = { value: value as PdfValue };
    const body = text.slice(start + lexer.pos, end);
    const s = body.indexOf("stream");
    if (s >= 0 && isDict(obj.value)) {
      let from = start + lexer.pos + s + "stream".length;
      if (pdf[from] === 0x0d) from++;
      if (pdf[from] === 0x0a) from++;
      const length = obj.value.dict.get("Length");
      if (typeof length !== "number") throw new PdfTextError(`object ${m[1]}: indirect /Length`);
      const raw = pdf.subarray(from, from + length);
      const filter = obj.value.dict.get("Filter");
      if (filter === undefined) obj.stream = raw;
      else if (isName(filter) && filter.name === "FlateDecode") obj.stream = inflateSync(raw);
      else throw new PdfTextError(`object ${m[1]}: unsupported stream filter`);
    }
    if (isDict(obj.value) && isName(obj.value.dict.get("Type"))) {
      const type = (obj.value.dict.get("Type") as { name: string }).name;
      if (type === "ObjStm") throw new PdfTextError("object streams are not supported");
    }
    objects.set(Number(m[1]), obj);
  }
  return objects;
}

interface FontInfo {
  postScriptName: string;
  /** CID → Unicode string. */
  unicode: Map<number, string>;
  /** CID → advance in 1/1000 em. */
  widths: Map<number, number>;
  defaultWidth: number;
}

function parseToUnicode(cmap: Uint8Array): Map<number, string> {
  const out = new Map<number, string>();
  const utf16 = (bytes: Uint8Array) => {
    let s = "";
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      s += String.fromCharCode(((bytes[i] as number) << 8) | (bytes[i + 1] as number));
    }
    return s;
  };
  const code = (bytes: Uint8Array) => bytes.reduce((acc, b) => acc * 256 + b, 0);
  const ops = new Lexer(cmap).operationsLoose();
  for (const { op, args } of ops) {
    if (op === "endbfchar") {
      for (let i = 0; i + 1 < args.length; i += 2) {
        const src = args[i];
        const dst = args[i + 1];
        if (isStr(src) && isStr(dst)) out.set(code(src.str), utf16(dst.str));
      }
    } else if (op === "endbfrange") {
      for (let i = 0; i + 2 < args.length; i += 3) {
        const lo = args[i];
        const hi = args[i + 1];
        const dst = args[i + 2];
        if (!isStr(lo) || !isStr(hi)) continue;
        const from = code(lo.str);
        const to = code(hi.str);
        if (Array.isArray(dst)) {
          dst.forEach((d, k) => {
            if (isStr(d)) out.set(from + k, utf16(d.str));
          });
        } else if (isStr(dst)) {
          const base = utf16(dst.str);
          const last = base.charCodeAt(base.length - 1);
          for (let c = from; c <= to; c++) {
            out.set(c, base.slice(0, -1) + String.fromCharCode(last + (c - from)));
          }
        }
      }
    }
  }
  return out;
}

// ── Interpreter ─────────────────────────────────────────────────────────────

/**
 * Letter-spacing hidden in TJ offsets: the value shared by at least 60% of
 * the gaps between glyphs (kerning pairs are the exceptions). Runs with fewer
 * than two gaps, or no dominant non-zero value, have no letter-spacing.
 */
function uniformSpacing(gaps: number[]): number {
  if (gaps.length < 2) return 0;
  const counts = new Map<number, number>();
  for (const g of gaps) {
    const key = Math.round(g * 100) / 100;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const [value, count] = [...counts].sort((a, b) => b[1] - a[1])[0] as [number, number];
  return value !== 0 && count / gaps.length >= 0.6 ? value : 0;
}

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** `a` applied first, then `b` (PDF row-vector convention: a × b). */
function mul(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ];
}

interface GraphicsState {
  ctm: Matrix;
  fill: [number, number, number];
  alpha: number;
}

const hex = (rgb: [number, number, number]) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;

/**
 * Extract every text run from a single-page takumi-pdf document rendered with
 * `viewport: { width, height }` (CSS px). Coordinates come back in that px
 * space, top-left origin, which is also the SVG's coordinate space.
 */
export function extractTextRuns(pdf: Uint8Array, viewport: { width: number; height: number }) {
  const objects = readObjects(pdf);
  const get = (v: PdfValue | undefined): PdfValue | undefined => {
    let cur = v;
    for (let guard = 0; isRef(cur) && guard < 16; guard++) cur = objects.get(cur.ref)?.value;
    return cur;
  };
  const dictOf = (v: PdfValue | undefined) => {
    const d = get(v);
    return isDict(d) ? d.dict : undefined;
  };

  const pages = [...objects.values()].filter(
    (o) => isDict(o.value) && (get(o.value.dict.get("Type")) as { name?: string })?.name === "Page",
  );
  if (pages.length !== 1) throw new PdfTextError(`expected one page, found ${pages.length}`);
  const page = (pages[0] as PdfObject).value as PdfDict;
  const media = get(page.dict.get("MediaBox"));
  if (!Array.isArray(media) || media.length !== 4) throw new PdfTextError("page has no MediaBox");
  const [, , mediaW, mediaH] = media as number[];
  const scale = viewport.width / (mediaW as number);

  const fontCache = new Map<number, FontInfo>();
  const fontOf = (ref: PdfValue | undefined): FontInfo => {
    if (!isRef(ref)) throw new PdfTextError("font resource is not an indirect object");
    const cached = fontCache.get(ref.ref);
    if (cached) return cached;
    const font = dictOf(ref);
    if (!font) throw new PdfTextError("missing font object");
    const base = get(font.get("BaseFont"));
    const encoding = get(font.get("Encoding"));
    if (!isName(base) || !isName(encoding) || encoding.name !== "Identity-H") {
      throw new PdfTextError("only Type0 Identity-H fonts are supported");
    }
    const toUnicode = font.get("ToUnicode");
    const cmap = isRef(toUnicode) ? objects.get(toUnicode.ref)?.stream : undefined;
    if (!cmap) throw new PdfTextError(`font ${base.name} has no ToUnicode CMap`);
    const descendants = get(font.get("DescendantFonts"));
    const cid = Array.isArray(descendants) ? dictOf(descendants[0]) : undefined;
    const widths = new Map<number, number>();
    const w = get(cid?.get("W"));
    if (Array.isArray(w)) {
      for (let i = 0; i < w.length; ) {
        const first = w[i] as number;
        const next = get(w[i + 1]);
        if (Array.isArray(next)) {
          next.forEach((v, k) => {
            widths.set(first + k, get(v) as number);
          });
          i += 2;
        } else {
          const last = next as number;
          const width = get(w[i + 2]) as number;
          for (let c = first; c <= last; c++) widths.set(c, width);
          i += 3;
        }
      }
    }
    const dw = get(cid?.get("DW"));
    const info: FontInfo = {
      postScriptName: base.name.replace(/^[A-Z]{6}\+/, ""),
      unicode: parseToUnicode(cmap),
      widths,
      defaultWidth: typeof dw === "number" ? dw : 1000,
    };
    fontCache.set(ref.ref, info);
    return info;
  };

  const runs: PdfTextRun[] = [];

  const run = (
    content: Uint8Array,
    resources: Map<string, PdfValue> | undefined,
    start: GraphicsState,
  ) => {
    const fonts = dictOf(resources?.get("Font"));
    const xobjects = dictOf(resources?.get("XObject"));
    const extStates = dictOf(resources?.get("ExtGState"));
    const stack: GraphicsState[] = [];
    let gs: GraphicsState = { ...start, fill: [...start.fill] };
    let tm: Matrix = IDENTITY;
    let tlm: Matrix = IDENTITY;
    let font: FontInfo | undefined;
    let size = 0;
    let charSpacing = 0;
    let wordSpacing = 0;
    let hScale = 1;
    let leading = 0;
    let rise = 0;

    const show = (items: PdfValue[]) => {
      if (!font) throw new PdfTextError("text shown before Tf");
      const origin = mul([1, 0, 0, 1, 0, rise], mul(tm, gs.ctm));
      let text = "";
      let advance = 0; // text-space units
      // TJ offsets between consecutive glyphs. takumi-pdf writes CSS
      // letter-spacing as a uniform offset here (it never emits Tc), mixed with
      // occasional kerning; see `uniformSpacing`.
      const gaps: number[] = [];
      let pending = 0;
      let glyphs = 0;
      // Centred and right-aligned lines start at the line box and shift the
      // first glyph with a leading TJ offset; the pen position of that first
      // glyph is the line's real x.
      let lead = 0;
      let inkEnd = 0;
      for (const item of items) {
        if (typeof item === "number") {
          advance -= (item / 1000) * size * hScale;
          pending -= (item / 1000) * size * hScale;
          continue;
        }
        if (!isStr(item)) continue;
        const bytes = item.str;
        for (let i = 0; i + 1 < bytes.length; i += 2) {
          const cid = ((bytes[i] as number) << 8) | (bytes[i + 1] as number);
          if (glyphs++ > 0) gaps.push(pending);
          else lead = advance;
          pending = 0;
          const ch = font.unicode.get(cid) ?? "";
          text += ch;
          const w = (font.widths.get(cid) ?? font.defaultWidth) / 1000;
          advance += (w * size + charSpacing + (ch === " " ? wordSpacing : 0)) * hScale;
          if (ch.trim()) inkEnd = advance;
        }
      }
      // Device space (PDF points, y up) → page px (y down).
      const [a, b, c, d, e, f] = origin;
      const x = (e + lead * a) * scale;
      const baseline = ((mediaH as number) - f) * scale;
      const vScale = Math.hypot(c, d);
      const hUnit = Math.hypot(a, b);
      runs.push({
        text,
        x,
        baseline,
        fontSize: size * vScale * scale,
        postScriptName: font.postScriptName,
        fill: hex(gs.fill),
        opacity: gs.alpha,
        letterSpacing: (charSpacing + uniformSpacing(gaps)) * hUnit * scale,
        width: (inkEnd - lead) * hUnit * scale,
      });
      tm = mul([1, 0, 0, 1, advance, 0], tm);
    };

    for (const { op, args } of new Lexer(content).operations()) {
      const n = (i: number) => get(args[i]) as number;
      switch (op) {
        case "q":
          stack.push({ ...gs, fill: [...gs.fill] });
          break;
        case "Q":
          gs = stack.pop() ?? gs;
          break;
        case "cm":
          gs.ctm = mul([n(0), n(1), n(2), n(3), n(4), n(5)], gs.ctm);
          break;
        case "rg":
          gs.fill = [n(0), n(1), n(2)];
          break;
        case "g":
          gs.fill = [n(0), n(0), n(0)];
          break;
        case "gs": {
          const state = dictOf(extStates?.get((args[0] as { name: string }).name));
          const ca = get(state?.get("ca"));
          if (typeof ca === "number") gs.alpha = start.alpha * ca;
          break;
        }
        case "Do": {
          const ref = xobjects?.get((args[0] as { name: string }).name);
          const xobj = isRef(ref) ? objects.get(ref.ref) : undefined;
          if (!xobj || !isDict(xobj.value)) break;
          const subtype = get(xobj.value.dict.get("Subtype"));
          if (!isName(subtype) || subtype.name !== "Form" || !xobj.stream) break;
          const matrix = get(xobj.value.dict.get("Matrix"));
          const m = Array.isArray(matrix) ? (matrix.map((v) => get(v)) as Matrix) : IDENTITY;
          run(xobj.stream, dictOf(xobj.value.dict.get("Resources")), {
            ctm: mul(m, gs.ctm),
            fill: [...gs.fill],
            alpha: gs.alpha,
          });
          break;
        }
        case "BT":
          tm = IDENTITY;
          tlm = IDENTITY;
          break;
        case "Tf":
          font = fontOf(fonts?.get((args[0] as { name: string }).name));
          size = n(1);
          break;
        case "Tc":
          charSpacing = n(0);
          break;
        case "Tw":
          wordSpacing = n(0);
          break;
        case "Tz":
          hScale = n(0) / 100;
          break;
        case "TL":
          leading = n(0);
          break;
        case "Ts":
          rise = n(0);
          break;
        case "Tm":
          tm = [n(0), n(1), n(2), n(3), n(4), n(5)];
          tlm = tm;
          break;
        case "Td":
        case "TD":
          if (op === "TD") leading = -n(1);
          tlm = mul([1, 0, 0, 1, n(0), n(1)], tlm);
          tm = tlm;
          break;
        case "T*":
          tlm = mul([1, 0, 0, 1, 0, -leading], tlm);
          tm = tlm;
          break;
        case "Tj":
          show([args[0] as PdfValue]);
          break;
        case "TJ":
          show(args[0] as PdfValue[]);
          break;
        case "'":
        case '"':
          throw new PdfTextError(`text operator ${op} is not supported`);
      }
    }
  };

  const contents = get(page.dict.get("Contents"));
  const streams = (Array.isArray(contents) ? contents : [page.dict.get("Contents")])
    .map((c) => (isRef(c) ? objects.get(c.ref)?.stream : undefined))
    .filter((s): s is Uint8Array => s !== undefined);
  const resources = dictOf(page.dict.get("Resources"));
  for (const stream of streams)
    run(stream, resources, { ctm: IDENTITY, fill: [0, 0, 0], alpha: 1 });
  return runs;
}
