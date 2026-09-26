import { type BlockAnimation, SLIDE_CHROME_TOKENS } from "@pptx/core";
import { ANIMATE_ID_ATTR, ANIMATE_SPEC_ATTR, MORPH_ATTR } from "@pptx/slides";
import { DOMParser, type Element, XMLSerializer } from "@xmldom/xmldom";

/**
 * Takumi's SVG output keeps no element ids, so to learn which SVG elements
 * belong to an `<Animate>` block we render the slide once per block with only
 * that block set to `visibility: hidden` (layout is unchanged) and diff the
 * result against the full render. Elements missing from the hidden render
 * belong to that block.
 */

export const BLOCK_ATTR = "data-pptx-block";

/** Minimal view of Takumi's node tree (from `fromJsx`). */
export interface TakumiNode {
  type?: string;
  id?: string;
  attributes?: Record<string, string>;
  style?: Record<string, unknown>;
  children?: TakumiNode[];
}

export interface Block {
  id: string;
  animation: BlockAnimation;
  /** Morph identity shared with a block on an adjacent slide. */
  morph?: string;
  /** Child-index path from the root node. */
  path: number[];
}

export class LayerError extends Error {
  override name = "LayerError";
}

/** Find every `<Animate>` block in the node tree. Nested blocks are rejected. */
export function findBlocks(root: TakumiNode, label = "slide"): Block[] {
  const blocks: Block[] = [];
  const walk = (node: TakumiNode, path: number[], inside?: string) => {
    const id = node.attributes?.[ANIMATE_ID_ATTR];
    if (id) {
      if (inside)
        throw new LayerError(`${label}: <Animate id="${id}"> is nested inside "${inside}"`);
      if (blocks.some((b) => b.id === id)) {
        throw new LayerError(`${label}: duplicate <Animate id="${id}">`);
      }
      assertAnimatableId(id, label);
      const spec = node.attributes?.[ANIMATE_SPEC_ATTR] ?? '"none"';
      const morph = node.attributes?.[MORPH_ATTR];
      if (morph && blocks.some((b) => b.morph === morph)) {
        throw new LayerError(`${label}: morph key "${morph}" is used by two blocks`);
      }
      blocks.push({
        id,
        animation: JSON.parse(spec) as BlockAnimation,
        ...(morph ? { morph } : {}),
        path,
      });
    }
    node.children?.forEach((child, i) => {
      walk(child, [...path, i], id ?? inside);
    });
  };
  walk(root, []);
  return blocks;
}

/**
 * ppt-master treats group ids containing chrome tokens (`footer`, `rule`,
 * `bg`, …) as static decoration and won't animate them. Fail loudly instead.
 */
function assertAnimatableId(id: string, label: string) {
  const tokens = id.toLowerCase().split(/[-_]/);
  const hit = tokens.find((t) => SLIDE_CHROME_TOKENS.includes(t));
  if (hit) {
    throw new LayerError(
      `${label}: <Animate id="${id}"> contains "${hit}", which ppt-master treats as static chrome. Rename it.`,
    );
  }
}

/** Deep-clone the tree with the node at `path` hidden (keeps its layout box). */
export function hideAt(root: TakumiNode, path: number[]): TakumiNode {
  const clone = structuredClone(root);
  let node: TakumiNode | undefined = clone;
  for (const i of path) node = node?.children?.[i];
  if (!node) throw new LayerError(`invalid block path ${path.join(".")}`);
  node.style = { ...node.style, visibility: "hidden" };
  return clone;
}

/**
 * Tag the root-level elements of `fullSvg` with `data-pptx-block="<id>"`
 * using the per-block hidden renders. Returns the tagged SVG.
 */
export function tagBlocks(fullSvg: string, hidden: Map<string, string>, label = "slide"): string {
  const full = parse(fullSvg);
  const fullKeys = keyed(full);

  for (const [id, svg] of hidden) {
    const remaining = new Map<string, number>();
    for (const { key } of keyed(parse(svg))) remaining.set(key, (remaining.get(key) ?? 0) + 1);
    let found = 0;
    for (const { el, key } of fullKeys) {
      const left = remaining.get(key) ?? 0;
      if (left > 0) {
        remaining.set(key, left - 1);
        continue;
      }
      if (el.hasAttribute(BLOCK_ATTR)) {
        throw new LayerError(
          `${label}: block "${id}" overlaps block "${el.getAttribute(BLOCK_ATTR)}"`,
        );
      }
      el.setAttribute(BLOCK_ATTR, id);
      found++;
    }
    if (found === 0) throw new LayerError(`${label}: <Animate id="${id}"> rendered nothing`);
  }
  return new XMLSerializer().serializeToString(full);
}

function parse(svg: string): Element {
  const root = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
  if (!root) throw new LayerError("renderer returned an empty SVG document");
  return root;
}

function rootChildren(root: Element): Element[] {
  return Array.from(root.childNodes).filter(
    (n): n is Element => n.nodeType === 1 && (n as Element).tagName !== "defs",
  );
}

/**
 * Pair each root element with a render-independent identity: its markup with
 * every `#id` reference (glyph `<use href>`, `url(#…)` paints and clips)
 * replaced by the referenced definition's markup, since Takumi numbers defs
 * per render.
 */
function keyed(root: Element): { el: Element; key: string }[] {
  const serializer = new XMLSerializer();
  const defs = new Map<string, string>();
  for (const def of Array.from(root.getElementsByTagName("*"))) {
    const id = def.getAttribute("id");
    if (!id) continue;
    const copy = def.cloneNode(true) as Element;
    copy.removeAttribute("id");
    defs.set(id, serializer.serializeToString(copy));
  }
  return rootChildren(root).map((el) => ({
    el,
    key: serializer
      .serializeToString(el)
      .replace(
        /(href="#|url\(#)([^")]+)/g,
        (_, prefix: string, id: string) => `${prefix}{${defs.get(id) ?? id}}`,
      ),
  }));
}
