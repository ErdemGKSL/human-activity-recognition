import type { Deck, SlideLayout, SlideOf, Theme } from "@pptx/core";
import type { ReactElement } from "react";

export interface SlideContext {
  deck: Deck;
  theme: Theme;
  /** 0-based slide index within the deck. */
  index: number;
  total: number;
}

export interface LayoutProps<L extends SlideLayout> extends SlideContext {
  slide: SlideOf<L>;
}

export type LayoutComponent<L extends SlideLayout> = (props: LayoutProps<L>) => ReactElement;
