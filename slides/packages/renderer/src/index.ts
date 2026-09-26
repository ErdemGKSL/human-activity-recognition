export { FONT_FAMILY as TAKUMI_FONT_FAMILY, loadFonts } from "./fonts";
export { type Box, boxesOverlap, elementBox, pathPoints } from "./geometry";
export { type Block, findBlocks, hideAt, LayerError, tagBlocks } from "./layers";
export {
  blockGroupId,
  canonicalHex,
  type NormalizeOptions,
  normalizeSvg,
  SvgNormalizeError,
} from "./normalize-svg";
export { type RenderDeckOptions, type RenderedSlide, renderDeck, type SlideMotion } from "./render";
