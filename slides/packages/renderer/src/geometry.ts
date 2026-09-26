import type { Element } from "@xmldom/xmldom";

/**
 * Conservative bounding boxes for Takumi SVG output, used to size
 * `data-pptx-bounds` on layered root groups. Curves use their control points
 * (a superset of the true extent), which is fine for layout zones.
 */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Matrix = [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

class BoxBuilder {
  minX = Number.POSITIVE_INFINITY;
  minY = Number.POSITIVE_INFINITY;
  maxX = Number.NEGATIVE_INFINITY;
  maxY = Number.NEGATIVE_INFINITY;

  add(x: number, y: number, m: Matrix = IDENTITY) {
    const tx = m[0] * x + m[2] * y + m[4];
    const ty = m[1] * x + m[3] * y + m[5];
    this.minX = Math.min(this.minX, tx);
    this.minY = Math.min(this.minY, ty);
    this.maxX = Math.max(this.maxX, tx);
    this.maxY = Math.max(this.maxY, ty);
  }

  addBox(box: Box | undefined) {
    if (!box) return;
    this.add(box.x, box.y);
    this.add(box.x + box.width, box.y + box.height);
  }

  build(): Box | undefined {
    if (!Number.isFinite(this.minX)) return undefined;
    return {
      x: this.minX,
      y: this.minY,
      width: this.maxX - this.minX,
      height: this.maxY - this.minY,
    };
  }
}

/** Resolve `href="#id"` targets (glyph outlines, gradients) from `<defs>`. */
export type DefLookup = (id: string) => Element | undefined;

/** Bounding box of an element in root coordinates, or undefined if it draws nothing measurable. */
export function elementBox(
  el: Element,
  lookup: DefLookup,
  parent: Matrix = IDENTITY,
  /** Measure `<text>` with `data-text-estimate` instead of its true width. */
  estimated = false,
): Box | undefined {
  const m = multiply(parent, parseTransform(el.getAttribute("transform")));
  const out = new BoxBuilder();
  const num = (name: string) => Number(el.getAttribute(name) ?? 0);

  switch (el.tagName) {
    case "rect":
    case "image": {
      const x = num("x");
      const y = num("y");
      out.add(x, y, m);
      out.add(x + num("width"), y, m);
      out.add(x, y + num("height"), m);
      out.add(x + num("width"), y + num("height"), m);
      break;
    }
    case "circle":
    case "ellipse": {
      const rx = el.tagName === "circle" ? num("r") : num("rx");
      const ry = el.tagName === "circle" ? num("r") : num("ry");
      out.add(num("cx") - rx, num("cy") - ry, m);
      out.add(num("cx") + rx, num("cy") + ry, m);
      break;
    }
    case "path":
      for (const [x, y] of pathPoints(el.getAttribute("d") ?? "")) out.add(x, y, m);
      break;
    case "use": {
      const id = (el.getAttribute("href") ?? el.getAttribute("xlink:href") ?? "").replace(/^#/, "");
      const target = lookup(id);
      if (target) {
        const shifted = multiply(m, [1, 0, 0, 1, num("x"), num("y")]);
        out.addBox(elementBox(target, lookup, shifted, estimated));
      }
      break;
    }
    case "text": {
      // Native text from `replaceGlyphText`: true advance width, and a line box
      // at least as tall as ppt-master's own text estimate.
      const size = num("font-size");
      const lines = Math.max(1, el.getElementsByTagName("tspan").length);
      const step = num("data-paragraph-line-height");
      // Rows are laid out from the true left edge; an estimate (wider than the
      // real text) grows from the side the anchor leaves free.
      const left = num("data-text-left");
      const width = num("data-text-width");
      const anchor = el.getAttribute("text-anchor") ?? "start";
      const grow = estimated ? Math.max(0, num("data-text-estimate") - width) : 0;
      const x0 = anchor === "end" ? left - grow : anchor === "middle" ? left - grow / 2 : left;
      const x1 =
        anchor === "end"
          ? left + width
          : anchor === "middle"
            ? left + width + grow / 2
            : left + width + grow;
      const y = num("y");
      out.add(x0, y - size * 0.9, m);
      out.add(x1, y + (lines - 1) * step + size * 0.4, m);
      break;
    }
    case "g":
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === 1) out.addBox(elementBox(child as Element, lookup, m, estimated));
      }
      break;
  }
  return out.build();
}

