import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import {
  BulletList,
  Document,
  docTheme,
  Figure,
  Paragraph,
  Section,
  SubSection,
  Table,
} from "../pdf";
import { deliverable, project } from "../project";
import { ReportTitle } from "./ReportTitle";
import type { ReportDefinition } from "./types";

const ID = "final-results";

// Şekil dosyaları experiments/ altında üretilir; yoksa şekil yer tutucu kalır.
const EXPERIMENTS = join(import.meta.dir, "../../../experiments");
const FIGURES = {
  "class-dist": "results/class_distribution.png",
  delta: "results2/final/delta_vs_mlp.png",
  "cm-mlp": "results2/final/confusion_mlp.png",
  "cm-mlpraw": "results2/final/confusion_mlpraw.png",
  "cm-cnn": "results2/final/confusion_cnn.png",
  "cm-lstm": "results2/final/confusion_lstm.png",
  "cm-gru": "results2/final/confusion_gru.png",
} as const;
type FigureKey = keyof typeof FIGURES;
const images = Object.entries(FIGURES)
  .filter(([, rel]) => existsSync(join(EXPERIMENTS, rel)))
  .map(([src, rel]) => ({ src, data: new Uint8Array(readFileSync(join(EXPERIMENTS, rel))) }));
const has = (src: FigureKey) => images.some((i) => i.src === src);

/** Width / height read from the PNG header (IHDR), so a figure keeps its real aspect. */
function aspect(src: FigureKey, fallback: number): number {
  const img = images.find((i) => i.src === src);
  if (!img || img.data.length < 24) return fallback;
  const view = new DataView(img.data.buffer, img.data.byteOffset, img.data.byteLength);
  return view.getUint32(16) / view.getUint32(20);
}

/** Smaller text for wide tables, so numeric cells stay on one line. */
const sm = (text: ReactNode) => <span style={{ fontSize: 9.5 }}>{text}</span>;
const smRow = (row: ReactNode[]) => row.map(sm);

/** One step of the experiment log: what was done, what came out, what was decided. */
function Step({
  done,
  result,
  decision,
}: {
  done: ReactNode;
  result: ReactNode;
  decision: ReactNode;
}) {
  const rows: Array<[string, ReactNode]> = [
    ["Yapılan", done],
    ["Sonuç", result],
    ["Karar", decision],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {rows.map(([label, body]) => (
        <div key={label} style={{ display: "flex", flexDirection: "row", gap: 8 }}>
          <div
            style={{
              display: "flex",
              width: 58,
              flexShrink: 0,
              fontWeight: 600,
              color: docTheme.colors.primary,
            }}
          >
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <Paragraph>{body}</Paragraph>
          </div>
        </div>
      ))}
    </div>
  );
}

