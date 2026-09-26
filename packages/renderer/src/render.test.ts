import { describe, expect, test } from "bun:test";
import { decks } from "@pptx/mock-data";
import { renderDeck } from "./render";

// Renders every mock deck through Takumi + normalization. A layout that emits
// something ppt-master can't export (e.g. a content clip group) fails here,
// without needing the Python toolchain.
describe.each(Object.values(decks))("deck $id", (deck) => {
  test("renders every slide to normalized SVG", async () => {
    const slides = await renderDeck(deck);
    expect(slides).toHaveLength(deck.slides.length);
    for (const slide of slides) {
      expect(slide.svg).toStartWith("<svg");
      expect(slide.svg).toContain(`lang="${deck.lang}"`);
      expect(slide.svg).not.toContain("clip-path");
    }
  });

  test("every animated group exists in its slide's SVG", async () => {
    for (const slide of await renderDeck(deck)) {
      for (const id of Object.keys(slide.motion.groups)) {
        expect(slide.svg).toContain(`<g id="${id}" data-pptx-bounds=`);
      }
    }
  });

  test("slide ids are unique", () => {
    const ids = deck.slides.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

test("unknown per-slide animation keys fail loudly", async () => {
  const [deck] = Object.values(decks);
  if (!deck) throw new Error("no mock decks");
  const broken = {
    ...deck,
    slides: [
      {
        id: "x",
        layout: "agenda" as const,
        title: "T",
        items: ["a"],
        animations: { typo: "none" as const },
      },
    ],
  };
  await expect(renderDeck(broken)).rejects.toThrow(/matches no <Animate> block/);
});

test("animate: false renders a single content group without motion", async () => {
  const [deck] = Object.values(decks);
  if (!deck) throw new Error("no mock decks");
  const [slide] = await renderDeck({ ...deck, animate: false });
  expect(slide?.svg).toContain('<g id="slide-content"');
  expect(slide?.motion.groups).toEqual({});
});
