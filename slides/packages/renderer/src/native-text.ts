import { Renderer } from "@takumi-rs/core";
import type { Element } from "@xmldom/xmldom";
import { render as renderPdf } from "takumi-pdf";
import { type FontFace, POWERPOINT_TYPEFACE, snapWeight } from "./fonts";
import { BLOCK_ATTR, type TakumiNode } from "./layers";
import { extractTextRuns, type PdfTextRun } from "./pdf-text";

/**
 * Editable PowerPoint text from Takumi layout.
 *
 * Takumi's SVG draws every line of text as glyph outlines (`<g fill><use
 * href="#gN" x y/>…</g>`), and ppt-master turns outlines into shapes. Its
 * native text boxes come only from SVG `<text>`. We rebuild each line as
 * `<text>` from two other views of the *same* layout, so nothing is
 * re-measured or guessed:
 *
 * - **takumi-pdf** writes real PDF text. `extractTextRuns` reads back each
 *   line's string, face, size, colour, opacity, letter-spacing and baseline.
 * - **measure()** from `@takumi-rs/core` returns the layout tree with each text
 *   node's lines. It says which lines belong to one paragraph, which the PDF
 *   cannot (two wrapped lines and two adjacent bullets look alike there).
 *
 * The SVG glyph group of each line starts at the same pen position as its PDF
 * run, which is how the two are paired. Paired groups are replaced in place,
 * so paint order, `<Animate>` block membership and group bounds (computed from
 * the outlines, before replacement) are unchanged.
 */

export interface TextLine extends PdfTextRun {
  bold: boolean;
  italic: boolean;
  /** Lines with the same value come from one text node (one paragraph). */
  paragraph: number;
  /** Layout box of that text node: the width Takumi wrapped the paragraph in. */
  frame?: { x: number; y: number; width: number; height: number };
}

export class NativeTextError extends Error {
  override name = "NativeTextError";
}

interface MeasuredNode {
  width: number;
  height: number;
  transform: [number, number, number, number, number, number];
  children: MeasuredNode[];
  runs: { text: string; x: number; y: number; width: number; height: number }[];
}

let measurer: Promise<Renderer> | undefined;
function measureRenderer(fonts: FontFace[]): Promise<Renderer> {
  measurer ??= (async () => {
    const r = new Renderer();
    for (const f of fonts) await r.registerFont({ name: f.name, data: f.data });
    return r;
  })();
  return measurer;
}

/** Map every CSS font weight in the tree onto a face that exists (see `snapWeight`). */
export function snapFontWeights(node: TakumiNode): TakumiNode {
  const style = node.style;
  const next: TakumiNode = { ...node };
  if (style && "fontWeight" in style)
    next.style = { ...style, fontWeight: snapWeight(style.fontWeight) };
  if (node.children) next.children = node.children.map(snapFontWeights);
  return next;
}

