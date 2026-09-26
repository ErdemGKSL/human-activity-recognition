import type { SlideLayout } from "@pptx/core";
import type { LayoutComponent } from "../types";
import { Agenda } from "./Agenda";
import { BarChart } from "./BarChart";
import { Bullets } from "./Bullets";
import { Closing } from "./Closing";
import { Cover } from "./Cover";
import { Flow } from "./Flow";
import { Metrics } from "./Metrics";
import { Quote } from "./Quote";
import { Section } from "./Section";
import { Stage } from "./Stage";
import { Table } from "./Table";

/**
 * Layout registry. The mapped type forces one component per `SlideLayout`,
 * so adding a layout to @pptx/core fails type-checking until it's wired here.
 */
export const layouts: { [L in SlideLayout]: LayoutComponent<L> } = {
  cover: Cover,
  agenda: Agenda,
  section: Section,
  metrics: Metrics,
  bullets: Bullets,
  flow: Flow,
  "bar-chart": BarChart,
  table: Table,
  quote: Quote,
  stage: Stage,
  closing: Closing,
};

export { Agenda, BarChart, Bullets, Closing, Cover, Flow, Metrics, Quote, Section, Stage, Table };
