import { Document, Section, SubSection, Table, Todo } from "../pdf";
import { deliverable, project } from "../project";
import { ReportTitle } from "./ReportTitle";
import type { ReportDefinition } from "./types";

const ID = "literature-review";

/** Literature Review raporu — iskelet. Bölümler teslim listesini izler. */
export const literatureReview: ReportDefinition = {
  id: ID,
  pdf: {
    title: `${project.title} — ${deliverable(ID, "report").title}`,
    footerLabel: "Literature Review",
    authors: [...project.authors],
  },
  render: () => (
    <Document>
      <ReportTitle id={ID} />
      <Section number="1" title="Giriş">
        <Todo>Human Activity Recognition (HAR) problemi ve raporun kapsamı.</Todo>
      </Section>
      <Section number="2" title="Human Activity Recognition Alanındaki Çalışmalar">
        <Todo />
      </Section>
      <Section number="3" title="Akıllı Telefon Sensörleriyle Yapılan Çalışmalar">
        <SubSection number="3.1" title="Accelerometer">
          <Todo />
        </SubSection>
        <SubSection number="3.2" title="Gyroscope">
          <Todo />
        </SubSection>
      </Section>
      <Section number="4" title="Derin Öğrenme Yöntemleri">
        {project.models.map((model, i) => (
          <SubSection key={model} number={`4.${i + 1}`} title={model}>
            <Todo>{model} kullanan çalışmalar.</Todo>
          </SubSection>
        ))}
      </Section>
      <Section number="5" title="Yöntem ve Sonuçların Karşılaştırılması">
        <Table
          columns={["Çalışma", "Veri seti", "Sensörler", "Model", "Accuracy / F1"]}
          widths={[2, 2, 2, 1.5, 1.5]}
          rows={[["TODO", "", "", "", ""]]}
          caption="Tablo 1: İncelenen çalışmaların karşılaştırması"
        />
      </Section>
      <Section number="6" title="Projenin Literatürdeki Konumu">
        <Todo />
      </Section>
      <Section number="7" title="Sonuç">
        <Todo />
      </Section>
      <Section title="Kaynakça" newPage>
        <Todo>Kaynaklar (IEEE formatı).</Todo>
      </Section>
    </Document>
  ),
};