/** Every laid-out line of text on the slide, with paragraph membership. */
export async function layoutText(
  node: TakumiNode,
  fonts: FontFace[],
  size: { width: number; height: number },
): Promise<TextLine[]> {
  const pdf = await renderPdf(node as never, {
    viewport: size,
    fonts: fonts.map((f) => ({ name: f.name, data: f.data })),
    tagged: false,
  });
  const runs = extractTextRuns(pdf, size);

  const measured = (await (
    await measureRenderer(fonts)
  ).measure(node as never, size)) as unknown as MeasuredNode;
  const boxes: {
    x: number;
    top: number;
    bottom: number;
    paragraph: number;
    frame: NonNullable<TextLine["frame"]>;
  }[] = [];
  let paragraphs = 0;
  // measure() mirrors the node tree child for child. A node's transform is its
  // border box, but its runs are relative to the content box, so the node's
  // own padding (from the node tree) is what turns one into the other. The
  // content box is also the width Takumi wrapped the paragraph in.
  const walk = (n: MeasuredNode, t: TakumiNode | undefined) => {
    if (n.runs.length > 0) {
      const id = paragraphs++;
      const [, , , , tx, ty] = n.transform;
      const pad = padding(t?.style);
      const frame = {
        x: tx + pad.left,
        y: ty + pad.top,
        width: n.width - pad.left - pad.right,
        height: n.height - pad.top - pad.bottom,
      };
      for (const r of n.runs) {
        boxes.push({
          x: frame.x + r.x,
          top: frame.y + r.y,
          bottom: frame.y + r.y + r.height,
          paragraph: id,
          frame,
        });
      }
    }
    n.children.forEach((c, k) => {
      walk(c, t?.children?.[k]);
    });
  };
  walk(measured, node);

  const faces = new Map(fonts.map((f) => [f.postScriptName, f]));
  return runs.map((run) => {
    const face = faces.get(run.postScriptName);
    if (!face) {
      throw new NativeTextError(
        `text "${run.text}" uses ${run.postScriptName}, which is not a registered slide font`,
      );
    }
    const box = boxes.find(
      (b) => Math.abs(b.x - run.x) < 1 && run.baseline > b.top && run.baseline <= b.bottom + 0.5,
    );
    return {
      ...run,
      bold: face.bold,
      italic: face.italic,
      paragraph: box ? box.paragraph : paragraphs++,
      ...(box ? { frame: box.frame } : {}),
    };
  });
}

const px = (v: unknown): number => {
  if (typeof v === "number") return v;
  const m = typeof v === "string" ? /^(-?[\d.]+)(px)?$/.exec(v.trim()) : null;
  return m ? Number(m[1]) : 0;
};

/** Padding of a node from its inline style (`padding` shorthand and longhands, px). */
function padding(style: Record<string, unknown> | undefined) {
  const out = { top: 0, right: 0, bottom: 0, left: 0 };
  if (!style) return out;
  const short = style.padding;
  if (short !== undefined) {
    const parts = typeof short === "number" ? [short] : String(short).trim().split(/\s+/).map(px);
    const [t = 0, r = t, b = t, l = r] = parts.map(px);
    Object.assign(out, { top: t, right: r, bottom: b, left: l });
  }
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    const v = style[`padding${side}`];
    if (v !== undefined) out[side.toLowerCase() as keyof typeof out] = px(v);
  }
  return out;
}

// ── SVG rewrite ─────────────────────────────────────────────────────────────

const SVG_NS = "http://www.w3.org/2000/svg";

const elementChildren = (el: Element) =>
  Array.from(el.childNodes).filter((n): n is Element => n.nodeType === 1);

/**
 * Takumi's text: a `<g fill>` whose children are all glyph `<use>`s, or, for a
 * one-glyph line, a bare `<use fill>`. Takumi emits `<use>` for nothing else.
 */
function isGlyphRun(el: Element): boolean {
  if (el.tagName === "use")
    return el.parentNode?.nodeType === 1 && !isGlyphRun(el.parentNode as Element);
  if (el.tagName !== "g") return false;
  const kids = elementChildren(el);
  return kids.length > 0 && kids.every((k) => k.tagName === "use");
}

/** The first glyph of a run: its pen position is the line's origin. */
const firstGlyph = (run: Element) =>
  run.tagName === "use" ? run : (elementChildren(run)[0] as Element);

const round = (n: number) => String(Math.round(n * 100) / 100);

type Anchor = "start" | "middle" | "end";

/** Temporary attributes carrying a `<text>`'s true left edge and width to `elementBox`. */
export const TEXT_LEFT_ATTR = "data-text-left";
export const TEXT_WIDTH_ATTR = "data-text-width";
/** Temporary attribute: ppt-master's own width estimate for the same text (see below). */
export const TEXT_ESTIMATE_ATTR = "data-text-estimate";

