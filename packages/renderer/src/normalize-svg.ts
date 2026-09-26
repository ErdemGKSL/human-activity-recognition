import type { PageRole } from "@pptx/core";
import { DOMParser, type Element, XMLSerializer } from "@xmldom/xmldom";
import { type Box, boxesOverlap, elementBox, snapBox, unionBoxes } from "./geometry";
import { BLOCK_ATTR } from "./layers";

/**
 * Takumi's SVG is valid, but ppt-master's native exporter enforces a stricter
 * "flat page" contract (see vendor/ppt-master/skills/ppt-master/references/
 * semantic-svg.md and scripts/docs/svg-contract.md). This pass bridges the two:
 *
 * 1. Root `<svg>` gets `lang` and one `data-pptx-page-role`.
 * 2. `<defs>` is hoisted to the first child; stray root `<clipPath>`s move into it.
 * 3. Empty clip groups (Takumi emits them for `border-radius` boxes with no
 *    clipped content) are dropped. Non-empty clip groups are unsupported by the
 *    exporter, so they throw with a hint instead of producing a broken deck.
 * 4. A full-canvas first `<rect>` is marked as the page background.
 * 5. Every visible root group must declare `data-pptx-bounds`, and root
 *    groups may not overlap. Without animated blocks, everything is wrapped
 *    in one canvas-sized `<g id="slide-content">`. With blocks (elements
 *    tagged `data-pptx-block` by `tagBlocks`), each block becomes
 *    `<g id="anim-<id>">` and the static content between blocks becomes
 *    `<g id="static-<n>">`, each bounded by its own geometry.
 * 6. Hex paints are canonicalized to uppercase `#RRGGBB`.
 */

