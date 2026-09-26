import { expect, test } from "bun:test";
import { renderPdf } from "../pdf";
import { reports } from ".";

test.each(Object.values(reports).map((r) => [r.id, r] as const))(
  "report %s renders",
  async (_id, report) => {
    const bytes = await renderPdf(report.render(), report.pdf);
    expect(bytes.byteLength).toBeGreaterThan(1000);
  },
);