/**
 * ppt-master's checker fails a root group whose text it *estimates* to overflow
 * the group's bounds by more than 5%. Its estimate uses a Calibri advance
 * table (identical to Carlito's metrics, verified) times a 6–12% headroom,
 * and falls back to a generic width for the Turkish dotless ı, which its
 * table lacks. Reproducing it lets `normalizeSvg` size group bounds to cover
 * the estimate where there is room. Mirrors `_estimate_run_width_with_headroom`
 * in vendor/ppt-master/…/svg_to_pptx/drawingml/elements.py.
 */
export function pptMasterWidthEstimate(line: TextLine): number {
  const dotless = [...line.text].filter((c) => c === "ı").length;
  const [fallback, real] = line.bold ? [0.578, 0.2456] : [0.55, 0.2295];
  const cased = [...line.text].filter((c) => c.toLowerCase() !== c.toUpperCase());
  const caps = cased.length ? cased.filter((c) => c === c.toUpperCase()).length / cased.length : 0;
  const headroom = 1.06 + 0.06 * caps;
  const raw =
    line.width + dotless * (fallback - real) * line.fontSize + Math.abs(line.letterSpacing);
  return raw * headroom * 1.01 + 1;
}

/**
 * Line box used for group bounds. ppt-master's checker estimates text as
 * 0.85em above and 0.35em below the baseline and fails a root group whose
 * bounds its text exceeds by more than 5%, so bounds must cover at least that.
 */
export const TEXT_ASCENT_EM = 0.9;
export const TEXT_DESCENT_EM = 0.4;

/**
 * Replace every glyph group under `root` with native `<text>`. Consecutive
 * sibling lines of one paragraph (same style and left edge) become one
 * `<text>` whose `<tspan>` rows ppt-master merges into a single paragraph
 * (`data-paragraph-soft-break`); with `--reflow-text` PowerPoint re-wraps it
 * on edit. Throws if a glyph group has no PDF line or vice versa, because
 * silently keeping outlines would bring back uneditable text.
 */
