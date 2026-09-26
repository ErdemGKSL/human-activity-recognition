import type { BlockAnimation } from "@pptx/core";
import type { CSSProperties, ReactNode } from "react";

/** Node attributes the renderer reads back from Takumi's node tree. */
export const ANIMATE_ID_ATTR = "data-animate-id";
export const ANIMATE_SPEC_ATTR = "data-animate";
export const MORPH_ATTR = "data-morph";

interface AnimateProps {
  /**
   * Block id, unique per slide. Becomes the PowerPoint shape group
   * (`anim-<id>`) and the key for per-slide overrides in deck data.
   */
  id: string;
  /** Default in-slide animation for this block; decks can override it per slide. */
  animation?: BlockAnimation;
  /**
   * Morph identity shared with a block on the previous/next slide. Paired
   * blocks morph (move, resize, recolor) under a Morph transition.
   */
  morph?: string;
  /** The block's own box styles — Animate *is* the flex item, not a wrapper. */
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Marks a box as one PowerPoint object: animatable in-slide and/or pairable
 * across slides with Morph. Rendering is identical to a plain flex `<div>`;
 * the renderer uses the attributes to split the slide into per-block SVG
 * groups and to emit ppt-master's animations sidecar.
 *
 * Rules: blocks must not nest, and must not overlap other content visually.
 */
export function Animate({ id, animation = "none", morph, style, children }: AnimateProps) {
  const attrs: Record<string, string> = {
    [ANIMATE_ID_ATTR]: id,
    [ANIMATE_SPEC_ATTR]: JSON.stringify(animation),
  };
  if (morph) attrs[MORPH_ATTR] = morph;
  return (
    <div {...attrs} style={{ display: "flex", ...style }}>
      {children}
    </div>
  );
}
