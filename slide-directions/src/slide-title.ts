import type { Slide } from "@pptx/core";

/** A human label for any slide layout (not every layout has a `title`). */
export function slideTitle(slide: Slide): string {
  if ("title" in slide && slide.title) return slide.title;
  if (slide.layout === "quote") return `Alıntı — ${slide.author}`;
  return slide.id;
}