export function replaceGlyphText(root: Element, lines: TextLine[], label = "slide"): number {
  const doc = root.ownerDocument;
  if (!doc) throw new NativeTextError(`${label}: detached SVG root`);
  const unused = new Set(lines);
  const groups = Array.from(root.getElementsByTagName("*")).filter(isGlyphRun);

  const lineOf = (g: Element): TextLine => {
    const first = firstGlyph(g);
    const x = Number(first.getAttribute("x"));
    const y = Number(first.getAttribute("y"));
    const line = lines.find((l) => Math.abs(l.x - x) < 0.75 && Math.abs(l.baseline - y) < 0.75);
    if (!line) {
      throw new NativeTextError(
        `${label}: no PDF text line at (${x}, ${y}); cannot make this text editable`,
      );
    }
    unused.delete(line);
    return line;
  };

  const sameStyle = (a: TextLine, b: TextLine) =>
    a.paragraph === b.paragraph &&
    a.fontSize === b.fontSize &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.fill === b.fill &&
    a.opacity === b.opacity &&
    a.letterSpacing === b.letterSpacing;

  // Which edge the rows of a paragraph share: that is its text alignment.
  const anchorX: Record<Anchor, (l: TextLine) => number> = {
    start: (l) => l.x,
    middle: (l) => l.x + l.width / 2,
    end: (l) => l.x + l.width,
  };
  const sharedAnchor = (a: TextLine, b: TextLine): Anchor | undefined =>
    (["start", "middle", "end"] as const).find(
      (k) => Math.abs(anchorX[k](a) - anchorX[k](b)) < 0.75,
    );

  let replaced = 0;
  for (let i = 0; i < groups.length; ) {
    const head = groups[i] as Element;
    const para: { g: Element; line: TextLine }[] = [{ g: head, line: lineOf(head) }];
    let anchor: Anchor = "start";
    // Follow siblings that continue the same paragraph at a constant step.
    for (let j = i + 1; j < groups.length; j++) {
      const g = groups[j] as Element;
      const prev = para[para.length - 1] as { g: Element; line: TextLine };
      if (g.parentNode !== head.parentNode || nextElement(prev.g) !== g) break;
      if (g.getAttribute(BLOCK_ATTR) !== head.getAttribute(BLOCK_ATTR)) break;
      const line = lineOf(g);
      const step = line.baseline - prev.line.baseline;
      const first = para[0] as { line: TextLine };
      const firstStep =
        para.length > 1
          ? (para[1] as { line: TextLine }).line.baseline - first.line.baseline
          : step;
      const shared = sharedAnchor(first.line, line);
      // The second row fixes the alignment; later rows must share that edge.
      const aligned =
        para.length === 1
          ? shared !== undefined
          : Math.abs(anchorX[anchor](first.line) - anchorX[anchor](line)) < 0.75;
      if (
        !sameStyle(line, prev.line) ||
        step <= 0 ||
        Math.abs(step - firstStep) > 0.5 ||
        !aligned
      ) {
        unused.add(line);
        break;
      }
      if (para.length === 1 && shared) anchor = shared;
      para.push({ g, line });
    }
    for (const { line } of para) unused.delete(line);

    const first = (para[0] as { g: Element; line: TextLine }).line;
    const x = anchorX[anchor](first);
    const text = doc.createElementNS(SVG_NS, "text");
    text.setAttribute("x", round(x));
    text.setAttribute("y", round(first.baseline));
    if (anchor !== "start") text.setAttribute("text-anchor", anchor);
    text.setAttribute("font-size", round(first.fontSize));
    if (first.bold) text.setAttribute("font-weight", "bold");
    if (first.italic) text.setAttribute("font-style", "italic");
    text.setAttribute("fill", head.getAttribute("fill") ?? first.fill);
    // The PDF alpha is the effective one (every enclosing opacity already
    // multiplied in), so divide out what the SVG ancestors still apply.
    const own = first.opacity / ancestorOpacity(head);
    if (own < 0.999) text.setAttribute("fill-opacity", round(own));
    if (first.letterSpacing) text.setAttribute("letter-spacing", round(first.letterSpacing));
    const block = head.getAttribute(BLOCK_ATTR);
    if (block) text.setAttribute(BLOCK_ATTR, block);
    // Geometry needs the box's left edge and widths; see `elementBox`.
    const left = Math.min(...para.map(({ line }) => line.x));
    text.setAttribute(TEXT_LEFT_ATTR, round(left));
    text.setAttribute(
      TEXT_WIDTH_ATTR,
      round(Math.max(...para.map(({ line }) => line.x + line.width)) - left),
    );
    text.setAttribute(
      TEXT_ESTIMATE_ATTR,
      round(Math.max(...para.map(({ line }) => pptMasterWidthEstimate(line)))),
    );
    if (para.length === 1) {
      text.appendChild(doc.createTextNode(first.text.trim()));
    } else {
      // One paragraph, wrapped by Takumi: rows are soft breaks of a single
      // <a:p>, and the frame is the text node's own box, so `--reflow-text`
      // makes PowerPoint wrap it at the same width (Carlito = Calibri metrics)
      // and re-wrap it when edited. Rows keep explicit x/dy so ppt-master's
      // checker can verify their bounds.
      const step = (para[1] as { line: TextLine }).line.baseline - first.baseline;
      text.setAttribute("data-paragraph-line-height", round(step));
      para.forEach(({ line }, k) => {
        const tspan = doc.createElementNS(SVG_NS, "tspan");
        tspan.setAttribute("x", round(x));
        tspan.setAttribute("dy", k === 0 ? "0" : round(step));
        if (k > 0) tspan.setAttribute("data-paragraph-soft-break", "1");
        tspan.appendChild(doc.createTextNode(line.text.trim()));
        text.appendChild(tspan);
      });
      const f = first.frame;
      if (f) {
        // A hair of slack so rounding to EMU never pushes a word to the next row.
        const slack = Math.min(first.fontSize * 0.25, f.width * 0.02);
        const fx = anchor === "start" ? f.x : anchor === "end" ? f.x - slack : f.x - slack / 2;
        text.setAttribute(
          "data-pptx-frame",
          [fx, f.y, f.width + slack, f.height].map(round).join(" "),
        );
      }
    }
    head.parentNode?.insertBefore(text, head);
    for (const { g } of para) g.parentNode?.removeChild(g);
    replaced++;
    i += para.length;
  }

  unwrapOpacityGroups(root);

  // One typeface for the whole page, declared once (ppt-master's canonical form).
  if (replaced > 0) root.setAttribute("font-family", POWERPOINT_TYPEFACE);

  if (unused.size > 0) {
    const missing = [...unused].map((l) => `"${l.text}"`).join(", ");
    throw new NativeTextError(
      `${label}: text drawn without glyph outlines in the SVG: ${missing} ` +
        "(synthetic bold/italic or an unregistered font?)",
    );
  }
  return replaced;
}