export interface NormalizeOptions {
  lang: string;
  pageRole: PageRole;
  width: number;
  height: number;
  /** Used in error messages only. */
  label?: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const PAINT_ATTRS = ["fill", "stroke", "stop-color", "flood-color", "lighting-color"];

export class SvgNormalizeError extends Error {
  override name = "SvgNormalizeError";
}

export function normalizeSvg(svg: string, options: NormalizeOptions): string {
  const { lang, pageRole, width, height, label = "slide" } = options;
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  if (root?.tagName !== "svg") {
    throw new SvgNormalizeError(`${label}: renderer did not return an <svg> document`);
  }

  root.setAttribute("lang", lang);
  root.setAttribute("data-pptx-page-role", pageRole);

  // 2. Single <defs>, first child; move root-level clipPaths into it.
  let defs = childElements(root).find((el) => el.tagName === "defs");
  if (!defs) defs = doc.createElementNS(SVG_NS, "defs");
  root.insertBefore(defs, root.firstChild);
  for (const el of childElements(root)) {
    if (el.tagName === "clipPath") defs.appendChild(el);
  }

  // 3. Clip groups.
  for (const el of Array.from(root.getElementsByTagName("*"))) {
    if (!el.hasAttribute("clip-path") || el.tagName === "image") continue;
    if (el.tagName === "g" && childElements(el).length === 0) {
      el.parentNode?.removeChild(el);
      continue;
    }
    throw new SvgNormalizeError(
      `${label}: <${el.tagName} clip-path> with content is not exportable to native PPTX. ` +
        "Avoid `overflow: hidden` and clipping containers around children in slide layouts.",
    );
  }
  pruneUnreferencedClipPaths(root, defs);

  // 4. Background rect.
  const content = childElements(root).filter((el) => el !== defs);
  const [first] = content;
  if (first && isFullCanvasRect(first, width, height)) {
    first.setAttribute("id", "background");
    first.setAttribute("data-pptx-role", "background");
    content.shift();
  }

  // 5. Bounded root groups.
  const layered = content.some((el) => el.hasAttribute(BLOCK_ATTR));
  if (!layered && content.length > 0) {
    const group = doc.createElementNS(SVG_NS, "g");
    group.setAttribute("id", "slide-content");
    group.setAttribute("data-pptx-bounds", `0 0 ${width} ${height}`);
    for (const el of content) group.appendChild(el);
    root.appendChild(group);
  } else if (layered) {
    const lookup = (id: string) =>
      Array.from(defs.getElementsByTagName("*")).find((el) => el.getAttribute("id") === id);
    const groups = layerGroups(content);
    const placed: { id: string; box: Box }[] = [];
    for (const { id, members } of groups) {
      const raw = unionBoxes(members.map((el) => elementBox(el, lookup)));
      if (!raw) continue;
      const box = snapBox(raw, width, height);
      const clash = placed.find((p) => boxesOverlap(p.box, box));
      if (clash) {
        throw new SvgNormalizeError(
          `${label}: "${id}" overlaps "${clash.id}" (${fmt(box)} vs ${fmt(clash.box)}). ` +
            "ppt-master forbids overlapping root groups: keep <Animate> blocks clear of " +
            "each other and of static content, or wrap the overlapping content in the block.",
        );
      }
      placed.push({ id, box });
      const group = doc.createElementNS(SVG_NS, "g");
      group.setAttribute("id", id);
      group.setAttribute("data-pptx-bounds", fmt(box));
      for (const el of members) {
        el.removeAttribute(BLOCK_ATTR);
        group.appendChild(el);
      }
      root.appendChild(group);
    }
  }

  // 6. Paint canonicalization.
  for (const el of Array.from(root.getElementsByTagName("*"))) {
    for (const attr of PAINT_ATTRS) {
      const value = el.getAttribute(attr);
      if (value) el.setAttribute(attr, canonicalHex(value));
    }
  }

  return new XMLSerializer().serializeToString(doc);
}

/** SVG group id for an `<Animate id>` block (also the sidecar `groups` key). */
export function blockGroupId(blockId: string): string {
  return `anim-${blockId}`;
}

/**
 * Split root content, in paint order, into one group per block (gathering
 * all of a block's elements at its first position) and one group per run of
 * static elements between blocks.
 */
function layerGroups(content: Element[]): { id: string; members: Element[] }[] {
  const groups: { id: string; members: Element[] }[] = [];
  const byBlock = new Map<string, Element[]>();
  let staticRun: Element[] | undefined;
  let staticCount = 0;
  for (const el of content) {
    const block = el.getAttribute(BLOCK_ATTR);
    if (!block) {
      if (!staticRun) {
        staticRun = [];
        groups.push({ id: `static-${++staticCount}`, members: staticRun });
      }
      staticRun.push(el);
      continue;
    }
    staticRun = undefined;
    const members = byBlock.get(block);
    if (members) {
      members.push(el);
    } else {
      const fresh = [el];
      byBlock.set(block, fresh);
      groups.push({ id: blockGroupId(block), members: fresh });
    }
  }
  return groups;
}

function fmt(box: Box): string {
  return `${box.x} ${box.y} ${box.width} ${box.height}`;
}

function childElements(el: Element): Element[] {
  return Array.from(el.childNodes).filter((n): n is Element => n.nodeType === 1);
}

function isFullCanvasRect(el: Element, width: number, height: number): boolean {
  return (
    el.tagName === "rect" &&
    Number(el.getAttribute("x") ?? 0) === 0 &&
    Number(el.getAttribute("y") ?? 0) === 0 &&
    Number(el.getAttribute("width")) === width &&
    Number(el.getAttribute("height")) === height
  );
}

function pruneUnreferencedClipPaths(root: Element, defs: Element) {
  const used = new Set<string>();
  for (const el of Array.from(root.getElementsByTagName("*"))) {
    const match = el.getAttribute("clip-path")?.match(/url\(#([^)]+)\)/);
    if (match?.[1]) used.add(match[1]);
  }
  for (const el of childElements(defs)) {
    if (el.tagName === "clipPath" && !used.has(el.getAttribute("id") ?? "")) {
      defs.removeChild(el);
    }
  }
}

/** `#abc` → `#AABBCC`, `#aabbcc` → `#AABBCC`; anything else is returned as-is. */
export function canonicalHex(value: string): string {
  const short = value.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (short)
    return `#${short
      .slice(1)
      .map((c) => c + c)
      .join("")}`.toUpperCase();
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : value;
}
