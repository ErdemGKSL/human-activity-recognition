/** The slide fields the guide needs to label a slide. */
export interface GuideSlide {
  id: string;
  layout: string;
  title?: string;
}

/** A human label for any slide layout (not every layout has a `title`). */
export function slideTitle(slide: GuideSlide): string {
  return slide.title || slide.id;
}
