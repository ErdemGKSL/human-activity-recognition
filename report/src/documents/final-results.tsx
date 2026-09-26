import { Document, FigurePlaceholder, Section, SubSection, Table, Todo } from "../pdf";
import { deliverable, project } from "../project";
import { ReportTitle } from "./ReportTitle";
import type { ReportDefinition } from "./types";

const ID = "final-results";

/** Final Results raporu (hocaya teslim edilen düz PDF) — iskelet. */
export const finalResults: ReportDefinition = {
  id: ID,
  pdf: {
    title: `${project.title} — ${deliverable(ID, "report").title}`,
    footerLabel: "Final Results",
    authors: [...project.authors],
  },
  render: () => (
    <Document>
      <ReportTitle id={ID} />
      <Section number="1" title="Giriş">
        <Todo />
      </Section>
      <Section number="2" title="Veri Ön İşleme Süreci">
        <Todo>Segmentasyon, pencereleme, normalizasyon, train/test ayrımı.</Todo>
      </Section>
      <Section number="3" title="Veri Analizi">
        <Todo />
        <FigurePlaceholder caption="Şekil 1: Sınıf dağılımı" />
      </Section>
      <Section number="4" title="Model Mimarileri">
        {project.models.map((model, i) => (
          <SubSection key={model} number={`4.${i + 1}`} title={model}>
            <Todo>{model} mimarisi ve hiperparametreleri.</Todo>
          </SubSection>
        ))}
      </Section>
      <Section number="5" title="Deneyler">
        <Todo>MLP, 1D CNN, LSTM ve GRU deney düzeni.</Todo>
      </Section>
      <Section number="6" title="Eğitim ve Test Sonuçları">
        <Table
          columns={["Model", ...project.metrics.filter((m) => m !== "Confusion Matrix")]}
          rows={project.models.map((model) => [model, "—", "—", "—", "—"])}
          caption="Tablo 1: Test kümesi sonuçları"
        />
        <FigurePlaceholder caption="Şekil 2: Confusion matrix" />
      </Section>
      <Section number="7" title="Modellerin Karşılaştırılması">
        <Todo />
      </Section>
      <Section number="8" title="Gerçek Telefon Sensör Verileriyle Ek Testler">
        <Todo />
      </Section>
      <Section number="9" title="Sonuçlar ve Değerlendirme">
        <Todo />
      </Section>
      <Section number="10" title="Gelecek Çalışmalar">
        <Todo />
      </Section>
      <Section title="Kaynakça" newPage>
        <Todo />
      </Section>
    </Document>
  ),
};
