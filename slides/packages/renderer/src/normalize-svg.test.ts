import { describe, expect, test } from "bun:test";
import { BLOCK_ATTR } from "./layers";
import { canonicalHex, normalizeSvg, SvgNormalizeError } from "./normalize-svg";

const opts = { lang: "en-US", pageRole: "content", width: 100, height: 50 } as const;

const takumiLike = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
  <rect x="0" y="0" width="100" height="50" fill="#fff"/>
  <path d="M0 0h10v10h-10Z" fill="#3b82f6"/>
  <clipPath id="cp0"><path d="M0 0h10v10h-10Z"/></clipPath>
  <g clip-path="url(#cp0)"></g>
  <defs><path id="g0" d="M0 0h1v1Z"/></defs>
</svg>`;

describe("normalizeSvg", () => {
  const out = normalizeSvg(takumiLike, opts);

  test("stamps root lang and page role", () => {
    expect(out).toContain('lang="en-US"');
    expect(out).toContain('data-pptx-page-role="content"');
  });

  test("hoists defs to the first child", () => {
    expect(out.indexOf("<defs>")).toBeLessThan(out.indexOf("<rect"));
  });

  test("drops empty clip groups and their clipPaths", () => {
    expect(out).not.toContain("clip-path");
    expect(out).not.toContain("<clipPath");
  });

  test("marks the full-canvas rect as background", () => {
    expect(out).toMatch(/<rect[^>]*id="background"[^>]*data-pptx-role="background"/);
  });

  test("wraps content in one bounded root group", () => {
    expect(out).toContain('<g id="slide-content" data-pptx-bounds="0 0 100 50">');
  });

  test("uppercases hex paints", () => {
    expect(out).toContain('fill="#FFFFFF"');
    expect(out).toContain('fill="#3B82F6"');
  });

  test("rejects clip groups that clip real content", () => {
    const clipped = takumiLike.replace(
      '<g clip-path="url(#cp0)"></g>',
      '<g clip-path="url(#cp0)"><path d="M0 0h1v1Z"/></g>',
    );
    expect(() => normalizeSvg(clipped, opts)).toThrow(SvgNormalizeError);
  });
});

describe("normalizeSvg with animated blocks", () => {
  const layered = (
    a: string,
    b: string,
  ) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
  <rect x="0" y="0" width="100" height="50" fill="#fff"/>
  <rect x="0" y="0" width="100" height="8"/>
  <rect ${BLOCK_ATTR}="a" x="${a}" y="20" width="20" height="10"/>
  <rect ${BLOCK_ATTR}="b" x="${b}" y="20" width="20" height="10"/>
  <rect x="0" y="45" width="100" height="5"/>
</svg>`;

  test("emits one bounded group per block and per static run", () => {
    const out = normalizeSvg(layered("10", "50"), opts);
    const groups = [...out.matchAll(/<g id="([^"]+)" data-pptx-bounds="([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]);
    expect(groups).toEqual([
      ["static-1", "0 0 100 8"],
      ["anim-a", "10 20 20 10"],
      ["anim-b", "50 20 20 10"],
      ["static-2", "0 45 100 5"],
    ]);
    expect(out).not.toContain(BLOCK_ATTR);
  });

  test("rejects overlapping root groups", () => {
    expect(() => normalizeSvg(layered("10", "15"), opts)).toThrow(/overlaps/);
  });
});

describe("canonicalHex", () => {
  test.each([
    ["#abc", "#AABBCC"],
    ["#a1b2c3", "#A1B2C3"],
    ["none", "none"],
    ["url(#grad)", "url(#grad)"],
  ])("%s → %s", (input, expected) => {
    expect(canonicalHex(input)).toBe(expected);
  });
});
