import type { SectionSlide } from "@pptx/core";

/**
 * A placeholder slide for a part of the talk that has no content yet. It keeps
 * the deck's structure (and its slide-directions entry) in place until the
 * real layout — metrics, bar-chart, table, stage… — replaces it.
 */
export function todoSlide(id: string, title: string, description: string): SectionSlide {
  return { id, layout: "section", eyebrow: "TODO", title, description };
}
