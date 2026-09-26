import { describe, expect, test } from "bun:test";
import { ANIMATE_ID_ATTR, ANIMATE_SPEC_ATTR } from "@pptx/slides";
import { BLOCK_ATTR, findBlocks, hideAt, LayerError, type TakumiNode, tagBlocks } from "./layers";

const block = (id: string, children: TakumiNode[] = []): TakumiNode => ({
  type: "container",
  attributes: {
    [ANIMATE_ID_ATTR]: id,
    [ANIMATE_SPEC_ATTR]: JSON.stringify({ effect: "entrance_fade" }),
  },
  children,
});

describe("findBlocks", () => {
  test("collects blocks with their paths and animations", () => {
    const tree: TakumiNode = { children: [{ children: [block("a")] }, block("b")] };
    expect(findBlocks(tree)).toEqual([
      { id: "a", animation: { effect: "entrance_fade" }, path: [0, 0] },
      { id: "b", animation: { effect: "entrance_fade" }, path: [1] },
    ]);
  });

  test("rejects nesting, duplicates and chrome ids", () => {
    expect(() => findBlocks({ children: [block("a", [block("b")])] })).toThrow(LayerError);
    expect(() => findBlocks({ children: [block("a"), block("a")] })).toThrow(LayerError);
    expect(() => findBlocks({ children: [block("page-footer")] })).toThrow(/static chrome/);
  });
});

test("hideAt hides only the target and leaves the input untouched", () => {
  const tree: TakumiNode = { children: [block("a"), block("b")] };
  const hidden = hideAt(tree, [1]);
  expect(hidden.children?.[1]?.style).toEqual({ visibility: "hidden" });
  expect(hidden.children?.[0]?.style).toBeUndefined();
  expect(tree.children?.[1]?.style).toBeUndefined();
});

describe("tagBlocks", () => {
  // Glyph def ids differ between renders; tagging must match by content.
  const full = `<svg xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="10" height="10"/>
<use href="#g0" x="1" y="1"/>
<use href="#g1" x="5" y="1"/>
<defs><path id="g0" d="M0 0h1"/><path id="g1" d="M0 0h2"/></defs></svg>`;
  const withoutA = `<svg xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="10" height="10"/>
<use href="#g0" x="5" y="1"/>
<defs><path id="g0" d="M0 0h2"/></defs></svg>`;

  test("tags elements missing from a block's hidden render", () => {
    const out = tagBlocks(full, new Map([["a", withoutA]]));
    expect(out).toContain(`<use href="#g0" x="1" y="1" ${BLOCK_ATTR}="a"/>`);
    expect(out).toContain('<use href="#g1" x="5" y="1"/>');
    expect(out).not.toContain(`<rect x="0" y="0" width="10" height="10" ${BLOCK_ATTR}`);
  });

  test("fails when a block renders nothing", () => {
    expect(() => tagBlocks(full, new Map([["a", full]]))).toThrow(/rendered nothing/);
  });
});
