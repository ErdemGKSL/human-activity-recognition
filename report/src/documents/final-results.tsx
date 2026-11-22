import { Document, FigurePlaceholder, Paragraph, Section, SubSection, Table, Todo } from "../pdf";
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
        <Paragraph>
          MLP, veri setinin hazır 561 feature'lı vektörleriyle eğitildi. 1D CNN, LSTM ve GRU için
          ham accelerometer ve gyroscope sinyali 128 ölçümlük window'lara (50 Hz'de 2,56 sn, %50
          overlap) bölündü ve her window'a, window'un en az %90'ını kapsayan etiket verildi. Bu
          kurala göre 10.776 window üretildi, resmi feature dosyalarında ise 10.929 örnek var.
          Eğitim ve test ayrımı resmi ayrımla aynıdır ve kişi bazlıdır (21 kişi eğitim, 9 kişi
          test). Validation kümesi eğitim kişilerinden her beşinci kişi alınarak ayrıldı.
          Normalizasyon istatistikleri yalnızca eğitim kümesinden hesaplandı.
        </Paragraph>
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
        <Paragraph>
          Her model aynı eğitim düzeniyle, 5 farklı seed için 40 epoch eğitildi: AdamW (öğrenme hızı
          2e-3, cosine schedule), batch boyutu 128, class-weighted loss. En iyi epoch, validation
          macro F1'e göre seçildi ve test kümesi yalnızca bu seçimden sonra bir kez kullanıldı.
          Eğitim Google Colab'da bir NVIDIA L4 GPU üzerinde yapıldı. Hiperparametre araması
          yapılmadı; sonuçlar tek bir sabit ayarı yansıtır.
        </Paragraph>
      </Section>
      <Section number="6" title="Eğitim ve Test Sonuçları">
        <Table
          columns={["Model", ...project.metrics.filter((m) => m !== "Confusion Matrix")]}
          rows={[
            ["MLP", "0,930 ± 0,004", "0,843 ± 0,005", "0,847 ± 0,011", "0,841 ± 0,006"],
            ["1D CNN", "0,914 ± 0,007", "0,809 ± 0,013", "0,845 ± 0,015", "0,819 ± 0,014"],
            ["LSTM", "0,804 ± 0,066", "0,654 ± 0,083", "0,707 ± 0,087", "0,666 ± 0,094"],
            ["GRU", "0,876 ± 0,012", "0,768 ± 0,024", "0,820 ± 0,016", "0,786 ± 0,016"],
          ]}
          caption="Tablo 1: Test kümesi sonuçları (5 seed ortalaması ± standart sapma; Precision, Recall ve F1 macro ortalamadır). Kaynak: experiments/results/summary.md"
        />
        <FigurePlaceholder caption="Şekil 2: Confusion matrix (şekiller experiments/results/confusion_*.png dosyalarında)" />
      </Section>
      <Section number="7" title="Modellerin Karşılaştırılması">
        <Paragraph>
          Tablo 1'e göre MLP, tüm metriklerde en yüksek ortalamaya ulaştı (macro F1 0,841). 1D CNN
          ikinci geldi (0,819), fark bir standart sapma kadardır. GRU 0,786, LSTM ise 0,666 aldı.
          LSTM'in standart sapması büyüktür: bir seed'de macro F1 0,484'e düştü. Bu yüzden LSTM
          sonucu, mimariden çok eğitimin kararsızlığını gösterebilir; bunu ayırmak için ek seed ve
          hiperparametre denemesi gerekir.
        </Paragraph>
        <Paragraph>
          Tüm modellerde en zayıf sınıflar postural transition sınıflarıdır (SIT_TO_LIE, LIE_TO_SIT,
          STAND_TO_LIE, LIE_TO_STAND; MLP için sınıf bazında F1 0,64 ile 0,73 arasında). Bu
          sınıfların eğitim kümesinde yalnızca 23 ile 90 örneği vardır. Ham sinyal modellerinin
          MLP'den geri kalması, MLP'nin hazır feature'lardan (frekans alanı ve gravity ayrımı dahil)
          yararlanmasıyla uyumludur; bunu doğrulayan bir ablation yapılmadı.
        </Paragraph>
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
