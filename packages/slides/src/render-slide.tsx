import type { Slide, SlideLayout } from "@pptx/core";
import type { ReactElement } from "react";
import { layouts } from "./layouts";
import type { LayoutComponent, SlideContext } from "./types";

/** Resolve a slide's layout component and render it to a React element. */
export function renderSlide(slide: Slide, ctx: SlideContext): ReactElement {
  // The registry is keyed by layout, so this narrowing is sound.
  const Layout = layouts[slide.layout] as LayoutComponent<SlideLayout>;
  return <Layout {...ctx} slide={slide as never} />;
}
