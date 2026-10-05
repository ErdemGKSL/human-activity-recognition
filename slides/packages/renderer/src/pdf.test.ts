import { expect, test } from "bun:test";
import { decks } from "@pptx/mock-data";
import { renderDeckPdf } from "./pdf";

test("renderDeckPdf writes one 1280×720 page per slide", async () => {
  const deck = decks["product-launch"];
  if (!deck) throw new Error("mock deck missing");
  const pdf = await renderDeckPdf(deck);
  const raw = new TextDecoder("latin1").decode(pdf);
  expect(raw.startsWith("%PDF-")).toBe(true);
  // takumi-pdf writes page objects uncompressed: count them and check the size
  // (1280×720 CSS px = 960×540 pt).
  expect(raw.match(/\/Type\/Page\b(?!s)/g)?.length).toBe(deck.slides.length);
  expect(raw).toContain("/MediaBox[0 0 960 540]");
});
