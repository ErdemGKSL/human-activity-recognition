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
          Bu çalışmamızda beldeki bir akıllı telefonun accelerometer ve gyroscope sinyallerinden 12
          sınıflı insan aktivitesi tanımayı ele aldık. Sınıfların altısı temel durumlar; yürüme,
          merdiven çıkma, merdiven inme, oturma, ayakta durma ve uzanma. Diğer altısıysa bu duruşlar
          arasındaki geçişler.
        </Paragraph>
        <Paragraph>
          Hedefimiz ise dört yapay sinir ağını aynı kişi bazlı ayrımda karşılaştırmaktır. MLP veri
          setinin hazır 561 featureını kullanıyor, GRU, 1D CNN ve LSTM ise ham sinyal window'larını.
          Hazırlanmış feature'ların etkisini mimarinin etkisinden ayırmak amacıyla aynı MLP'yi
          düzleştirilmiş ham girdiyle bir kez daha, kontrol olarak eğittik.
        </Paragraph>
        <Paragraph>Raporda ulaştığımız sonuçlarsa kısaca şöyle:</Paragraph>
        <BulletList
          items={[
            "Kişi bazlı cross validation ile seçilip test koşusundan hemen önce dondurulan düzende LSTM ve 1D CNN, test macro F1'de MLP'den yüksek sonuç verdi. Ensemble değerleri 0,921 ve 0,928, MLP 0,864 (Tablo 7). Kişi bazlı bootstrap farkının %95 güven aralığı sıfırı dışladı (Tablo 8).",
            "Aynı MLP'yi ham girdiyle eğittiğimiz kontrol deneyi, augmentasyonsuz düzende MLP'nin üstünlüğünün büyük ölçüde hazır feature'lardan geldiğini gösterdi. CV'de ham girdiyle 0,803-0,808, feature'larla 0,845 aldı. Augmentasyon ve yoğun window eklenince bu fark 0,005'e indi (Tablo 6).",
            "İlk baseline'dan başlayarak finale kadar her adımı, sonucunu ve verdiğimiz kararı kaydettim (Bölüm 5). İlk baseline'ın test sonuçlarına teşhis için baktığımız da orada yazıyor (Bölüm 5.5).",
          ]}
        />
      </Section>

      <Section number="2" title="Veri Ön İşleme">
        <SubSection number="2.1" title="Veri seti">
          <Paragraph>
            Veri seti yaşları 19 ile 48 arasında olan 30 gönüllüden toplandı. Gönüllüler belde bir
            Samsung telefon taşıdı. 3 eksenli ivme ve 3 eksenli açısal hız 50 Hz'de kaydedildi.
            Etiketler video kaydıyla elle verildi. Kişiler resmi olarak %70 eğitim, %30 test diye
            ayrılı verdi, özetle 21 ve 9 kişi olarak ayrıldı (Tablo 1). Bu sürüm UCI HAR veri
            setinin ham sinyaller ve geçiş haraketleri eklenmiş geniş hâli.
          </Paragraph>
        </SubSection>
        <SubSection number="2.2" title="İki girdi temsili ve window kuralı">
          <Paragraph>
            Resmi dosyalarda her örnek 561 featurelık birer vektördür. Bu vektör 2,56 saniyelik,
            yani 128 ölçümlük ve %50 overlap'li bir window üzerinden hesaplanıyor. MLP'yi bu
            vektörlerle eğitmiştik ama resmi dosyalarda hangi satırın hangi ham window'a denk
            geldiği yoktur. Bu yüzden 1D CNN, GRU ve LSTM için window'ları ham sinyallerden ve
            etiket segmentlerinden aynı boy ve adımla yeniden ürettim, 128 ölçüm ve adım 64.
          </Paragraph>
          <Paragraph>
            Kural basit: window'un 128 ölçümünün en az %90'ı aynı etiketli segmente düşüyorsa window
            alınıyor ve o etiketi taşıyor, düşmüyorsa atılıyor. Bu kuralla totalde 10.776 window
            çıktı. Resmi dosyalardaki 10.929 örneğe göre fark %1,4'tür ve en çok transition
            sınıflarında görülüyor, 471, 518 window (Tablo 1). Yani MLP ile ham sinyal modellerinin
            test kümeleri aynı kişilerden geliyor ama birebir aynı değil, 3.162'e 3.124 örnek.
          </Paragraph>
          <Table
            columns={["Küme", "MLP'yle Resmi 561 feature", "Üretilen ham window (ham modeller)"]}
            widths={[1.6, 1, 1]}
            rows={[
              ["Toplam", "10.929", "10.776"],
              ["Eğitim (21 kişi)", "7.767", "7.652"],
              ["Test (9 kişi)", "3.162", "3.124"],
              ["Transition sınıfları, toplam", "518", "471"],
              ["Transition sınıfları, test", "166", "157"],
            ]}
            caption="Tablo 1: Örnek sayıları. Ham window'lar %90 tek etiket kuralı ve adım 64 ile üretildi."
          />
        </SubSection>
        <SubSection number="2.3" title="Kişi bazlı ayrım">
          <Paragraph>
            Test kişileri hiçbir eğitim veya model seçimi adımında kullanılmadı. Baseline'daki 21
            eğitim kişisinden her beşinci kişiyi validation set'e ayırdım, kalan 16 kişiyle eğittik.
            Sonraki bütün kararları 21 eğitim kişisi üzerinde 5-fold kişi bazlı CV ile verdim (Bölüm
            5.5). Finalde modeller 21 eğitim kişisinin tamamıyla eğitildi.
          </Paragraph>
        </SubSection>
        <SubSection number="2.4" title="Gravity/body ayrımı">
          <Paragraph>
            Ham ivme sinyali gravity ile vücut hareketini birlikte taşıyor. Resmi feature hattındaki
            gibi gravity bileşenini 0,3 Hz kesimli bir Butterworth low-pass filter ile ayırdık. Bu
            seçenek açıkken girdi 9 kanal oluyor, body acc, gravity ve gyro için üçer kanal.
            Kapalıyken ham ivme ve gyro ile 6 kanal kullanılıyor.
          </Paragraph>
        </SubSection>
        <SubSection number="2.5" title="Augmentasyon ve yoğun window">
          <Paragraph>
            Augmentasyonu sadece ham sinyal modellerinde ve sadece eğitim batch'lerinde uyguladık.
            Her window rastgele bir eksen etrafında en fazla ±12° döndürüldü, genliği de 0,9 ile 1,1
            arasında rastgele bir katsayıyla ölçeklendi. Yoğun window seçeneğinde eğitim window'ları
            adım 16 ile üretildi, bu %87,5 overlap demek. Değerlendirme window'ları hep adım 64, bu
            yüzden CV ve test sayıları seçenekten bağımsız olarak aynı window'lar üzerinde
            hesaplandı.
          </Paragraph>
        </SubSection>
        <SubSection number="2.6" title="Normalizasyon ve class-weighted loss">
          <Paragraph>
            Ortalama ve standart sapmayı sadece eğitim kişilerinden hesapladık, ham modellerde kanal
            başına, MLP'de feature başına. CV'de bunlar her fold'un eğitim kısmından yeniden
            hesaplandı. Resmi 561 feature zaten [-1, 1] aralığına normalize edilmiş geliyor ama bu
            normalizasyonun test kişilerini içerip içermediğini doğrulayamadık. Sınıf dengesizliği
            için class-weighted loss kullandık, az örnekli sınıflar daha büyük ağırlık aldı.
          </Paragraph>
        </SubSection>
      </Section>

      <Section number="3" title="Veri Analizi">
        <Paragraph>
          Şekil 1 resmi eğitim ve test kümelerinde sınıf başına örnek sayısını gösteriyor. Eğitim
          kümesinde temel aktivitelerin her birinde 987 ile 1.423 örnek var, transition sınıflarında
          ise 23 ile 90. En büyük sınıf olan STANDING, en küçük sınıf SIT_TO_STAND'in yaklaşık 62
          katı. Test kümesinde transition sınıfları 10 ile 49 örnekle temsil ediliyor.
        </Paragraph>
        <Paragraph>
          Bu dağılımın iki sonucu var. Accuracy büyük sınıflara göre şekilleniyor ve transition
          sınıflarındaki hataları gizliyor, bu yüzden birincil metrik olarak macro F1'i seçtik.
          Ayrıca transition sınıflarının test F1 değerleri 10 ile 49 örneğe dayandığı için sınıf
          bazlı farkları kesin yorumlamak mümkün değil (Bölüm 7).
        </Paragraph>
        <Figure
          src="class-dist"
          available={has("class-dist")}
          width={520}
          aspect={aspect("class-dist", 1050 / 690)}
          caption="Şekil 1: Resmi eğitim ve test kümelerinde sınıf başına örnek sayısı. Kesikli çizgi temel aktiviteleri transition sınıflarından ayırır."
        />
      </Section>

      <Section number="4" title="Model Mimarileri">
        <Paragraph>
          Her modelin iki sürümü var, ilk baseline'da kullanılan ve CV ile seçilip finalde
          kullanılan dondurulmuş sürüm. Tablo 2 katmanları ve parametre sayılarını, Tablo 3 eğitim
          düzenlerini veriyor. Bütün modellerde dropout 0,3 ve çıkışta 12 sınıflı bir linear katman
          var.
        </Paragraph>
        <SubSection number="4.1" title="MLP">
          <Paragraph>
            561 feature, 256 ve 128 nöronlu iki gizli katmandan geçiyor. Baseline ve final sürümü
            aynı mimari, 178.316 parametre, değişen sadece eğitim düzeni. Kontrol modeli MLP-raw
            aynı mimariyi 1.152 boyutlu düzleştirilmiş ham window ile kullanıyor, 329.612 parametre.
          </Paragraph>
        </SubSection>
        <SubSection number="4.2" title="1D CNN">
          <Paragraph>
            Her convolutional blok Conv1d, batch normalization, ReLU ve max pooling'den oluşuyor.
            Baseline sürümünde 32, 64 ve 128 kanallı üç blok ve global average pooling var, 54.380
            parametre. Final sürümü olan derin CNN 32, 64, 128 ve 128 kanallı dört blok kullanıyor,
            son üç blokta dilation 2. Zaman ekseninde ortalama ve maksimum birleştirilerek 256
            boyutlu bir representation elde ediliyor. Final sürümü 9 kanal girdiyle 138.700
            parametre.
          </Paragraph>
        </SubSection>
        <SubSection number="4.3" title="LSTM">
          <Paragraph>
            Baseline sürümü hidden size 64 olan iki katmanlı bir LSTM ve son zaman adımının
            çıktısını sınıflandırıyor, 52.492 parametre. Final sürümü bidirectional ve bütün zaman
            adımlarının ortalamasını ve maksimumunu birleştiriyor, buna mean/max pooling diyoruz.
            Forget gate bias'ı 1 ile başlatılıyor, girdi 9 kanal, 140.812 parametre.
          </Paragraph>
        </SubSection>
        <SubSection number="4.4" title="GRU">
          <Paragraph>
            Baseline sürümü LSTM ile aynı yapıda, iki katman, hidden size 64 ve son zaman adımı,
            39.564 parametre. Final sürümü bidirectional ve mean/max pooling kullanıyor. GRU'da
            gravity/body ayrımı CV'de fayda vermediği için girdi 6 kanal kaldı (Tablo 6), 105.228
            parametre.
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
          caption="Tablo 2: Mimariler ve parametre sayıları."
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
          caption="Tablo 3: Eğitim düzenleri. Ortak ayarlarda AdamW, batch miktarı 128, cosine schedule, class-weighted loss ve dropout ise 0,3."
        />
      </Section>

      <Section number="5" title="Deneyler ve İzlenen Yol" newPage>
        <Paragraph>
          Burada her adımda ne yaptık, ne çıktı ve ne karar verdim. Sayıların hepsi Bölüm 6'daki
          tablolarda.
        </Paragraph>

        <SubSection number="5.1" title="Veri setinin seçimi ve doğrulanması">
          <Step
            done="UCI #341 veri seti indirildi ve resmi dosyalar sayıldı."
            result="10.929 örnek, 30 kişi ve 12 sınıf. Bunların 7.767'si eğitim, 3.162'si test (Tablo 1)."
            decision="Resmi kişi bazlı ayrımıda, 21 eğitim ve 9 test kişilerini, olduğu gibi kullanıyorum."
          />
        </SubSection>

        <SubSection number="5.2" title="Ham window kuralı">
          <Step
            done="Resmi dosyalarda, satırlarla ham window'lar eşlenmediği için ham sinyal modellerinin window'larını yeniden ürettim. Window'un en az %90'ının tek etiketli segmente düşmesi durumunu denedim."
            result="10.776 window çıktı, resmi sayıya göre fark %1,4. Transition sınıflarında 471 window var, resmide 518 (Tablo 1)."
            decision="%90 kuralını kullanıyoruz. MLP ile ham modellerin test kümeleri farklı, 3.162 ve 3.124 örnek."
          />
        </SubSection>

        <SubSection number="5.3" title="Çalışma ortamı">
          <Step
            done="Eğitimler Google Colab'da GPU ile ve PyTorch ile yapıldı."
            result="Aynı yapılandırmayla iki kez koştuğumuzda, A1a ve K5 ile, fark 0,002 oldu (Tablo 6)."
            decision="Tüm koşular bu ortamda yapılıyor."
          />
        </SubSection>

        <SubSection number="5.4" title="İlk baseline">
          <Step
            done="Dört modeli ortak ve ayarsız bir düzenle eğittim. 16 kişiyle 40 epoch eğitim yaptık, 5 kişilik validation sete göre en iyi epoch'u seçtik ve 5 adet seed koştum (Tablo 3). Sonra modelleri test kümesinde ölçtüm."
            result="Macro F1 sonuçları MLP 0,841, 1D CNN 0,819, GRU 0,786 ve LSTM 0,666 (Tablo 4). LSTM kararsızdı, standart sapması 0,094. En zayıf sınıflar transition sınıflarıydı, SITTING ve STANDING'de de malesef ham modeller MLP'nin gerisindeydi (Tablo 5). Ham sinyal modellerinin MLP'nin gerisinde kalması beklentimi aştı."
            decision="Ham modelleri iyileştirmek için derinlemesine düşündüm."
          />
        </SubSection>

        <SubSection number="5.5" title="Yöntem düzeltmesi">
          <Step
            done="Kodda bazı noktalara odaklandım. Bunlar ölçüm değil, hep tahmindi. RNN'ler az eğitilmişti, gradient clipping ve warmup yoktu ve son zaman adımı kullanılıyodu. Model seçiminden sonra 21 kişiyle yeniden eğitim yapılmıyodu. Küçük validation set epoch seçimini gürültülü yapıyordu. Birazda yapay zekaya danıştıktan sonra, Gravity/body ayrımı ve augmentasyon yoktu, class weight de çok agresifti."
            result="Yöntemde bir sorun da fark ettim. Baseline teşhisini test kümesinin confusion matrix'ine ve sınıf bazlı F1 değerlerine bakarak yapmıştım. Bundan sonra da test kümesine bakarak karar verseydik test sonucu olduğundan iyi görünebilirdi, bu doğru bir durum değil."
            decision="Bundan sonra her kararı sadece 21 eğitim kişisi üzerinde 5-fold kişi bazlı CV ile verdik, ölçüt out-of-fold macro F1. Test en sonda dondurulmuş düzenle bir kez koşuldu. MLP'ye de aynı arama bütçesini verdim. Baseline kodunu değiştirmedim, yeni deneyleride ayrı yaptık."
          />
        </SubSection>

        <SubSection number="5.6" title="Baseline düzeninin CV ile ölçmek (A0)">
          <Step
            done="Baseline'ın düzenini CV'de yeniden ölçtüm. İki fark var, model seçimi son epoch'la yapıldı ve LSTM'de forget gate bias'ı 1 ile başlatıldı."
            result="MLP 0,824, 1D CNN 0,807, GRU 0,776, LSTM 0,768 (Tablo 6). Testte gördüğüm LSTM çöküşü, 0,666, CV'de görülmedi."
            decision="Testteki LSTM sonucunun bir kısmı epoch seçimindeki şansa bağlı görünüyordu, bu yüzden bundan sonra CV değerlerini esas alıyoruz."
          />
        </SubSection>

        <SubSection number="5.7" title="Optimizasyon (A1)">
          <Step
            done="Epoch sayısınıysa 100'e çıkardık, warmup ve gradient clipping ekledim. Öğrenme hızı olarak 1e-3 (A1a) ve 2e-3 (A1b) denedim. MLP'de ayrıca 5e-4, 200 epoch ve sqrt class weight de denendi."
            result="MLP 0,824'ten 0,845'e çıktı, diğer MLP denemelerinde 0,838 ile 0,845 arasında kaldı. Ham modellerdeyse lr 2e-3, 1e-3'ten iyiydi, CNN 0,822, LSTM 0,797, GRU 0,779 aldı (Tablo 6). Yani baseline düzeni sadece ham modeller için değil, MLP için de eksik ayarlıydı."
            decision="Ham modeller için lr 2e-3, warmup ve clipping'e ortak taban oldu. MLP için A1a seçildi, 100 epoch ve lr 1e-3."
          />
        </SubSection>

        <SubSection number="5.8" title="RNN yapısı, pooling ve bidirectional">
          <Step
            done="A1a düzeni üzerindeki son zaman adımı yerine mean/max pooling denedim, sonra buna çift yönlü (bi directional) katmanlar ekledim."
            result="Tek başına mean/max pooling fayda vermedi, LSTM 0,763, GRU 0,767. Bidirectional ile birlikte LSTM 0,787, GRU 0,789 oldu. Bu A1a'ya göre 0,016 ve 0,022 artış (Tablo 6)."
            decision="RNN'lerde bidirectional ve mean/max pooling kullanılıyor."
          />
        </SubSection>

        <SubSection number="5.9" title="Gravity/body ayrımı (9 kanal)">
          <Step
            done="A1a düzeni üzerinde ivmeyi gravity ve body bileşenlerine ayırdıktan sonra 9 kanallı input denedik."
            result="CNN 0,809'dan 0,827'ye çıktı, yani +0,018. LSTM +0,010, GRU -0,003 değişti (Tablo 6)."
            decision="CNN ve LSTM'de 9 kanal kullanıyoruz. GRU'da fayda görmediğimiz için onu ayrı değerlendiriyoruz."
          />
        </SubSection>

        <SubSection number="5.10" title="Derin CNN">
          <Step
            done="Dört bloklu, dilation'lı ve mean/max pooling'li bir CNN denedik (Tablo 2)."
            result="0,809'dan 0,830'a çıktı, yani +0,021 (Tablo 6)."
            decision="Derin CNN'i kullanıyoruz. Gravity ile birleştirince ortak taban C1 0,833 oldu."
          />
        </SubSection>

        <SubSection number="5.11" title="Feature mı, mimari mi? (MLP-raw)">
          <Step
            done="MLP'nin avantajı hazır feature'lardan mı geliyor yoksa mimariden mi, bunu ayırmak için aynı MLP'yi düzleştirilmiş ham window'larla eğittik."
            result="MLP-raw 6 kanalla 0,803, 9 kanalla 0,808 aldı. Aynı MLP 561 feature ile 0,845 almıştı (Tablo 6)."
            decision="Bu düzende MLP'nin üstünlüğü büyük ölçüde mimariden değil, hazır feature'lardan geliyor. Bu kontrol deneyini finale kadar taşıdık (Bölüm 5.13)."
          />
        </SubSection>

        <SubSection number="5.12" title="Augmentasyon ve yoğun window: 2 × 2 tasarım">
          <Step
            done="C1 tabanı üzerinde iki etkeni ayrı ayrı ve birlikte denedik. K1'de sadece augmentasyon var, adım 64. D1'de sadece yoğun window var, adım 16. D2'de ikisi birlikte. D1 ve D2'de epoch sayısı 40, çünkü adım 16'da bir epoch adım 64'e göre yaklaşık dört kat window içeriyor."
            result="CNN'de C1 0,833, sadece augmentasyonla 0,849, yani +0,016. Sadece yoğun window ile 0,823, ikisi birlikte 0,855. LSTM ve GRU'da D1 0,817 ve 0,811, D2 0,857 ve 0,845 (Tablo 6)."
            decision="CNN'de asıl kazanç augmentasyondan geldi. Yoğun window tek başına karışık etki verdi, augmentasyonla birlikte CNN'e kattığı 0,006'lık fark gürültü bandında. LSTM ve GRU'da adım 64 ile augmentasyon denenmediği için bu iki etkeni orada ayıramıyoruz. Final düzen D2 oldu."
          />
        </SubSection>

        <SubSection number="5.13" title="Class weight ve MLP'ye eşit arama bütçesi">
          <Step
            done="CNN'de D2 üzerinde daha yumuşak bir sınıf ağırlığı, sqrt, denedik (E1s). MLP'ye eşit bütçe vermek için feature'lara Gauss gürültüsü ekledik ve A1a'yı bir kez daha koştuk (K5). MLP-raw'ı da D2 düzeniyle eğittik (K2)."
            result="E1s 0,858 ± 0,003, D2 0,855 ± 0,010 aldı. Gürültü MLP'ye yardım etmedi, 0,838 ve 0,843 aldı, K5 de 0,843. MLP-raw D2 düzeniyle 0,840'a çıktı ve 561 feature'lı MLP'ye 0,005 yaklaştı (Tablo 6)."
            decision="CNN'de tutarlılık için tam class weight'i koruduk, fark zaten gürültü bandında. MLP için A1a donduruldu. Feature bulgusunu sadece augmentasyonsuz karşılaştırma için geçerli sayıyoruz."
          />
        </SubSection>

        <SubSection number="5.14" title="Ara değerlendirme ve dondurma">
          <Step
            done="Fable bütün CV tablosunu ve kodu okuyup ikinci bir değerlendirme yaptı. Girdi temsilinin etkisi, baseline'ın eksik ayarlı olması ve augmentasyonun CNN'e katkısı gürültünün çok üstündeydi. CNN ile MLP arasındaki CV farkı ise, 0,855 ve 0,845, gürültü bandındaydı."
            result="Seed standart sapması kişi belirsizliğini içermiyordu. CV 21, test ise 9 kişiye dayanıyordu."
            decision="Keşfi kapattık. Final yapılandırmalarını (Tablo 3) ve analiz planını test koşusundan önce yazıp kayda geçirdik. Birincil metrik test macro F1. 10 seed'in ortalamasını ve std'sini, bir de 10 seed'in olasılıklarının ortalamasıyla ensemble sonucunu raporlayacaktık. Belirsizlik için 9 test kişisi üzerinde kişi bazlı bootstrap ile %95 güven aralığı, yani GA, hesaplanacaktı. MLP'ye göre fark da kişi bazında eşleştirilerek ölçülecekti. İddia eşiği şu: bir ham model için 'MLP'yi geçti' demek için bu farkın GA'sı sıfırı dışlamalı ve CV'de fark aynı yönde olmalı. Yoksa 'karşılaştırılabilir düzeyde' diyoruz."
          />
        </SubSection>

        <SubSection number="5.15" title="Final test koşusu">
          <Step
            done="Dondurulmuş beş yapılandırmayı 21 eğitim kişisiyle 10 seed için eğittik ve test kümesinde bir kez ölçtük."
            result="Ensemble macro F1 sonuçları LSTM 0,928, 1D CNN 0,921, GRU 0,921, MLP 0,864 ve MLP-raw 0,862 (Tablo 7). MLP'ye göre farklar Tablo 8'de, sınıf bazlı sonuçlar Tablo 9'da."
            decision="Bu sonuçlar ve dondurulmuş düzen artık değişmiyor. Bundan sonra yapılacak her deneyi ayrıca 'keşif amaçlı' diye raporlayacağız."
          />
        </SubSection>
      </Section>

      <Section number="6" title="Eğitim ve Test Sonuçları" newPage>
        <SubSection number="6.1" title="İlk sonuçlar: baseline düzeni, test kümesi">
          <Paragraph>
            Tablo 4 ve Tablo 5 ilk baseline düzeninin test sonuçları. Bu düzen sonraki tablolarla
            aynı protokolü izlemiyor, 16 kişiyle ve ayarsız eğitildi, epoch validation'a göre
            seçildi. Bu yüzden final sonuçlarla aynı tabloya koymadık.
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
            caption="Tablo 4: İlk sonuçlar, baseline düzeni, test kümesi. 5 seed ortalaması ± std, precision, recall ve F1 macro ortalama."
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
          caption="Tablo 5: İlk sonuçlar, sınıf bazlı test F1. Baseline düzeni, 5 seed ortalaması."
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
              Tablo 6, Bölüm 5'teki kararların dayandığı CV sonuçlarını veriyor. Her hücre 21 eğitim
              kişisi üzerinde 5-fold kişi bazlı CV ile hesaplanan out-of-fold macro F1'in 3 seed
              ortalaması ± std'si. Seed std'si 0,002 ile 0,020 arasında, bu yüzden 0,01'in altındaki
              farkları gürültü kabul ettik.
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
            caption="Tablo 6: CV ablation, OOF macro F1, 3 seed. Final için dondurulan satırlar MLP'de A1a, diğerlerinde D2. LSTM'de D1 ve D2 gravity içeriyor, GRU'da içermiyor. MLP-raw'ın A1a satırı 6 kanal, diğer satırları 9 kanal."
          />
        </div>

        <SubSection number="6.3" title="Final test sonuçları (dondurulmuş düzen)">
          <Paragraph>
            Tablo 7 final koşunun sonuçları. Tekil model değeri 10 seed'in ortalaması ± std.
            Ensemble değeri 10 seed'in olasılıkları ortalanarak hesaplanıyor. Güven aralığını sadece
            ensemble için hesapladık, kişi örneklemesinden gelen belirsizliği içeriyor. Seed std'si
            bu belirsizliği içermiyor. CV sütunu karşılaştırmayı kolaylaştırmak için var ama iki
            protokol farklı. CV'de modeller fold başına 16 ya da 17 kişiyle, finalde 21 kişiyle
            eğitiliyor.
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
          caption="Tablo 7: Final test sonuçları. GA 9 test kişisi üzerinde 2.000 tekrarlı kişi bazlı bootstrap ile hesaplandı. CV değeri Tablo 6'daki dondurulmuş satır."
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
          caption="Tablo 8: MLP'ye göre eşleştirilmiş test farkı ve CV farkı. Test farkı aynı kişi çekilişlerinde model eksi MLP, CV farkı Tablo 6'daki değerlerden."
        />
        <Figure
          src="delta"
          available={has("delta")}
          width={380}
          aspect={aspect("delta", 900 / 690)}
          caption="Şekil 2: MLP'ye göre eşleştirilmiş macro F1 farkı ve %95 GA, ensemble, kişi bazlı bootstrap."
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
            caption="Tablo 9: Final düzen, sınıf bazlı test F1 (ensemble)."
          />
        </div>
        <FigurePair left={["cm-mlp", "Şekil 3: MLP"]} right={["cm-mlpraw", "Şekil 4: MLP-raw"]} />
        <FigurePair left={["cm-cnn", "Şekil 5: 1D CNN"]} right={["cm-lstm", "Şekil 6: LSTM"]} />
        <FigurePair
          left={[
            "cm-gru",
            "Şekil 7: GRU. Şekil 3-7 final düzen, test kümesi, ensemble, satır normalize.",
          ]}
        />
      </Section>

      <Section number="7" title="Modellerin Karşılaştırılması" newPage>
        <SubSection number="7.1" title="Ham sinyal modelleri ve MLP">
          <Paragraph>
            Önceden koyduğumuz iddia eşiğinin iki koşulu var. Test kümesinde kişi bazlı farkın %95
            GA'sı sıfırı dışlamalı ve CV'de fark aynı yönde olmalı (Bölüm 5.14). 1D CNN ve LSTM iki
            koşulu da sağladı. Test farkları +0,056 [+0,026; +0,093] ve +0,063 [+0,029; +0,097], CV
            farkları +0,010 ve +0,012 (Tablo 8). Bu yüzden bu veri setinde ve bu eğitim düzeninde 1D
            CNN ve LSTM'nin test macro F1'de MLP'den yüksek sonuç verdiğini yazabiliyoruz. CV
            farkları ise 0,01 civarında ve tek başına gürültü bandında. Yaklaşık 0,06'lık test farkı
            CV farkından büyük, 9 kişilik test kümesi yüzünden de GA geniş.
          </Paragraph>
          <Paragraph>
            GRU testte MLP'den yüksek, +0,055 [+0,024; +0,086], ama CV'de iki model ayırt
            edilemiyor, ikisi de 0,845 (Tablo 8). Eşik karşılanmadığı için GRU hakkında
            söyleyebileceğimiz şu: testte MLP'den yüksek, CV'de ayırt edilemez. GRU'nun MLP'den
            üstün olduğunu iddia etmiyoruz.
          </Paragraph>
          <Paragraph>
            Ham modellerde ensemble tekil seed ortalamasının üstüne çıktı. CNN 0,894'ten 0,921'e,
            LSTM 0,898'den 0,928'e, GRU 0,888'den 0,921'e yükseldi. MLP'de artış küçük kaldı,
            0,860'tan 0,864'e (Tablo 7). Tekil seed ortalamalarında da üç ham model MLP'nin üstünde,
            0,888-0,898 ve 0,860. Ama seed std'si kişi belirsizliğini içermediği için tekil değerler
            arasındaki farka GA hesaplamadık.
          </Paragraph>
        </SubSection>
        <SubSection number="7.2" title="Feature mı, mimari mi?">
          <Paragraph>
            MLP-raw kontrolünün sonucu eğitim düzenine bağlı. Augmentasyon olmadan aynı MLP ham
            girdiyle 6 kanalda 0,803, 9 kanalda 0,808, 561 feature ile 0,845 aldı (Tablo 6). Yani bu
            düzende MLP'nin üstünlüğü büyük ölçüde hazır feature'lardan geliyordu. Gravity, yoğun
            window ve augmentasyonla MLP-raw 0,840'a çıktı ve fark 0,005'e indi. Testte de MLP-raw
            ile MLP ayırt edilemiyor, fark -0,005 [-0,055; +0,043] (Tablo 8). Bu yüzden "MLP'nin
            üstünlüğü hazır feature'lardan geliyor" demek sadece augmentasyonsuz karşılaştırma için
            doğru.
          </Paragraph>
          <Paragraph>
            Macro F1'deki bu eşitlik iki modelin aynı hataları yaptığı anlamına gelmiyor. MLP-raw'ın
            accuracy'si daha düşük, 0,914 ve 0,940 (Tablo 7). SITTING ve STANDING'de de zayıf, F1
            0,799 ve 0,835, MLP'de bu değerler 0,920 ve 0,931 (Tablo 9). Eşitlik MLP-raw'ın
            transition sınıflarındaki daha yüksek ortalamasından geliyor, 0,801 ve 0,776. Aynı ham
            girdiyi kullanan 1D CNN, LSTM ve GRU'nun testte MLP-raw'dan yüksek olması (Tablo 7) ham
            girdide mimarinin de etkisi olduğuyla uyumlu. Ama bu fark için eşleştirilmiş test
            yapmadık.
          </Paragraph>
        </SubSection>
        <SubSection number="7.3" title="Sınıflar: temel aktiviteler ve transition'lar">
          <Paragraph>
            Ham sinyal modelleri hem temel aktivitelerde hem transition sınıflarında MLP'den yüksek
            (Tablo 9). Temel aktivitelerde ortalama F1 0,979-0,984, MLP'de 0,952. Transition
            sınıflarında 0,858-0,874, MLP'de 0,776. En zayıf sınıflar yine SIT_TO_LIE ve
            STAND_TO_LIE. Confusion matrix'lerde bu iki sınıfın birbirine karıştığı görülüyor.
            MLP'de SIT_TO_LIE örneklerinin 0,28'i STAND_TO_LIE, LSTM'de STAND_TO_LIE örneklerinin
            0,22'si SIT_TO_LIE olarak tahmin edildi (Şekil 3 ve 6). İki hareket de uzanarak bitiyor,
            bu benzerlik karışmayla uyumlu. MLP'de SITTING örneklerinin 0,11'i STANDING'e kaydı,
            LSTM'de bu oran 0,06.
          </Paragraph>
          <Paragraph>
            Transition sınıfları test kümesinde az örneğe dayanıyor, ham modellerde toplam 157
            window (Tablo 1). Bu yüzden sınıf bazlı farkları kesin yorumlamamak gerekiyor. Mesela
            LIE_TO_SIT'te LSTM 0,950, CNN 0,826 aldı (Tablo 9), ama bu sınıfın resmi test kümesinde
            sadece 25 örneği var (Şekil 1).
          </Paragraph>
        </SubSection>
        <SubSection number="7.4" title="İlk sonuçlarla ilişki">
          <Paragraph>
            İlk baseline'da sıralama MLP, 1D CNN, GRU, LSTM idi (Tablo 4). Final düzende ise ham
            sinyal modelleri MLP'nin üstünde (Tablo 7). İki tablo doğrudan karşılaştırılamaz çünkü
            protokoller farklı. Baseline 16 kişiyle ve validation'a göre seçilen epoch'la eğitildi,
            final 21 kişiyle ve sabit epoch'la, ayarlar da farklı. Aynı CV protokolünde LSTM A0'da
            0,768'den D2'de 0,857'ye çıktı (Tablo 6). Sıralamadaki değişim eğitim düzenindeki
            değişikliklerle uyumlu.
          </Paragraph>
        </SubSection>
      </Section>

      <Section number="8" title="Gerçek Telefon Sensör Verileriyle Ek Testler">
        <Paragraph>
          Bu test yapılmadı. Bu bölüm planlanan çalışmayı ve bir sınırlılığı anlatıyor. Raporda
          gerçek telefon verisiyle alınmış bir sonuç yok, canlı demo da yapılmadı.
        </Paragraph>
        <Paragraph>
          Plan şu. Hazır bir sensör kayıt uygulamasıyla telefon beldeyken accelerometer ve gyroscope
          50 Hz'de kaydedilecek. Etiketler önceden belirlenmiş bir aktivite sırasına ve
          zamanlamasına göre verilecek. Kayıt eğitim verisine uydurulacak, birimler veri
          setindekiyle aynı hâle getirilecek ve telefonun eksenleri veri setinin eksen yönleriyle
          eşleştirilecek. Sonra aynı window kuralı, gravity/body ayrımı ve eğitim kümesi
          istatistikleriyle standardizasyon uygulanacak.
        </Paragraph>
        <Paragraph>
          Değerlendirme çevrimdışı ve sadece ham sinyal modelleri olan 1D CNN, LSTM ve GRU ile
          yapılacak. MLP plana dahil değil, çünkü resmi 561 feature hattını yeniden kurmak
          gerekiyor. Telefon, takılma biçimi ve kişi farklı olacağı için performansın test
          kümesindekinden düşük olması beklenebilir. Ne kadar düşeceğini ölçmeden bilemeyiz.
        </Paragraph>
      </Section>

      <Section number="9" title="Sonuçlar ve Değerlendirme">
        <SubSection number="9.1" title="Yazılabilir iddialar">
          <BulletList
            items={[
              "UCI #341 veri setinde, kişi bazlı CV ile seçilip dondurulan düzende 1D CNN ve LSTM test macro F1'de 561 feature'lı MLP'den yüksek sonuç verdi. Ensemble değerleri 0,921 ve 0,928, MLP 0,864. Kişi bazlı farkın GA'sı sıfırı dışlıyor ve CV aynı yönde (Tablo 7 ve 8).",
              "GRU testte MLP'den yüksek, CV'de ayırt edilemez (Tablo 8).",
              "Augmentasyonsuz düzende MLP'nin avantajı büyük ölçüde hazır feature'lardan geliyordu. Augmentasyon ve yoğun window ile ham girdili aynı MLP bu farkı CV'de 0,005'e indirdi, testte de ayırt edilemez hâle getirdi (Tablo 6 ve 8).",
              "1D CNN'de en büyük CV kazancı augmentasyondan geldi, +0,016 (Tablo 6). İlk baseline bütün modeller için eksik ayarlıydı, MLP bile 0,824'ten 0,845'e çıktı (Tablo 6).",
            ]}
          />
        </SubSection>
        <SubSection number="9.2" title="Yazılamaz iddialar">
          <BulletList
            items={[
              "Ham sinyal modellerinin genel olarak feature tabanlı modellerden üstün olduğunu söyleyemeyiz. Sonuç tek veri setine, tek bir MLP'ye ve sınırlı bir aramaya dayanıyor.",
              "GRU'nun MLP'den üstün olduğunu söyleyemeyiz, eşik karşılanmadı. LSTM, CNN ve GRU arasında bir sıralama da yapamayız, GA'lar örtüşüyor (Tablo 7).",
              "Gerçek telefon verisinde ya da canlı kullanımda performans hakkında bir şey söyleyemeyiz, bu test yapılmadı (Bölüm 8).",
            ]}
          />
        </SubSection>
        <SubSection number="9.3" title="Sınırlılıklar">
          <BulletList
            items={[
              "Test kümesi 9 kişi. Kişi bazlı bootstrap GA'ları geniş, az sayıda kişiden yeniden örneklendiği için biraz iyimser de olabilir (Tablo 7).",
              "MLP ile ham modellerin test kümeleri birebir aynı değil, 3.162 ve 3.124 örnek (Tablo 1). Bootstrap aynı kişileri çekiyor ama aynı window'ları değil.",
              "Test değerleri CV'den yüksek, MLP'de +0,015, ham modellerde yaklaşık +0,04 (Tablo 7). Bunun sebebi finalde 21 kişiyle eğitim olabilir, ham modellerin ek kişiden daha çok yararlanması olabilir, test kişilerinin daha kolay olması da olabilir. Bu deneylerle bunları ayıramadık.",
              "Hiperparametre araması sınırlıydı. Her seçenek 3 seed'le ve tek tek denendi, tam ızgara aranmadı (Tablo 6).",
              "İlk baseline'ın sorunlarını test sonuçlarına bakarak teşhis ettik (Bölüm 5.5). Sonraki kararları sadece CV ile verdik ama araştırmanın yönü bu ilk bakıştan etkilenmiş olabilir.",
              "Resmi 561 feature'ın [-1, 1] normalizasyonunun test kişilerini içerip içermediğini doğrulayamadık (Bölüm 2.6).",
            ]}
          />
        </SubSection>
      </Section>
    </Document>
  ),
};
