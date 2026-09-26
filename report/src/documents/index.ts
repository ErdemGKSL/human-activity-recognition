import { finalResults } from "./final-results";
import { literatureReview } from "./literature-review";
import type { ReportDefinition } from "./types";

export type { ReportDefinition } from "./types";
export { finalResults, literatureReview };

/** Every report, keyed by id. Add new reports here. */
export const reports: Record<string, ReportDefinition> = Object.fromEntries(
  [literatureReview, finalResults].map((r) => [r.id, r]),
);

export function getReport(id: string): ReportDefinition {
  const report = reports[id];
  if (!report) {
    throw new Error(`Unknown report "${id}". Available: ${Object.keys(reports).join(", ")}`);
  }
  return report;
}
