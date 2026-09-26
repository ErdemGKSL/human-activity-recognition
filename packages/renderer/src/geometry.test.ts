import { describe, expect, test } from "bun:test";
import { DOMParser, type Element } from "@xmldom/xmldom";
import { boxesOverlap, elementBox, pathPoints, snapBox } from "./geometry";

const el = (xml: string) =>
  new DOMParser().parseFromString(xml, "image/svg+xml").documentElement as Element;

describe("pathPoints", () => {
  test("handles relative h/v and implicit lineto", () => {
    expect(pathPoints("M10 20h30v5h-30Z")).toEqual([
      [10, 20],
      [40, 20],
      [40, 25],
      [10, 25],
    ]);
    expect(pathPoints("m0 0 5 5 5 0")).toEqual([
      [0, 0],
      [5, 5],
      [10, 5],
    ]);
  });

  test("includes curve control points", () => {
    expect(pathPoints("M0 0C0 -10 10 -10 10 0")).toContainEqual([0, -10]);
  });
});

describe("elementBox", () => {
  const none = () => undefined;

  test("rect", () => {
    expect(elementBox(el('<rect x="1" y="2" width="3" height="4"/>'), none)).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    });
  });

  test("use resolves glyphs and offsets by x/y", () => {
    const glyph = el('<path id="g0" d="M0 -10h5v10h-5Z"/>');
    const box = elementBox(el('<use href="#g0" x="100" y="50"/>'), (id) =>
      id === "g0" ? glyph : undefined,
    );
    expect(box).toEqual({ x: 100, y: 40, width: 5, height: 10 });
  });

  test("group applies translate", () => {
    const box = elementBox(
      el('<g transform="translate(10 20)"><rect x="0" y="0" width="1" height="1"/></g>'),
      none,
    );
    expect(box).toEqual({ x: 10, y: 20, width: 1, height: 1 });
  });
});

test("snapBox rounds outward and clamps", () => {
  expect(snapBox({ x: -1.5, y: 2.2, width: 10, height: 1000 }, 100, 50)).toEqual({
    x: 0,
    y: 2,
    width: 9,
    height: 48,
  });
});

test("boxesOverlap tolerates 1px", () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  expect(boxesOverlap(a, { x: 9, y: 0, width: 10, height: 10 })).toBe(false);
  expect(boxesOverlap(a, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
});