export function unionBoxes(boxes: (Box | undefined)[]): Box | undefined {
  const out = new BoxBuilder();
  for (const box of boxes) out.addBox(box);
  return out.build();
}

/** Round outward to whole pixels and clamp to the canvas. */
export function snapBox(box: Box, width: number, height: number): Box {
  const x = Math.max(0, Math.floor(box.x));
  const y = Math.max(0, Math.floor(box.y));
  const right = Math.min(width, Math.ceil(box.x + box.width));
  const bottom = Math.min(height, Math.ceil(box.y + box.height));
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}

/** Overlap area test with ppt-master's 1px tolerance (on both axes). */
export function boxesOverlap(a: Box, b: Box, tolerance = 1): boolean {
  const dx = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const dy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return dx > tolerance && dy > tolerance;
}

function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function parseTransform(value: string | null): Matrix {
  let m = IDENTITY;
  if (!value) return m;
  for (const [, fn, args] of value.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const n = (args ?? "")
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0] = n;
    if (fn === "matrix") m = multiply(m, [a, b, c, d, e, f]);
    else if (fn === "translate") m = multiply(m, [1, 0, 0, 1, a, n.length > 1 ? b : 0]);
    else if (fn === "scale") m = multiply(m, [a, 0, 0, n.length > 1 ? b : a, 0, 0]);
    else if (fn === "rotate") {
      const r = (a * Math.PI) / 180;
      const rot: Matrix = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
      m =
        n.length > 1
          ? multiply(multiply(multiply(m, [1, 0, 0, 1, b, c]), rot), [1, 0, 0, 1, -b, -c])
          : multiply(m, rot);
    }
  }
  return m;
}

const ARG_COUNT: Record<string, number> = {
  m: 2,
  l: 2,
  h: 1,
  v: 1,
  c: 6,
  s: 4,
  q: 4,
  t: 2,
  a: 7,
  z: 0,
};

/** Every endpoint and control point of a path, in absolute coordinates. */
export function pathPoints(d: string): [number, number][] {
  const points: [number, number][] = [];
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  while (i < tokens.length) {
    const token = tokens[i] as string;
    if (/[a-zA-Z]/.test(token)) {
      cmd = token;
      i++;
      if (cmd.toLowerCase() === "z") {
        x = startX;
        y = startY;
        continue;
      }
    }
    const lower = cmd.toLowerCase();
    const count = ARG_COUNT[lower];
    if (!count) {
      i++;
      continue;
    }
    const n = tokens.slice(i, i + count).map(Number);
    i += count;
    const rel = cmd !== cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;

    switch (lower) {
      case "h":
        x = (rel ? x : 0) + (n[0] ?? 0);
        break;
      case "v":
        y = (rel ? y : 0) + (n[0] ?? 0);
        break;
      case "a":
        x = ox + (n[5] ?? 0);
        y = oy + (n[6] ?? 0);
        break;
      default:
        // Control points (pairs before the endpoint) count toward the box.
        for (let k = 0; k + 1 < count - 2; k += 2)
          points.push([ox + (n[k] ?? 0), oy + (n[k + 1] ?? 0)]);
        x = ox + (n[count - 2] ?? 0);
        y = oy + (n[count - 1] ?? 0);
    }
    points.push([x, y]);
    if (lower === "m") {
      startX = x;
      startY = y;
      // Implicit lineto after the first moveto pair.
      cmd = rel ? "l" : "L";
    }
  }
  return points;
}