/** Product of `opacity` on the ancestors of `el` (the element itself excluded). */
function ancestorOpacity(el: Element): number {
  let product = 1;
  for (let p = el.parentNode; p && p.nodeType === 1; p = p.parentNode) {
    const v = (p as Element).getAttribute("opacity");
    if (v) product *= Number(v);
  }
  return product;
}

/**
 * Takumi wraps semi-transparent text in `<g opacity>`. ppt-master can only
 * spread group alpha over the children (and warns), so a wrapper holding
 * nothing but text is dissolved into each text's own `fill-opacity`.
 */
function unwrapOpacityGroups(root: Element) {
  for (const g of Array.from(root.getElementsByTagName("g"))) {
    // The block tag (from `tagBlocks`) is bookkeeping, not paint; it moves down.
    const attrs = Array.from(g.attributes)
      .map((a) => a.name)
      .filter((n) => n !== BLOCK_ATTR);
    const kids = elementChildren(g);
    if (attrs.length !== 1 || attrs[0] !== "opacity" || kids.length === 0) continue;
    if (!kids.every((k) => k.tagName === "text")) continue;
    const alpha = Number(g.getAttribute("opacity"));
    const block = g.getAttribute(BLOCK_ATTR);
    for (const t of kids) {
      const combined = Number(t.getAttribute("fill-opacity") ?? 1) * alpha;
      if (combined < 0.999) t.setAttribute("fill-opacity", round(combined));
      if (block) t.setAttribute(BLOCK_ATTR, block);
      g.parentNode?.insertBefore(t, g);
    }
    g.parentNode?.removeChild(g);
  }
}

function nextElement(el: Element): Element | null {
  let n = el.nextSibling;
  while (n && n.nodeType !== 1) n = n.nextSibling;
  return n as Element | null;
}

/** Drop `<defs>` children no longer referenced by `href` (the glyph outlines). */
export function pruneUnreferencedDefs(root: Element, defs: Element): void {
  const refs = new Set<string>();
  for (const el of Array.from(root.getElementsByTagName("*"))) {
    for (const attr of ["href", "xlink:href"]) {
      const v = el.getAttribute(attr);
      if (v?.startsWith("#")) refs.add(v.slice(1));
    }
    for (const attr of ["fill", "stroke", "clip-path", "filter", "mask"]) {
      const m = /url\(#([^)]+)\)/.exec(el.getAttribute(attr) ?? "");
      if (m?.[1]) refs.add(m[1]);
    }
  }
  for (const def of elementChildren(defs)) {
    const id = def.getAttribute("id");
    if (def.tagName === "path" && id && !refs.has(id)) defs.removeChild(def);
  }
}
