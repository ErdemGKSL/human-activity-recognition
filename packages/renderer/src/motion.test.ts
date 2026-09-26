import { describe, expect, test } from "bun:test";
import { type Deck, defineDeck, type StageObject } from "@pptx/core";
import { renderDeck } from "./render";

const obj = (id: string, x: number, extra: Partial<StageObject> = {}): StageObject => ({
  id,
  shape: "rounded",
  x,
  y: 200,
  width: 200,
  height: 200,
  fill: "primary",
  text: id.toUpperCase(),
  ...extra,
});

const deck = (slides: Deck["slides"], extra: Partial<Deck> = {}) =>
  defineDeck({ id: "t", title: "T", lang: "en-US", slides, ...extra });

describe("morph pairing", () => {
  test("shared keys on consecutive slides pair and force a morph transition", async () => {
    const [, second] = await renderDeck(
      deck(
        [
          { id: "a", layout: "stage", objects: [obj("orb", 100, { morph: "orb" })] },
          {
            id: "b",
            layout: "stage",
            objects: [obj("big", 600, { morph: "orb", width: 400, height: 400 })],
          },
        ],
        { transition: { effect: "fade" } },
      ),
    );
    expect(second?.motion.transition).toEqual({ effect: "morph", duration: 1 });
    expect(second?.motion.morph).toEqual({
      from: "01_a",
      pairs: { orb: { from: "anim-orb", to: "anim-big" } },
    });
  });

  test("an explicit non-morph slide transition conflicts with pairs", async () => {
    const slides: Deck["slides"] = [
      { id: "a", layout: "stage", objects: [obj("orb", 100, { morph: "orb" })] },
      {
        id: "b",
        layout: "stage",
        transition: { effect: "push" },
        objects: [obj("orb", 600, { morph: "orb" })],
      },
    ];
    await expect(renderDeck(deck(slides))).rejects.toThrow(/need a morph transition/);
  });

  test("morph objects survive animate: false", async () => {
    const [first] = await renderDeck(
      deck([{ id: "a", layout: "stage", objects: [obj("orb", 100, { morph: "orb" })] }], {
        animate: false,
      }),
    );
    expect(first?.svg).toContain('<g id="anim-orb"');
    expect(first?.motion.groups).toEqual({});
  });
});

describe("triggerShape", () => {
  const withTrigger = (trigger: string) =>
    deck([
      {
        id: "a",
        layout: "stage",
        objects: [
          obj("question", 100),
          obj("answer", 600, { animation: { effect: "entrance_fade", triggerShape: trigger } }),
        ],
      },
    ]);

  test("resolves the block id to its group id", async () => {
    const [slide] = await renderDeck(withTrigger("question"));
    expect(slide?.motion.groups["anim-answer"]).toEqual([
      { effect: "entrance_fade", triggerShape: "anim-question" },
    ]);
  });

  test("rejects unknown or self triggers", async () => {
    await expect(renderDeck(withTrigger("nope"))).rejects.toThrow(/must be another block/);
    await expect(renderDeck(withTrigger("answer"))).rejects.toThrow(/must be another block/);
  });
});