/** IEEE-style reference list: "[n]" label in its own column, text hanging beside it. */
function References({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item) => {
        const [, label = "", text = item] = /^(\[\d+\])\s*(.*)$/s.exec(item) ?? [];
        return (
          <div key={label} style={{ display: "flex", flexDirection: "row", gap: 8 }}>
            <div style={{ display: "flex", width: 24, flexShrink: 0 }}>{label}</div>
            <div style={{ display: "flex", flex: 1 }}>{text}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Two confusion matrices side by side. */
function FigurePair({ left, right }: { left: [FigureKey, string]; right?: [FigureKey, string] }) {
  const one = ([src, caption]: [FigureKey, string]) => (
    <Figure
      src={src}
      caption={caption}
      available={has(src)}
      width={318}
      aspect={aspect(src, 7 / 6)}
    />
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 12,
        justifyContent: "center",
        breakInside: "avoid",
      }}
    >
      {one(left)}
      {right && one(right)}
    </div>
  );
}

/** Final Results raporu (hocaya teslim edilen düz PDF). */
export const finalResults: ReportDefinition = {
  id: ID,
  pdf: {
    title: `${project.title}: ${deliverable(ID, "report").title}`,
    footerLabel: "Final Sonuçları",
    authors: [...project.authors],
    images,
  },
  render: () => (
    <Document>
      <ReportTitle id={ID} />

      <Section number="1" title="Giriş">
        <Paragraph>
          Çalışmamızda, bele takılan akıllı telefonun accelerometer ve gyroscope sinyallerinden 12
          sınıflı insan aktivitesi tanıma problemi ele alınıyor. Sınıfların altısı temel aktivite
          (yürüme, merdiven çıkma ve inme, oturma, ayakta durma, uzanma), altısı bu duruşlar
          arasındaki geçişlerdir. Veri, UCI #341 veri setinden alındı.
        </Paragraph>
        <Paragraph>
          Hedef, aynı kişi bazlı eğitim ayrımında dört farklı yapay sinir ağını karşılaştırmaktı:
          veri setinin hazır 561 feature'ını kullanan MLP ile ham sinyal window'larını kullanan 1D
          CNN, LSTM ve GRU. Feature'ların hazır geldiğinde etkisini mimarinin etkisinden ayırmak
          için tekrardan aynı MLP, düzleştirilmiş ham girdiyle kontrol modeli olarak da eğitildi.
        </Paragraph>
        <Paragraph>Raporun sundukları şunlardır:</Paragraph>
        <BulletList
          items={[
            "Kişi bazlı cross-validation ile seçilen ve test koşusundan önce dondurulan düzende, 1D CNN ve LSTM test macro F1'de MLP'den yüksek sonuç verdi (ensemble 0,921 ve 0,928, MLP 0,864; Tablo 7). Kişi bazında bootstrap farkının %95 güven aralığı sıfırı dışladı (Tablo 8).",
            "Aynı MLP'nin ham girdiyle eğitildiği kontrol deneyi, augmentasyonsuz düzende MLP'nin üstünlüğünün büyük ölçüde hazır feature'lardan geldiğine işaret etti (CV'de 0,803-0,808 ve 0,845). Augmentasyon ve yoğun window'la bu fark 0,005'e indi (Tablo 6).",
            "İlk baselinedan finale kadar her adım, sonucu ve verilen her karar kayıt altına alındı (Bölüm 5). İlk baseline'ın test sonuçlarına teşhis için bakıldığı da buradadır (Bölüm 5.5).",
          ]}
        />
      </Section>

      <Section number="2" title="Veri Ön İşleme">
        <SubSection number="2.1" title="Veri seti">
          <Paragraph>
            Veri seti, yaşları 19 ile 48 arasında olan 30 gönüllüden toplandı. Gönüllüler belde bir
            Samsung telefon taşıdı, 3 eksenli ivme ve 3 eksenli açısal hız 50 Hz'de kaydedildi ve
            etiketler video kaydından elle verildi [1], [2]. Veri seti, kişilerin %70'i eğitim ve
            %30'u test olacak biçimde resmi olarak ayrılmıştır (21 ve 9 kişi; Tablo 1). Bu sürüm,
            UCI HAR veri setinin [3] ham sinyalleri ve geçiş etiketleri eklenmiş geniş hâlidir.
          </Paragraph>
        </SubSection>
        <SubSection number="2.2" title="İki girdi temsili ve window kuralı">
          <Paragraph>
            Resmi dosyalarda her örnek, 2,56 sn'lik 128 ölçüm, ve %50 overlap'li bir window'dan
            hesaplanmış 561 feature'lık bir vektördür, MLP de bu vektörlerle eğitildi. Ancak resmi
            dosyalar hangi satırın hangi ham windowa denk geldiğini veremez. Bu yüzden 1D CNN, LSTM
            ve GRU için ham window'lar, ham sinyal ve etiket segmentlerinden aynı boy ve adımla (128
            ölçüm, adım 64) yeniden üretildi.
          </Paragraph>
          <Paragraph>
            Uygulanan kural şudur: bir window, 128 ölçümünün en az %90'ı aynı etiketli segmente
            düşüyorsa alınır ve etiketi taşır, aksi halde atılır. Bu kural 10.776 window üretti.
            Resmi dosyalardaki 10.929 örneğe göre fark %1,4, fark en çok transition sınıflarında
            görüldü (471 ve 518 window, Tablo 1). Sonuç olarak MLP ile ham sinyal modellerinin test
            kümeleri aynı kişilerden gelir ama birebir aynı değillerdir: 3.162/3.124 örnek.
          </Paragraph>
          <Table
            columns={["Küme", "Resmi 561 feature (MLP)", "Üretilen ham window (ham modeller)"]}
            widths={[1.6, 1, 1]}
            rows={[
              ["Toplam", "10.929", "10.776"],
              ["Eğitim (21 kişi)", "7.767", "7.652"],
              ["Test (9 kişi)", "3.162", "3.124"],
              ["Transition sınıfları, toplam", "518", "471"],
              ["Transition sınıfları, test", "166", "157"],
            ]}
            caption="Tablo 1: Örnek sayıları. Ham window'lar %90 tek etiket kuralı ve adım 64 ile üretildi (experiments/har/data.py)."
          />
        </SubSection>
        <SubSection number="2.3" title="Kişi bazlı ayrım">
          <Paragraph>
            Test kişileri hiçbir eğitim veya model seçimi adımında kullanılmadı. İlk baseline'da
            validation set, 21 eğitim kişisinden her beşinci kişi alınarak ayrıldı (5 kişi
            validation, 16 kişi eğitim). Sonraki tüm kararları 21 eğitim kişisi üzerinde 5-fold kişi
            bazlı CV ile verdik (Bölüm 5.5). Final modeller 21 eğitim kişisinin tamamıyla eğitildi.
          </Paragraph>
        </SubSection>
        <SubSection number="2.4" title="Gravity/body ayrımı">
          <Paragraph>
            Ham ivme sinyali gravity ve vücut hareketini birlikte taşır. Resmi feature hattında
            olduğu gibi [2], gravity bileşeni 0,3 Hz kesimli Butterworth low-pass filter ile ayrıldı
            (3. derece, sıfır fazlı, kayıt düzeyinde ve etiketten bağımsız). Bu seçenek açıkken
            girdi 9 kanal olur: body acc (3), gravity (3), gyro (3). Kapalıyken 6 kanal (ham ivme ve
            gyro) kullanılır.
          </Paragraph>
        </SubSection>
        <SubSection number="2.5" title="Augmentasyon ve yoğun window">
          <Paragraph>
            Augmentasyon sadece ham sinyal modellerinde ve sadece eğitim batch'lerinde uygulandı:
            her window rastgele bir eksen etrafında en fazla ±12° döndürüldü (her 3 kanallık gruba
            aynı dönme) ve genliği 0,9 ile 1,1 arasında rastgele bir katsayıyla ölçeklendi. Yoğun
            window seçeneğinde eğitim window'ları adım 16 ile üretildi (%87,5 overlap).
            Değerlendirme window'ları hep adım 64, bu yüzden CV ve test sayıları seçenekten bağımsız
            olarak aynı window'lar üzerinde hesaplandı.
          </Paragraph>
        </SubSection>
        <SubSection number="2.6" title="Normalizasyon ve class-weighted loss">
          <Paragraph>
            Ortalama ve standart sapma, her kanal (ham modeller) veya her feature (MLP) için sadece
            eğitim kişilerinden hesaplandı, CV'de de her fold'un eğitim kısmından yeniden
            hesaplandı. Resmi 561 feature veri setinde zaten [-1, 1] aralığına normalize edilmiş
            geliyor, ama bu normalizasyonun test kişilerini içerip içermediğini doğrulayamadık.
            Sınıf dengesizliği için class-weighted loss kullanıldı (cross-entropy, w_c = N / (12 ·
            n_c); N eğitim örneği sayısı, n_c c sınıfının örnek sayısı).
          </Paragraph>
        </SubSection>
      </Section>

      <Section number="3" title="Veri Analizi">
        <Paragraph>
          Şekil 1, resmi eğitim ve test kümelerinde sınıf başına örnek sayısını gösteriyor. Temel
          aktivitelerde eğitim kümesinde sınıf başına 987 ile 1.423 örnek var, transition
          sınıflarında bu sayı 23 ile 90 arasında. En büyük sınıf (STANDING, 1.423) en küçük sınıfın
          (SIT_TO_STAND, 23) yaklaşık 62 katı. Test kümesinde transition sınıfları 10 ile 49 örnekle
          temsil ediliyor.
        </Paragraph>
        <Paragraph>
          Bu dağılımın iki sonucu var. Birincisi, accuracy büyük sınıflara göre şekillenir ve
          transition sınıflarındaki hataları gizler, bu yüzden birincil metrik olarak macro F1
          seçildi. İkincisi, transition sınıflarının test F1 değerleri 10 ile 49 örneğe
          dayandığından sınıf bazlı farklar kesin yorumlanamaz (Bölüm 7).
        </Paragraph>
        <Figure
          src="class-dist"
          available={has("class-dist")}
          width={520}
          aspect={aspect("class-dist", 1050 / 690)}
          caption="Şekil 1: Resmi eğitim ve test kümelerinde sınıf başına örnek sayısı. Kesikli çizgi temel aktiviteleri transition sınıflarından ayırır. Kaynak: experiments/plot_class_dist.py"
        />
      </Section>

      <Section number="4" title="Model Mimarileri">
        <Paragraph>
          Her model için iki sürüm var: ilk baseline'da kullanılan sürüm ve CV ile seçilip finalde
          kullanılan dondurulmuş sürüm. Tablo 2 katmanları ve parametre sayılarını, Tablo 3 eğitim
          düzenlerini veriyor. Tüm modellerde dropout 0,3 ve çıkış 12 sınıflı bir linear katman.
        </Paragraph>
        <SubSection number="4.1" title="MLP">
          <Paragraph>
            561 feature, 256 ve 128 nöronlu iki gizli katmandan (ReLU, dropout) geçer. Baseline ve
            final sürümü aynı mimari (178.316 parametre), değişen sadece eğitim düzeni. Kontrol
            modeli MLP-raw aynı mimariyi 128 × 9 = 1.152 boyutlu düzleştirilmiş ham window ile
            kullanır (329.612 parametre).
          </Paragraph>
        </SubSection>
        <SubSection number="4.2" title="1D CNN">
          <Paragraph>
            Her convolutional blok Conv1d (kernel 5), batch normalization, ReLU ve 2'lik max
            pooling'den oluşur. Baseline sürümünde 32, 64 ve 128 kanallı üç blok ve global average
            pooling var (54.380 parametre). Final sürümü (derin CNN) 32, 64, 128 ve 128 kanallı dört
            blok kullanır, son üç blokta dilation 2. Zaman ekseninde ortalama ve maksimum
            birleştirilerek 256 boyutlu bir representation elde edilir (138.700 parametre, 9 kanal
            girdi).
          </Paragraph>
        </SubSection>
        <SubSection number="4.3" title="LSTM">
          <Paragraph>
            Baseline sürümü hidden size 64 olan iki katmanlı bir LSTM, son zaman adımının çıktısını
            sınıflandırır (52.492 parametre). Final sürümü bidirectional ve tüm zaman adımlarının
            ortalama ve maksimumunu birleştirir (mean/max pooling, 256 boyut). Forget gate bias'ı 1
            ile başlatılır, girdi 9 kanal (140.812 parametre).
          </Paragraph>
        </SubSection>
        <SubSection number="4.4" title="GRU">
          <Paragraph>
            Baseline sürümü LSTM ile aynı yapıda: iki katman, hidden size 64, son zaman adımı
            (39.564 parametre). Final sürümü bidirectional ve mean/max pooling kullanır. GRU'da
            gravity/body ayrımı CV'de fayda vermediği için (Tablo 6) girdi 6 kanal (105.228
            parametre).
          </Paragraph>
        </SubSection>
        <Table
          columns={[
            "Model",
            "Baseline sürümü",
            "Final (dondurulmuş) sürüm",
            "Parametre (baseline / final)",
          ]}
          widths={[0.8, 1.6, 2.2, 1.1]}
          rows={[
            smRow(["MLP", "561-256-128-12", "aynı", "178.316 / 178.316"]),
            smRow(["MLP-raw", "yok", "1.152-256-128-12, 9 kanal düzleştirilmiş", "- / 329.612"]),
            smRow([
              "1D CNN",
              "3 blok (32-64-128), GAP",
              "4 blok (32-64-128-128), dilation 2, mean+max pooling, 9 kanal",
              "54.380 / 138.700",
            ]),
            smRow([
              "LSTM",
              "2 katman, 64, son adım",
              "2 katman, 64, bidirectional, mean/max pooling, 9 kanal",
              "52.492 / 140.812",
            ]),
            smRow([
              "GRU",
              "2 katman, 64, son adım",
              "2 katman, 64, bidirectional, mean/max pooling, 6 kanal",
              "39.564 / 105.228",
            ]),
          ]}
          caption="Tablo 2: Mimariler ve parametre sayıları (experiments/har/models.py, models2.py; baseline sayıları results/summary.md)."
        />
        <Table
          columns={[
            "Ayar",
            "Baseline (tüm modeller)",
            "Final: MLP",
            "Final: ham modeller ve MLP-raw",
          ]}
          widths={[1.1, 1.5, 1.2, 1.7]}
          rows={[
            smRow(["Eğitim kişileri", "16 (5 kişi validation)", "21", "21"]),
            smRow(["Epoch", "40", "100", "40"]),
            smRow(["Öğrenme hızı", "2e-3", "1e-3", "2e-3"]),
            smRow(["Warmup / gradient clipping", "yok / yok", "3 epoch / 1", "2 epoch / 1"]),
            smRow(["Model seçimi", "en iyi validation macro F1 epoch'u", "son epoch", "son epoch"]),
            smRow(["Window adımı (eğitim)", "64", "-", "16"]),
            smRow(["Augmentasyon", "yok", "yok", "var (rotation, scaling)"]),
            smRow(["Gravity/body", "yok", "-", "CNN, LSTM, MLP-raw: var; GRU: yok"]),
            smRow(["Seed sayısı", "5", "10", "10"]),
          ]}
          caption="Tablo 3: Eğitim düzenleri. Ortak: AdamW (weight decay 1e-4), batch 128, cosine schedule, class-weighted loss, dropout 0,3 (experiments/train.py, train2.py)."
        />
      </Section>

      <Section number="5" title="Deneyler ve İzlenen Yol" newPage>
        <Paragraph>
          Bu bölümde çalışmayı kronolojik sırayla anlatıyoruz: her adımda ne yapıldı, ne sonuç çıktı
          ve hangi karar alındı. Sayılar Bölüm 6'daki tablolara işaret ediyor. Kayıtların kaynağı
          deney günlüğü (experiments/JOURNEY.md).
        </Paragraph>

        <SubSection number="5.1" title="Veri setinin seçimi ve doğrulanması">
          <Step
            done="UCI #341 veri seti indirildi ve resmi dosyalar sayıldı."
            result="10.929 örnek (7.767 eğitim, 3.162 test), 30 kişi, 12 sınıf (Tablo 1)."
            decision="Resmi kişi bazlı ayrım (21 eğitim, 9 test kişisi) korunuyor."
          />
        </SubSection>

        <SubSection number="5.2" title="Ham window kuralı">
          <Step
            done="Resmi dosyalarda satır ile ham window eşlemesi olmadığından ham sinyal modelleri için window'lar yeniden üretildi. Window'un en az %90'ının tek etiketli segmente düşmesi şartı denendi."
            result="10.776 window, resmi sayıya göre fark %1,4. Transition sınıflarında 471 window, resmide 518 (Tablo 1)."
            decision="%90 kuralı kullanılıyor. MLP ile ham modellerin test kümeleri farklı (3.162 ve 3.124) ve bu fark raporda açıkça yazılıyor."
          />
        </SubSection>

        <SubSection number="5.3" title="Çalışma ortamı">
          <Step
            done="Eğitimler Google Colab'da T4 ve L4 GPU'larla, PyTorch ile yapıldı."
            result="Aynı yapılandırma tekrarlandığında (A1a ve K5) fark 0,002 oldu (Tablo 6)."
            decision="Tüm koşular bu ortamda yapılıyor."
          />
        </SubSection>

        <SubSection number="5.4" title="İlk baseline">
          <Step
            done="Dört model ortak ve ayarsız bir düzenle eğitildi: 16 kişiyle eğitim, 5 kişilik validation set'e göre en iyi epoch, 40 epoch, 5 seed (Tablo 3). Sonra test kümesinde ölçüldü."
            result="Macro F1: MLP 0,841; 1D CNN 0,819; GRU 0,786; LSTM 0,666 (Tablo 4). LSTM kararsızdı, standart sapma 0,094. En zayıf sınıflar transition sınıflarıydı, SITTING ve STANDING'de ham modeller MLP'den zayıftı (Tablo 5). Ham sinyal modellerinin MLP'nin gerisinde kalmasını beklemiyorduk."
            decision="Ham modelleri iyileştirmek için dışarıdan bir değerlendirme istendi (Fable danışmanlığı)."
          />
        </SubSection>

        <SubSection number="5.5" title="Danışmanlık ve yöntem düzeltmesi">
          <Step
            done="Fable kodu okuyarak bazı teşhisler çıkardı. Bunlar ölçüm değil, tahmin: RNN'ler az eğitilmişti (40 epoch, yaklaşık 1.800 güncelleme; Tablo 3), gradient clipping ve warmup yoktu ve son zaman adımı kullanılıyordu; seçimden sonra 21 kişiyle yeniden eğitim yapılmıyordu; küçük validation set epoch seçimini gürültülü yapıyordu; gravity/body ayrımı ve augmentasyon yoktu; class weight agresifti."
            result="Yöntemde bir sorun da fark edildi: baseline teşhisi test kümesinin confusion matrix'ine ve sınıf bazlı F1 değerlerine bakılarak yapılmıştı. Bundan sonra da test kümesine bakarak karar vermek test sonucunu iyimser gösterebilirdi."
            decision="Bundan sonra her karar sadece 21 eğitim kişisi üzerinde 5-fold kişi bazlı CV ile veriliyor (ölçüt: havuzlanmış out-of-fold macro F1, 3 seed). Test, dondurulmuş düzenle en sonda bir kez koşuluyor. Aynı arama bütçesi MLP'ye de veriliyor. Baseline kodu değiştirilmedi, yeni deneyler ayrı bir betikle (train2.py) yapıldı."
          />
        </SubSection>

        <SubSection number="5.6" title="Baseline düzeninin CV ile yeniden ölçülmesi (A0)">
          <Step
            done="Baseline düzeni CV'de yeniden ölçüldü. Farklar şunlar: model seçimi son epoch'la yapıldı ve LSTM'de forget gate bias'ı 1 ile başlatıldı."
            result="MLP 0,824; 1D CNN 0,807; GRU 0,776; LSTM 0,768 (Tablo 6). Testte görülen LSTM çöküşü (0,666) CV'de görülmedi."
            decision="Testteki LSTM sonucunun bir kısmı epoch seçimindeki şansa bağlı görünüyordu. Bundan sonra CV değerleri esas alınıyor."
          />
        </SubSection>

        <SubSection number="5.7" title="Optimizasyon (A1)">
          <Step
            done="Epoch sayısı 100'e çıkarıldı, warmup (3 epoch) ve gradient clipping (1) eklendi. Öğrenme hızı olarak 1e-3 (A1a) ve 2e-3 (A1b) denendi, MLP'de ayrıca 5e-4, 200 epoch ve sqrt class weight de denendi."
            result="MLP 0,824'ten 0,845'e çıktı, diğer MLP denemeleri 0,838 ile 0,845 arasında kaldı. Ham modellerde lr 2e-3, 1e-3'ten iyiydi: CNN 0,822, LSTM 0,797, GRU 0,779 (Tablo 6). Yani baseline düzeni sadece ham modeller için değil, MLP için de eksik ayarlıydı."
            decision="Ham modeller için lr 2e-3, warmup ve clipping ortak taban oluyor. MLP için A1a (100 epoch, lr 1e-3) seçildi."
          />
        </SubSection>

        <SubSection number="5.8" title="RNN yapısı: pooling ve bidirectional">
          <Step
            done="A1a düzeni üzerinde son zaman adımı yerine mean/max pooling, buna ek olarak da bidirectional katmanlar denendi."
            result="Tek başına mean/max pooling fayda vermedi (LSTM 0,763, GRU 0,767). Bidirectional ile birlikte LSTM 0,787, GRU 0,789 oldu, A1a'ya göre artış 0,016 ve 0,022 (Tablo 6)."
            decision="RNN'lerde bidirectional ve mean/max pooling kullanılıyor."
          />
        </SubSection>

        <SubSection number="5.9" title="Gravity/body ayrımı (9 kanal)">
          <Step
            done="A1a düzeni üzerinde ivmeyi gravity ve body bileşenlerine ayırıp 9 kanallı girdi denendi."
            result="Değişim: CNN +0,018 (0,809'dan 0,827'ye), LSTM +0,010, GRU -0,003 (Tablo 6)."
            decision="CNN ve LSTM'de 9 kanal kullanılıyor, GRU'da fayda görülmediği için ayrı değerlendiriliyor."
          />
        </SubSection>

        <SubSection number="5.10" title="Derin CNN">
          <Step
            done="Dört bloklu, dilation'lı ve mean/max pooling'li CNN denendi (Tablo 2)."
            result="0,809'dan 0,830'a çıktı (+0,021; Tablo 6)."
            decision="Derin CNN kullanılıyor. Gravity ile birleşik taban (C1): 0,833."
          />
        </SubSection>

        <SubSection number="5.11" title="Feature mı, mimari mi? (MLP-raw)">
          <Step
            done="MLP'nin avantajı hazır feature'lardan mı yoksa mimariden mi geliyor, bunu ayırmak için aynı MLP düzleştirilmiş ham window'larla eğitildi."
            result="MLP-raw 0,803 (6 kanal) ve 0,808 (9 kanal), aynı MLP 561 feature ile 0,845 (Tablo 6)."
            decision="Bu düzende MLP'nin üstünlüğü büyük ölçüde mimariden değil, hazır feature'lardan geliyor. Bulgu kontrol deneyiyle finale kadar taşınıyor (Bölüm 5.13)."
          />
        </SubSection>

        <SubSection number="5.12" title="Augmentasyon ve yoğun window: 2 × 2 tasarım">
          <Step
            done="Birleşik taban C1 (CNN: derin + gravity; GRU: bidirectional + mean/max) üzerinde iki etken ayrı ayrı ve birlikte denendi: augmentasyon (K1, adım 64), yoğun window (D1, adım 16, 40 epoch) ve ikisi birlikte (D2). D1 ve D2'de epoch sayısı 40. Adım 16'da bir epoch, adım 64'e göre yaklaşık dört kat window içeriyor."
            result="CNN: C1 0,833; sadece augmentasyon 0,849 (+0,016); sadece yoğun window 0,823; ikisi birlikte 0,855. LSTM ve GRU'da D1 0,817 ve 0,811, D2 0,857 ve 0,845 (Tablo 6)."
            decision="CNN'de asıl kazanç augmentasyondan geldi. Yoğun window tek başına karışık etki verdi, augmentasyonla birlikte CNN'de getirdiği 0,006'lık ek fark gürültü bandında. LSTM ve GRU'da adım 64 ile augmentasyon kolu koşulmadığından bu iki etken orada ayrılamıyor. Final düzen D2 oldu."
          />
        </SubSection>

        <SubSection number="5.13" title="Class weight ve MLP'ye eşit arama bütçesi">
          <Step
            done="CNN'de D2 üzerinde daha yumuşak sınıf ağırlığı (sqrt) denendi (E1s). MLP'ye eşit bütçe vermek için feature uzayında Gauss gürültüsü (0,1 ve 0,3 std) ve A1a'nın tekrarı (K5) koşuldu. MLP-raw da D2 düzeniyle eğitildi (K2)."
            result="E1s 0,858 ± 0,003, D2 0,855 ± 0,010. Gürültü MLP'ye yardım etmedi (0,838 ve 0,843), K5 0,843. MLP-raw D2 düzeniyle 0,840'a çıktı ve 561 feature'lı MLP'ye (0,845) 0,005 yaklaştı (Tablo 6)."
            decision="CNN'de tutarlılık için tam class weight korunuyor (fark gürültü bandında). MLP için A1a donduruldu. Feature bulgusu sadece augmentasyonsuz karşılaştırma için geçerli sayılıyor."
          />
        </SubSection>

        <SubSection number="5.14" title="Ara değerlendirme ve dondurma">
          <Step
            done="Fable tüm CV tablosunu ve kodu okuyarak ikinci bir değerlendirme yaptı. Buna göre girdi temsilinin etkisi, baseline'ın eksik ayarlı olması ve augmentasyonun CNN'e katkısı gürültünün çok üstündeydi, CNN (0,855) ile MLP (0,845) arasındaki CV farkı ise gürültü bandındaydı."
            result="Seed standart sapması kişi belirsizliğini içermiyordu: CV 21, test 9 kişiye dayanıyordu."
            decision="Keşif kapatıldı. Final yapılandırmaları (Tablo 3) ve analiz planı test koşusundan önce yazılıp commit edildi. Plan: birincil metrik test macro F1; 10 seed ortalaması ± std; 10 seed olasılık ortalaması (ensemble); 9 test kişisi üzerinde yerine koymalı kişi bazlı bootstrap (B = 2.000, percentile %95 güven aralığı, GA); MLP'ye göre kişi bazında eşleştirilmiş fark. İddia eşiği: bir ham model için 'MLP'yi geçti' ancak bu farkın GA'sı sıfırı dışlarsa ve CV'de fark aynı yöndeyse yazılır, yoksa 'karşılaştırılabilir düzeyde' denir."
          />
        </SubSection>

        <SubSection number="5.15" title="Final test koşusu">
          <Step
            done="Dondurulmuş beş yapılandırma 21 eğitim kişisiyle 10 seed (0-9) için eğitildi ve test kümesinde bir kez ölçüldü. Seed'ler ikişer ikişer koşuldu."
            result="Ensemble macro F1: LSTM 0,928; 1D CNN 0,921; GRU 0,921; MLP 0,864; MLP-raw 0,862 (Tablo 7). MLP'ye göre farklar Tablo 8'de, sınıf bazlı sonuçlar Tablo 9'da."
            decision="Bu sonuçlar ve dondurulmuş düzen artık değişmiyor. Bundan sonra yapılacak her deney ayrıca 'keşif amaçlı' diye raporlanacak."
          />
        </SubSection>
      </Section>

      <Section number="6" title="Eğitim ve Test Sonuçları" newPage>
        <SubSection number="6.1" title="İlk sonuçlar: baseline düzeni, test kümesi">
          <Paragraph>
            Tablo 4 ve Tablo 5 ilk baseline düzeninin test sonuçları. Bu düzen sonraki tablolarla
            aynı protokolü izlemiyor (16 kişi, validation'a göre en iyi epoch, ayarsız eğitim), bu
            yüzden final sonuçlarla aynı tabloya konmadı.
          </Paragraph>
          <Table
            columns={["Model", "Parametre", "Accuracy", "Precision", "Recall", "Macro F1"]}
            widths={[0.9, 0.9, 1, 1, 1, 1]}
            rows={[
              smRow([
                "MLP",
                "178.316",
                "0,930 ± 0,004",
                "0,843 ± 0,005",
                "0,847 ± 0,011",
                "0,841 ± 0,006",
              ]),
              smRow([
                "1D CNN",
                "54.380",
                "0,914 ± 0,007",
                "0,809 ± 0,013",
                "0,845 ± 0,015",
                "0,819 ± 0,014",
              ]),
              smRow([
                "LSTM",
                "52.492",
                "0,804 ± 0,066",
                "0,654 ± 0,083",
                "0,707 ± 0,087",
                "0,666 ± 0,094",
              ]),
              smRow([
                "GRU",
                "39.564",
                "0,876 ± 0,012",
                "0,768 ± 0,024",
                "0,820 ± 0,016",
                "0,786 ± 0,016",
              ]),
            ]}
            caption="Tablo 4: İlk sonuçlar (baseline düzeni, test kümesi; 5 seed ortalaması ± std; precision, recall ve F1 macro ortalamadır). Kaynak: experiments/results/summary.md"
          />
        </SubSection>
        <Table
          columns={["Sınıf", "MLP", "1D CNN", "LSTM", "GRU"]}
          widths={[1.8, 1, 1, 1, 1]}
          rows={[
            ["WALKING", "0,963", "0,977", "0,766", "0,918"],
            ["WALKING_UPSTAIRS", "0,939", "0,955", "0,819", "0,930"],
            ["WALKING_DOWNSTAIRS", "0,931", "0,983", "0,837", "0,930"],
            ["SITTING", "0,911", "0,825", "0,766", "0,781"],
            ["STANDING", "0,918", "0,858", "0,786", "0,796"],
            ["LAYING", "0,989", "0,989", "0,952", "0,989"],
            ["STAND_TO_SIT", "0,767", "0,787", "0,620", "0,703"],
            ["SIT_TO_STAND", "0,922", "0,882", "0,567", "0,787"],
            ["SIT_TO_LIE", "0,641", "0,659", "0,485", "0,705"],
            ["LIE_TO_SIT", "0,733", "0,627", "0,509", "0,720"],
            ["STAND_TO_LIE", "0,673", "0,541", "0,454", "0,571"],
            ["LIE_TO_STAND", "0,707", "0,742", "0,425", "0,602"],
          ].map(smRow)}
          caption="Tablo 5: İlk sonuçlar, sınıf bazlı test F1 (baseline düzeni, 5 seed ortalaması). Kaynak: experiments/results/summary.md"
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: docTheme.gap,
            breakBefore: "page",
          }}
        >
          <SubSection number="6.2" title="CV ablation">
            <Paragraph>
              Tablo 6, Bölüm 5'teki kararların dayandığı CV sonuçları. Her hücre, 21 eğitim kişisi
              üzerinde 5-fold kişi bazlı CV ile hesaplanan havuzlanmış out-of-fold macro F1'in 3
              seed ortalaması ± std'si. MLP 7.767 feature satırında, ham modeller 7.652 window'da
              değerlendirildi. Seed std'si 0,002 ile 0,020 arasında, 0,01'in altındaki farkları
              gürültü kabul ettik.
            </Paragraph>
          </SubSection>
          <Table
            columns={["Basamak (koşu)", "MLP", "MLP-raw", "1D CNN", "LSTM", "GRU"]}
            widths={[2.5, 1, 1, 1, 1, 1]}
            rows={[
              [
                "A0: baseline düzeni (40 ep, lr 2e-3)",
                "0,824 ± 0,004",
                "-",
                "0,807 ± 0,006",
                "0,768 ± 0,006",
                "0,776 ± 0,017",
              ],
              [
                "A1a: 100 ep, lr 1e-3, warmup, clip",
                "0,845 ± 0,004",
                "0,803 ± 0,004",
                "0,809 ± 0,003",
                "0,771 ± 0,009",
                "0,767 ± 0,020",
              ],
              [
                "A1b: A1a, lr 2e-3",
                "0,844 ± 0,003",
                "-",
                "0,822 ± 0,007",
                "0,797 ± 0,004",
                "0,779 ± 0,015",
              ],
              ["A1c: A1a, lr 5e-4", "0,838 ± 0,002", "-", "-", "-", "-"],
              ["A1d: A1a, 200 ep", "0,844 ± 0,005", "-", "-", "-", "-"],
              ["A1e: A1a, sqrt class weight", "0,845 ± 0,004", "-", "-", "-", "-"],
              ["A1a + mean/max pooling", "-", "-", "-", "0,763 ± 0,004", "0,767 ± 0,011"],
              ["A1a + bidirectional + mean/max", "-", "-", "-", "0,787 ± 0,015", "0,789 ± 0,020"],
              [
                "A1a + gravity (9 kanal)",
                "-",
                "0,808 ± 0,003",
                "0,827 ± 0,013",
                "0,781 ± 0,019",
                "0,764 ± 0,009",
              ],
              ["A1a + derin CNN", "-", "-", "0,830 ± 0,017", "-", "-"],
              [
                "C1: lr 2e-3, 100 ep, model başına en iyi yapı",
                "-",
                "-",
                "0,833 ± 0,015",
                "-",
                "0,786 ± 0,005",
              ],
              ["K1: C1 + augmentasyon (adım 64)", "-", "-", "0,849 ± 0,002", "-", "-"],
              [
                "D1: C1 yapısı, yoğun window (adım 16, 40 ep)",
                "-",
                "-",
                "0,823 ± 0,009",
                "0,817 ± 0,007",
                "0,811 ± 0,014",
              ],
              [
                "D2: D1 + augmentasyon",
                "-",
                "0,840 ± 0,004",
                "0,855 ± 0,010",
                "0,857 ± 0,005",
                "0,845 ± 0,007",
              ],
              ["E1s: D2, sqrt class weight", "-", "-", "0,858 ± 0,003", "-", "-"],
              ["K3 / K4: A1a + feature gürültüsü 0,1 / 0,3", "0,838 / 0,843", "-", "-", "-", "-"],
              ["K5: A1a tekrarı", "0,843 ± 0,002", "-", "-", "-", "-"],
            ].map(smRow)}
            caption="Tablo 6: CV ablation (OOF macro F1, 3 seed). Final için dondurulan satırlar: MLP A1a, diğerleri D2. LSTM'de D1 ve D2 gravity içerir, GRU'da içermez. MLP-raw A1a satırı 6 kanal, diğer satırları 9 kanaldır. Kaynak: experiments/results2/ablation.md"
          />
        </div>

        <SubSection number="6.3" title="Final test sonuçları (dondurulmuş düzen)">
          <Paragraph>
            Tablo 7 final koşunun sonuçları. Tekil model değeri 10 seed'in ortalaması ± std,
            ensemble değeri ise 10 seed'in olasılık ortalamasından hesaplanıyor. Güven aralığı
            sadece ensemble için hesaplandı ve kişi örneklemesinden gelen belirsizliği içeriyor,
            seed std'si bu belirsizliği içermiyor. CV sütunu karşılaştırmayı kolaylaştırmak için var
            ama iki protokol farklı: CV'de modeller fold başına 16 ya da 17 kişiyle, finalde 21
            kişiyle eğitiliyor.
          </Paragraph>
        </SubSection>
        <Table
          columns={[
            "Model (test n)",
            "Macro F1, 10 seed",
            "Ensemble macro F1",
            "Ensemble %95 GA",
            "Accuracy, 10 seed",
            "Ensemble accuracy",
            "CV macro F1",
          ]}
          widths={[1.25, 1.15, 0.9, 1.25, 0.95, 0.95, 1.1]}
          rows={[
            [
              "MLP (3.162)",
              "0,860 ± 0,004",
              "0,864",
              "[0,823; 0,899]",
              "0,940",
              "0,941",
              "0,845 ± 0,004",
            ],
            [
              "MLP-raw (3.124)",
              "0,862 ± 0,006",
              "0,862",
              "[0,793; 0,907]",
              "0,914",
              "0,914",
              "0,840 ± 0,004",
            ],
            [
              "1D CNN (3.124)",
              "0,894 ± 0,011",
              "0,921",
              "[0,888; 0,947]",
              "0,966",
              "0,972",
              "0,855 ± 0,010",
            ],
            [
              "LSTM (3.124)",
              "0,898 ± 0,010",
              "0,928",
              "[0,888; 0,955]",
              "0,964",
              "0,975",
              "0,857 ± 0,005",
            ],
            [
              "GRU (3.124)",
              "0,888 ± 0,008",
              "0,921",
              "[0,874; 0,951]",
              "0,958",
              "0,976",
              "0,845 ± 0,007",
            ],
          ].map(smRow)}
          caption="Tablo 7: Final test sonuçları. GA: 9 test kişisi üzerinde kişi bazlı bootstrap (B = 2.000, percentile). CV: Tablo 6'daki dondurulmuş satır. Kaynak: experiments/results2/final/summary.md"
        />
        <Table
          columns={[
            "Model",
            "Test farkı (ensemble macro F1)",
            "%95 GA",
            "GA sıfırı dışlıyor mu",
            "CV farkı (model - MLP)",
          ]}
          widths={[1, 1.1, 1.3, 1.1, 1.2]}
          rows={[
            ["MLP-raw", "-0,005", "[-0,055; +0,043]", "hayır", "-0,005"],
            ["1D CNN", "+0,056", "[+0,026; +0,093]", "evet", "+0,010"],
            ["LSTM", "+0,063", "[+0,029; +0,097]", "evet", "+0,012"],
            ["GRU", "+0,055", "[+0,024; +0,086]", "evet", "0,000"],
          ].map(smRow)}
          caption="Tablo 8: MLP'ye göre eşleştirilmiş test farkı (aynı kişi çekilişlerinde model - MLP, B = 2.000) ve CV farkı (Tablo 6'daki CV değerlerinden). Kaynak: experiments/results2/final/summary.md"
        />
        <Figure
          src="delta"
          available={has("delta")}
          width={380}
          aspect={aspect("delta", 900 / 690)}
          caption="Şekil 2: MLP'ye göre eşleştirilmiş macro F1 farkı ve %95 GA (ensemble, kişi bazlı bootstrap). Kaynak: experiments/results2/final/delta_vs_mlp.png"
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: docTheme.gap,
            breakInside: "avoid",
          }}
        >
          <SubSection number="6.4" title="Sınıf bazlı sonuçlar ve confusion matrix'ler">
            <Paragraph>
              Tablo 9 ensemble modellerin sınıf bazlı test F1 değerlerini veriyor. Şekil 3-7 aynı
              modellerin satır normalize confusion matrix'leri.
            </Paragraph>
          </SubSection>
          <Table
            columns={["Sınıf", "MLP", "MLP-raw", "1D CNN", "LSTM", "GRU"]}
            widths={[1.8, 1, 1, 1, 1, 1]}
            rows={[
              ["WALKING", "0,962", "0,967", "0,977", "0,981", "0,988"],
              ["WALKING_UPSTAIRS", "0,945", "0,984", "1,000", "0,982", "0,984"],
              ["WALKING_DOWNSTAIRS", "0,958", "0,963", "0,974", "0,999", "0,990"],
              ["SITTING", "0,920", "0,799", "0,957", "0,961", "0,968"],
              ["STANDING", "0,931", "0,835", "0,968", "0,971", "0,974"],
              ["LAYING", "0,993", "0,995", "0,997", "1,000", "0,998"],
              ["STAND_TO_SIT", "0,800", "0,826", "0,909", "0,875", "0,870"],
              ["SIT_TO_STAND", "0,909", "0,947", "1,000", "1,000", "1,000"],
              ["SIT_TO_LIE", "0,688", "0,725", "0,794", "0,750", "0,767"],
              ["LIE_TO_SIT", "0,808", "0,800", "0,826", "0,950", "0,878"],
              ["STAND_TO_LIE", "0,720", "0,698", "0,787", "0,742", "0,787"],
              ["LIE_TO_STAND", "0,735", "0,808", "0,863", "0,926", "0,846"],
              ["Temel aktivite ortalaması", "0,952", "0,924", "0,979", "0,982", "0,984"],
              ["Transition ortalaması", "0,776", "0,801", "0,863", "0,874", "0,858"],
            ].map(smRow)}
            caption="Tablo 9: Final düzen, sınıf bazlı test F1 (ensemble). Kaynak: experiments/results2/final/summary.md"
          />
        </div>
        <FigurePair left={["cm-mlp", "Şekil 3: MLP"]} right={["cm-mlpraw", "Şekil 4: MLP-raw"]} />
        <FigurePair left={["cm-cnn", "Şekil 5: 1D CNN"]} right={["cm-lstm", "Şekil 6: LSTM"]} />
        <FigurePair
          left={[
            "cm-gru",
            "Şekil 7: GRU. Şekil 3-7: final düzen, test kümesi, ensemble, satır normalize. Kaynak: experiments/results2/final/confusion_*.png",
          ]}
        />
      </Section>

      <Section number="7" title="Modellerin Karşılaştırılması" newPage>
        <SubSection number="7.1" title="Ham sinyal modelleri ve MLP">
          <Paragraph>
            Önceden ilan ettiğimiz iddia eşiği iki koşul istiyor: test kümesinde kişi bazında farkın
            %95 GA'sı sıfırı dışlamalı ve CV'de fark aynı yönde olmalı (Bölüm 5.14). 1D CNN ve LSTM
            iki koşulu da sağladı: test farkı +0,056 [+0,026; +0,093] ve +0,063 [+0,029; +0,097], CV
            farkı +0,010 ve +0,012 (Tablo 8). Bu yüzden şunu yazabiliriz: bu veri setinde ve bu
            eğitim düzeninde 1D CNN ve LSTM, test macro F1'de MLP'den yüksek sonuç verdi. CV
            farkları ise 0,01 civarında ve tek başına gürültü bandında. Test farkı (yaklaşık 0,06)
            CV farkından büyük ve 9 kişilik test kümesi yüzünden GA geniş.
          </Paragraph>
          <Paragraph>
            GRU testte MLP'den yüksek (+0,055 [+0,024; +0,086]) ama CV'de iki model ayırt edilemiyor
            (0,845 ve 0,845; Tablo 8). Eşik karşılanmadığı için GRU için yazılabilecek ifade şu:
            testte MLP'den yüksek, CV'de ayırt edilemez. GRU'nun MLP'den üstün olduğunu iddia
            etmiyoruz.
          </Paragraph>
          <Paragraph>
            Ensemble ham modellerde tekil seed ortalamasının üstüne çıktı (CNN 0,894'ten 0,921'e,
            LSTM 0,898'den 0,928'e, GRU 0,888'den 0,921'e), MLP'de ise artış küçük kaldı (0,860'tan
            0,864'e; Tablo 7). Tekil seed ortalamalarında da üç ham model MLP'nin üstünde
            (0,888-0,898 ve 0,860), ama seed std'si kişi belirsizliğini içermediği için tekil
            değerler arasındaki fark için GA hesaplanmadı.
          </Paragraph>
        </SubSection>
        <SubSection number="7.2" title="Feature mı, mimari mi?">
          <Paragraph>
            MLP-raw kontrolünün sonucu eğitim düzenine bağlı. Augmentasyon olmadan aynı MLP ham
            girdiyle 0,803 (6 kanal) ve 0,808 (9 kanal), 561 feature ile 0,845 aldı (Tablo 6), yani
            bu düzende MLP'nin üstünlüğü büyük ölçüde hazır feature'lardan geliyordu. Gravity, yoğun
            window ve augmentasyonla MLP-raw 0,840'a çıktı ve fark 0,005'e indi. Testte de MLP-raw
            ile MLP ayırt edilemiyor: fark -0,005 [-0,055; +0,043] (Tablo 8). Bu yüzden "MLP'nin
            üstünlüğü hazır feature'lardan geliyor" ifadesi sadece augmentasyonsuz karşılaştırma
            için geçerli.
          </Paragraph>
          <Paragraph>
            Macro F1'deki bu eşitlik iki modelin aynı hataları yaptığı anlamına gelmiyor. MLP-raw'ın
            accuracy'si daha düşük (0,914 ve 0,940; Tablo 7) ve SITTING ile STANDING'de zayıf (F1
            0,799 ve 0,835; MLP'de 0,920 ve 0,931; Tablo 9). Eşitlik, MLP-raw'ın transition
            sınıflarındaki daha yüksek ortalamasından geliyor (0,801 ve 0,776). Aynı ham girdiyi
            kullanan 1D CNN, LSTM ve GRU'nun testte MLP-raw'dan yüksek olması (Tablo 7) ham girdide
            mimarinin de etkisi olduğuyla uyumlu, ancak bu fark için eşleştirilmiş test yapılmadı.
          </Paragraph>
        </SubSection>
        <SubSection number="7.3" title="Sınıflar: temel aktiviteler ve transition'lar">
          <Paragraph>
            Ham sinyal modelleri hem temel aktivitelerde (ortalama F1 0,979-0,984, MLP 0,952) hem
            transition sınıflarında (0,858-0,874, MLP 0,776) MLP'den yüksek (Tablo 9). En zayıf
            sınıflar yine SIT_TO_LIE (0,688-0,794) ve STAND_TO_LIE (0,698-0,787). Confusion
            matrix'lerde bu iki sınıfın birbirine karıştığı görülüyor: MLP'de SIT_TO_LIE
            örneklerinin 0,28'i STAND_TO_LIE, LSTM'de STAND_TO_LIE örneklerinin 0,22'si SIT_TO_LIE
            olarak tahmin edildi (Şekil 3 ve 6). İki hareket de uzanarak bitiyor, bu benzerlik
            karışmayla uyumlu. MLP'de SITTING örneklerinin 0,11'i STANDING'e kaydı, LSTM'de bu oran
            0,06.
          </Paragraph>
          <Paragraph>
            Transition sınıfları test kümesinde az örneğe dayanıyor (ham modellerde toplam 157
            window; Tablo 1), bu yüzden sınıf bazlı farkları kesin yorumlamamak gerekir. Örneğin
            LIE_TO_SIT'te LSTM 0,950, CNN 0,826 aldı (Tablo 9), bu sınıfın resmi test kümesinde 25
            örneği var (Şekil 1).
          </Paragraph>
        </SubSection>
        <SubSection number="7.4" title="İlk sonuçlarla ilişki">
          <Paragraph>
            İlk baseline'da sıralama MLP, 1D CNN, GRU, LSTM idi (Tablo 4), final düzende ise ham
            sinyal modelleri MLP'nin üstünde (Tablo 7). İki tablo doğrudan karşılaştırılamaz çünkü
            protokoller farklı: baseline 16 kişiyle ve validation'a göre seçilen epoch'la, final 21
            kişiyle ve sabit epoch'la eğitildi, ayarlar da farklı. Aynı CV protokolünde LSTM
            0,768'den (A0) 0,857'ye (D2) çıktı (Tablo 6), sıralamadaki değişim eğitim düzenindeki
            değişikliklerle uyumlu.
          </Paragraph>
        </SubSection>
      </Section>

      <Section number="8" title="Gerçek Telefon Sensör Verileriyle Ek Testler">
        <Paragraph>
          Bu test yapılmadı, bu bölüm planlanan çalışmayı ve bir sınırlılığı anlatıyor. Raporda
          gerçek telefon verisiyle alınmış bir sonuç yok. Canlı demo da yapılmadı.
        </Paragraph>
        <Paragraph>
          Plan şu: hazır bir sensör kayıt uygulamasıyla, telefon beldeyken accelerometer ve
          gyroscope 50 Hz'de kaydedilecek ve CSV olarak dışa aktarılacak. Etiketler önceden
          belirlenmiş bir aktivite sırası ve zamanlamasıyla verilecek. Kayıt eğitim verisine
          uydurulacak: ivme m/s² ile geliyorsa 9,80665'e bölünerek g'ye çevrilecek, gyro rad/s'de
          kalacak ve telefonun eksenleri veri setindeki eksen yönleriyle eşleştirilecek. Sonra aynı
          window kuralı, gravity/body ayrımı ve eğitim kümesi istatistikleriyle standardizasyon
          uygulanacak.
        </Paragraph>
        <Paragraph>
          Değerlendirme çevrimdışı ve sadece ham sinyal modelleriyle (1D CNN, LSTM, GRU) yapılacak.
          MLP, resmi 561 feature hattının yeniden kurulmasını gerektirdiği için plana dahil değil.
          Telefon, takılma biçimi ve kişi farklı olacağı için performansın test kümesindekinden
          düşük olması beklenebilir, ne kadar düşeceği ölçülmeden bilinemez.
        </Paragraph>
      </Section>

      <Section number="9" title="Sonuçlar ve Değerlendirme">
        <SubSection number="9.1" title="Yazılabilir iddialar">
          <BulletList
            items={[
              "UCI #341 veri setinde, kişi bazlı CV ile seçilip dondurulan düzende 1D CNN ve LSTM test macro F1'de 561 feature'lı MLP'den yüksek sonuç verdi (ensemble 0,921 ve 0,928, MLP 0,864; kişi bazında farkın GA'sı sıfırı dışlıyor, CV aynı yönde; Tablo 7 ve 8).",
              "GRU testte MLP'den yüksek, CV'de ayırt edilemez (Tablo 8).",
              "Augmentasyonsuz düzende MLP'nin avantajı büyük ölçüde hazır feature'lardan geliyordu. Augmentasyon ve yoğun window ile ham girdili aynı MLP bu farkı CV'de 0,005'e, testte ayırt edilemez düzeye indirdi (Tablo 6 ve 8).",
              "1D CNN'de en büyük CV kazancı augmentasyondan geldi (+0,016; Tablo 6). İlk baseline tüm modeller için eksik ayarlıydı (MLP 0,824'ten 0,845'e çıktı; Tablo 6).",
            ]}
          />
        </SubSection>
        <SubSection number="9.2" title="Yazılamaz iddialar">
          <BulletList
            items={[
              "Ham sinyal modellerinin genel olarak feature tabanlı modellerden üstün olduğu: sonuç tek veri setine, tek bir MLP'ye ve sınırlı bir aramaya dayanıyor.",
              "GRU'nun MLP'den üstün olduğu (eşik karşılanmadı) ve LSTM, CNN ve GRU arasında bir sıralama (GA'lar örtüşüyor; Tablo 7).",
              "Gerçek telefon verisinde veya canlı kullanımda herhangi bir performans (test yapılmadı; Bölüm 8).",
            ]}
          />
        </SubSection>
        <SubSection number="9.3" title="Sınırlılıklar">
          <BulletList
            items={[
              "Test kümesi 9 kişi. Kişi bazlı bootstrap GA'ları geniş ve az sayıda kişiden yeniden örneklendiği için biraz iyimser olabilir (Tablo 7).",
              "MLP ile ham modellerin test kümeleri birebir aynı değil (3.162 ve 3.124 örnek; Tablo 1). Bootstrap aynı kişileri çekiyor ama aynı window'ları değil.",
              "Test değerleri CV'den yüksek (MLP +0,015; ham modellerde yaklaşık +0,04; Tablo 7). Olası sebepler (finalde 21 kişiyle eğitim, ham modellerin ek kişiden daha çok yararlanması, test kişilerinin daha kolay olması) bu deneylerle ayrılamadı.",
              "Hiperparametre araması sınırlıydı: her seçenek 3 seed'le ve tek tek denendi, tam ızgara aranmadı (Tablo 6).",
              "İlk baseline'ın sorunları test sonuçlarına bakılarak teşhis edildi (Bölüm 5.5). Sonraki kararlar sadece CV ile verildi, ama araştırmanın yönü bu ilk bakıştan etkilenmiş olabilir.",
              "Resmi 561 feature'ın [-1, 1] normalizasyonunun test kişilerini içerip içermediği doğrulanamadı (Bölüm 2.6).",
            ]}
          />
        </SubSection>
      </Section>

      <Section title="Kaynakça" newPage>
        <References
          items={[
            '[1] J.-L. Reyes-Ortiz, L. Oneto, A. Samà, X. Parra, and D. Anguita, "Transition-aware human activity recognition using smartphones," Neurocomputing, 2015.',
            '[2] J. L. Reyes-Ortiz, D. Anguita, L. Oneto, and X. Parra, "Smartphone-based recognition of human activities and postural transitions data set," version 2.1, UCI Machine Learning Repository, Jul. 2015. [Online]. Available: https://archive.ics.uci.edu/dataset/341/smartphone+based+recognition+of+human+activities+and+postural+transitions',
            '[3] D. Anguita, A. Ghio, L. Oneto, X. Parra, and J. L. Reyes-Ortiz, "A public domain dataset for human activity recognition using smartphones," in Proc. 21st European Symposium on Artificial Neural Networks, Computational Intelligence and Machine Learning (ESANN), Bruges, Belgium, Apr. 2013.',
          ]}
        />
      </Section>
    </Document>
  ),
};
