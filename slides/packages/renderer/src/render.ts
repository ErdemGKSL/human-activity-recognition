import {
  type AnimationStep,
  CANVAS,
  type Deck,
  defaultTheme,
  extendTheme,
  PAGE_ROLE,
  type Slide,
  slideStem,
  type Transition,
  toSteps,
} from "@pptx/core";
import { renderSlide } from "@pptx/slides";
import { render, renderSvg } from "takumi-js";
import { fromJsx } from "takumi-js/helpers/jsx";
import { loadFonts } from "./fonts";
import { type Block, findBlocks, hideAt, LayerError, type TakumiNode, tagBlocks } from "./layers";
import { layoutText, snapFontWeights } from "./native-text";
import { blockGroupId, normalizeSvg } from "./normalize-svg";

/** Deterministic Morph pairing into this slide from the previous one. */
export interface MorphLink {
  /** Previous slide's stem. */
  from: string;
  /** Morph key → group ids on the previous (`from`) and this (`to`) slide. */
  pairs: Record<string, { from: string; to: string }>;
}

export interface SlideMotion {
  /** Transition into this slide (slide override, else deck default; Morph when paired). */
  transition?: Transition;
  /**
   * Animation rows keyed by SVG group id (`anim-<blockId>`), in paint order.
   * `triggerShape` values are already resolved to group ids.
   */
  groups: Record<string, AnimationStep[]>;
  morph?: MorphLink;
}

export interface RenderedSlide {
  /** File stem shared by the SVG and its notes, e.g. `03_highlights`. */
  stem: string;
  svg: string;
  notes?: string;
  motion: SlideMotion;
  /** PNG preview of the same slide, when `png: true`. */
  png?: Uint8Array;
}

export interface RenderDeckOptions {
  /** Skip normalization and block layering (raw Takumi output, for debugging). */
  raw?: boolean;
  /** Also rasterize each slide to PNG (for quick visual review). */
  png?: boolean;
}

const SIZE = { width: CANVAS.width, height: CANVAS.height };

/** Default Morph duration when a paired slide doesn't set one. */
const MORPH_DURATION = 1;

/** Render every slide of a deck to (normalized) SVG with Takumi. */
export async function renderDeck(
  deck: Deck,
  options: RenderDeckOptions = {},
): Promise<RenderedSlide[]> {
  const theme = extendTheme(defaultTheme, deck.theme);
  const fonts = await loadFonts();
  const opts = { ...SIZE, fonts: fonts.map(({ name, data }) => ({ name, data })) };
  const total = deck.slides.length;

  const rendered = await Promise.all(
    deck.slides.map(async (slide, index) => {
      const stem = slideStem(slide, index);
      const label = `${deck.id}/${stem}`;
      const element = renderSlide(slide, { deck, theme, index, total });
      // Only real faces: a synthesized weight is drawn as outlines, not text.
      const node = snapFontWeights(((await fromJsx(element)) as { node: TakumiNode }).node);

      // With animations off, blocks still matter when they carry a Morph key.
      const animate = slide.animate ?? deck.animate ?? true;
      const blocks = options.raw
        ? []
        : findBlocks(node, label).filter((b) => animate || b.morph !== undefined);

      const [full, png] = await Promise.all([
        renderSvg(node as never, opts),
        options.png ? render(node as never, { ...opts, format: "png" }) : undefined,
      ]);

      let svg = full;
      if (!options.raw) {
        if (blocks.length > 0) {
          const hidden = await Promise.all(
            blocks.map(
              async (b) => [b.id, await renderSvg(hideAt(node, b.path) as never, opts)] as const,
            ),
          );
          svg = tagBlocks(full, new Map(hidden), label);
        }
        svg = normalizeSvg(svg, {
          text: await layoutText(node, fonts, SIZE),
          lang: deck.lang,
          pageRole: PAGE_ROLE[slide.layout],
          width: CANVAS.width,
          height: CANVAS.height,
          label,
        });
      }

      const motion: SlideMotion = {
        transition: slide.transition ?? deck.transition,
        groups: animate ? resolveAnimations(slide, blocks, label) : {},
      };
      const slideOut: RenderedSlide = { stem, svg, notes: slide.notes, motion, png };
      return { slide: slideOut, blocks, label, own: slide.transition };
    }),
  );

  linkMorphs(rendered);
  return rendered.map((r) => r.slide);
}

/**
 * Pair blocks that share a `morph` key on consecutive slides. The destination
 * slide gets an explicit Morph transition, as ppt-master requires for
 * deterministic pairs (animations.md §2.1). A deck-wide default transition
 * yields to Morph; a different transition set on the slide itself is a conflict.
 */
function linkMorphs(
  slides: { slide: RenderedSlide; blocks: Block[]; label: string; own?: Transition }[],
) {
  for (let i = 1; i < slides.length; i++) {
    const prev = slides[i - 1];
    const cur = slides[i];
    if (!prev || !cur) continue;
    const pairs: MorphLink["pairs"] = {};
    for (const block of cur.blocks) {
      const source = block.morph && prev.blocks.find((b) => b.morph === block.morph);
      if (block.morph && source) {
        pairs[block.morph] = { from: blockGroupId(source.id), to: blockGroupId(block.id) };
      }
    }
    if (Object.keys(pairs).length === 0) continue;

    const { own } = cur;
    if (own && own.effect !== "morph") {
      throw new LayerError(
        `${cur.label}: morph pairs (${Object.keys(pairs).join(", ")}) need a morph transition, ` +
          `but the slide sets "${own.effect}"`,
      );
    }
    cur.slide.motion.transition = {
      ...own,
      effect: "morph",
      duration: own?.duration ?? MORPH_DURATION,
    };
    cur.slide.motion.morph = { from: prev.slide.stem, pairs };
  }
}

/** Layout defaults merged with the slide's per-block overrides. */
function resolveAnimations(slide: Slide, blocks: Block[], label: string) {
  const overrides = slide.animations ?? {};
  const known = new Set(blocks.map((b) => b.id));
  const available = () => [...known].join(", ") || "none";
  for (const id of Object.keys(overrides)) {
    if (!known.has(id)) {
      throw new LayerError(
        `${label}: animations.${id} matches no <Animate> block (available: ${available()})`,
      );
    }
  }
  const groups: Record<string, AnimationStep[]> = {};
  for (const block of blocks) {
    const steps = toSteps(overrides[block.id] ?? block.animation).map((step) => {
      if (!step.triggerShape) return step;
      if (!known.has(step.triggerShape) || step.triggerShape === block.id) {
        throw new LayerError(
          `${label}: ${block.id}.triggerShape "${step.triggerShape}" must be another block ` +
            `on the slide (available: ${available()})`,
        );
      }
      return { ...step, triggerShape: blockGroupId(step.triggerShape) };
    });
    if (steps.length > 0) groups[blockGroupId(block.id)] = steps;
  }
  return groups;
}
