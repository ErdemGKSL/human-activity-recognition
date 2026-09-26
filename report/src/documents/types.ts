import type { ReactNode } from "react";
import type { PdfOptions } from "../pdf";

/** A report built to `report/output/<id>.pdf`. */
export interface ReportDefinition {
  /** Kebab-case id; the output file name. Matches the deliverable id. */
  id: string;
  pdf: PdfOptions;
  render: () => ReactNode;
}
