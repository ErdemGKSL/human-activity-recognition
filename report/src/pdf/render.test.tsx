import { describe, expect, test } from "bun:test";
import { BulletList, Document, Paragraph, Section, Table, TitlePage } from "./components";
import { renderPdf } from "./render";

describe("renderPdf", () => {
  test("renders Turkish text, sections and tables to a PDF", async () => {
    const bytes = await renderPdf(
      <Document>
        <TitlePage title="İnsan Aktivitesi Tanıma" subtitle="çğıöşü ÇĞİÖŞÜ" />
        <Section title="Giriş" number="1">
          <Paragraph>Akselerometre ve jiroskop verileri.</Paragraph>
          <BulletList items={["MLP", "1D CNN", "LSTM", "GRU"]} />
          <Table columns={["Model", "F1"]} rows={[["GRU", "—"]]} />
        </Section>
      </Document>,
      { title: "test" },
    );
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
