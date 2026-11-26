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
          Bu çalışmada belde taşınan bir akıllı telefonun accelerometer ve gyroscope sinyallerinden
          12 sınıflı insan aktivitesi tanıma problemine odaklandım. Sınıfların altısı temel
          hareketler: yürüme, merdiven çıkma, merdiven inme, oturma, ayakta durma ve yatma. Kalan
          altısı ise bu durumlar arasındaki geçişleri kapsıyor.
        </Paragraph>
        <Paragraph>
          Amacım, dört yapay sinir ağını aynı kişi bazlı ayrım üzerinden karşılaştırmaktı. MLP, veri
          setinde hazır bulunan 561 feature ile çalışıyor; GRU, 1D CNN ve LSTM ise işlenmemiş
          sinyallerin window'larından besleniyor. Hazır feature'ların etkisini mimariden ayırabilmek
          için aynı MLP'yi düzleştirilmiş ham girdiyle, karşılaştırma amaçlı bir kontrol grubu
          olarak bir kez daha eğittim.
        </Paragraph>
        <Paragraph>Raporda ulaştığım sonuçlarsa kısaca şöyle:</Paragraph>
        <BulletList
          items={[
            "Kişi bazlı cross validation ile belirlenip test koşusu öncesinde sabitlenen düzende LSTM ve 1D CNN, test macro F1'de MLP'nin önüne geçti. Ensemble değerleri 0,921 ve 0,928, MLP ise 0,864 (Tablo 7). Kişi bazlı bootstrap ile hesaplanan farkın %95 güven aralığı sıfırı kapsamadı (Tablo 8).",
            "Aynı MLP'yi ham girdiyle eğittiğim kontrol çalışması, augmentasyonsuz düzende MLP'nin üstünlüğünün önemli kısmının hazır feature'lardan kaynaklandığını ortaya koydu. CV'de ham girdiyle 0,803-0,808, feature'larla 0,845 elde ettim. Augmentasyon ve yoğun window devreye girince bu fark 0,005'e geriledi (Tablo 6).",
            "İlk baseline'dan finale uzanan her aşamayı, elde edilen sonucu ve verdiğim kararı not aldım (Bölüm 5). İlk baseline'ın test sonuçlarına dayanarak yaptığım teşhis de aynı yerde kayıtlı (Bölüm 5.5).",
          ]}
        />
      </Section>

      <Section number="2" title="Veri Ön İşleme">
        <SubSection number="2.1" title="Veri seti">
          <Paragraph>
            Veri seti, yaşları 19 ile 48 arasında değişen 30 gönüllüden elde edildi. Gönüllüler
            belde bir Samsung telefon taşıyarak hareket etti. 3 eksenli ivme ve 3 eksenli açısal hız
            50 Hz'de kayıt altına alındı. Etiketler video kaydı üzerinden elle atandı. Kişiler resmi
            kayıtta %70 eğitim, %30 test şeklinde ayrılmış durumda; özetle 21 eğitim ve 9 test
            kişisi (Tablo 1). Bu sürüm, UCI HAR veri setinin hem ham sinyalleri hem de geçiş
            hareketleri içeren genişletilmiş halidir.
          </Paragraph>
        </SubSection>
        <SubSection number="2.2" title="İki girdi temsili ve window kuralı">
          <Paragraph>
            Resmi dosyalarda her örnek 561 feature'lık bir vektör olarak sunuluyor. Bu vektör 2,56
            saniyelik, yani 128 ölçümlük ve %50 overlap'li bir window üzerinden türetiliyor. MLP'yi
            bu vektörlerle eğitmiştim; ancak resmi dosyalarda hangi satırın hangi ham window'a
            karşılık geldiği bilgisi bulunmuyor. Bu nedenle 1D CNN, GRU ve LSTM için window'ları ham
            sinyallerden ve etiket segmentlerinden aynı boyut ve adımla yeniden oluşturdum: 128
            ölçüm ve adım 64.
          </Paragraph>
          <Paragraph>
            Kural şöyle işliyor: window'un 128 ölçümünün en az %90'ı aynı etiketli segmente denk
            geliyorsa window kabul ediliyor ve o etiketi taşıyor; gelmiyorsa eleniyor. Bu kural
            sonucunda toplam 10.776 window elde ettim. Resmi dosyalardaki 10.929 örneğe kıyasla fark
            %1,4 civarında ve en belirgin şekilde transition sınıflarında ortaya çıkıyor: 471'e
            karşılık 518 window (Tablo 1). Yani MLP ile ham sinyal modellerinin test kümeleri aynı
            kişilerden seçiliyor ama birebir özdeş değil: 3.162 ve 3.124 örnek.
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
            Hiçbir eğitim veya model seçimi adımında test kişileri kullanılmadı. Baselineda 21
            eğitim kişisinden beşte birini validasyon'a ayırdım, kalan 16 kişiylede eğittim. Ondan
            sonraki kararları 21 kişi üzerinde 5-fold kişi bazlı CV'yle verdim (Bölüm 5.5). En sonda
            21 kişinin hepsiyle eğittim.
          </Paragraph>
        </SubSection>
        <SubSection number="2.4" title="Gravity/body ayrımı">
          <Paragraph>
            Ham ivme yerçekimiyle vücut hareketini birlikte taşımaktadır. Yer çekimini 0,3 Hz
            kesimli Butterworth low-pass filtersiyle ayırdım. Açıkken input 9 kanal oluyor (body
            acc, gravity, gyro), kapalıyken 6 kanal.
          </Paragraph>
        </SubSection>
        <SubSection number="2.5" title="Augmentasyon ve yoğun window">
          <Paragraph>
            Augmentasyon yalnızca ham sinyal modellerinde ve eğitim batch'lerinde kullanıldı.
            Window'u rastgele bir eksende en fazla ±12° döndürdüm, genliğini ise 0,9 ile 1,1
            aralığında ölçekledim. Yoğun window tarafında adım 16 aldım; bu da %87,5 overlap
            anlamına geliyor. Değerlendirmede adım daima 64 olduğundan CV ve test sayıları bu
            seçimlerden etkilenmedi.
          </Paragraph>
        </SubSection>
        <SubSection number="2.6" title="Normalizasyon ve class-weighted loss">
          <Paragraph>
            Ortalama ve standart sapmayı yalnızca eğitim kişilerinden hesapladım; CV'de de her
            fold'un eğitim parçasından. Resmi 561 feature zaten [-1, 1] aralığında geliyor ve bu
            normalizasyonun test kişilerini de kapsayıp kapsamadığını bilmiyorum. Sınıf
            dengesizliğini gidermek için class-weighted loss kullandım; örneği az olan sınıflar daha
            yüksek ağırlık alıyor.
          </Paragraph>
        </SubSection>
      </Section>

      <Section number="3" title="Veri Analizi">
        <Paragraph>
          Şekil 1'de sınıf başına düşen örnek sayıları gösteriliyor. Eğitim kümesinde temel
          aktiviteler 987 ile 1.423 örnek arasında değişirken transition sınıfları 23 ile 90 örnekle
          sınırlı. En kalabalık sınıf STANDING; en küçüğü ise SIT_TO_STAND'in yaklaşık 62 katı
          büyüklüğünde. Test tarafında transition sınıfları 10 ile 49 örnek arasında yer alıyor.
        </Paragraph>
        <Paragraph>
          Bu tablo yüzünden accuracy yanıltıcı bir ölçü hâline geliyor; kalabalık sınıflar
          transition hatalarının altını kapatıyor. Bu yüzden birincil ölçüt macro F1 oldu.
          Transition sınıflarının test F1'i 10 ile 49 örneğe dayandığından sınıf bazında çıkan
          farkları net bir dille yorumlamak mümkün değil (Bölüm 7).
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
          Her modelin iki versiyonu mevcut: ilk baseline ve CV ile seçilip sabitlenen final. Katman
          yapıları ve parametre sayıları Tablo 2'de, eğitim düzenleri Tablo 3'te yer alıyor. Tüm
          modellerde dropout 0,3 ve çıkışta 12 sınıflı bir linear katman bulunuyor.
        </Paragraph>
        <SubSection number="4.1" title="MLP">
          <Paragraph>
            MLP, 561 feature'ı 256 ve 128 nöronlu iki gizli katmandan geçiriyor; toplam 178.316
            parametre. Baseline ve final aynı mimariyi paylaşıyor, aradaki tek fark eğitim düzeni.
            MLP-raw ise aynı mimariyi 1.152 boyutlu düzleştirilmiş ham window ile çalıştırıyor;
            329.612 parametre.
          </Paragraph>
        </SubSection>
        <SubSection number="4.2" title="1D CNN">
          <Paragraph>
            Her convolutional blok Conv1d, batch normalization, ReLU ve max pooling katmanlarından
            oluşuyor. Baseline'da 32, 64, 128 kanallı üç blok ile global average pooling var; 54.380
            parametre. Final sürümdeki derin CNN'de ise 32, 64, 128, 128 kanallı dört blok bulunuyor
            ve son üçünde dilation 2 uygulanıyor. Zaman eksenindeki ortalama ve maksimum
            birleştirilerek 256 boyutlu bir representation elde ediliyor. Final, 9 kanal girdiyle
            138.700 parametre içeriyor.
          </Paragraph>
        </SubSection>
        <SubSection number="4.3" title="LSTM">
          <Paragraph>
            Baseline LSTM iki katmanlı; hidden size 64 ve sınıflandırma son zaman adımına dayanıyor;
            52.492 parametre. Final sürüm bidirectional ve tüm zaman adımlarının ortalaması ile
            maksimumunu yan yana koyuyor; buna mean/max pooling diyorum. Forget gate bias 1
            değeriyle başlatılıyor, girdi 9 kanal ve parametre sayısı 140.812.
          </Paragraph>
        </SubSection>
        <SubSection number="4.4" title="GRU">
          <Paragraph>
            Baseline GRU, LSTM ile birebir aynı iskelete sahip: iki katman, hidden size 64; 39.564
            parametre. Final sürüm bidirectional ve mean/max pooling kullanıyor. Gravity/body ayrımı
            GRU'da CV'de sonuç getirmediği için girdi 6 kanalda kaldı (Tablo 6); 105.228 parametre.
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
          Bu bölümde her adımda ne yaptığımı, ne elde ettiğimi ve hangi kararı verdiğimi
          anlatıyorum. Tüm sayısal değerler Bölüm 6'daki tablolarda yer alıyor.
        </Paragraph>

        <SubSection number="5.1" title="Veri setinin seçimi ve doğrulanması">
          <Step
            done="UCI #341 veri seti indirildi ve resmi dosyalar sayılarak doğrulandı."
            result="10.929 örnek, 30 kişi ve 12 sınıf mevcut. Bunların 7.767'si eğitim, 3.162'si test için ayrılmış (Tablo 1)."
            decision="Resmi kişi bazlı ayrımı olduğu gibi benimsiyorum: 21 eğitim ve 9 test kişisi."
          />
        </SubSection>

        <SubSection number="5.2" title="Ham window kuralı">
          <Step
            done="Resmi dosyalarda satırların ham window'larla eşleşmediğinden, ham sinyal modelleri için window'ları sıfırdan ürettim. Window'un en az %90'ının tek bir etiketli segmente denk gelmesi durumunu test ettim."
            result="Sonuçta 10.776 window çıktı; resmi sayıyla fark %1,4. Transition sınıflarında 471 window var, resmi dosyalarda ise 518 (Tablo 1)."
            decision="%90 kuralını benimsiyorum. MLP ile ham modellerin test kümeleri aynı kişilerden geliyor ama örnek sayıları farklı: 3.162 ve 3.124."
          />
        </SubSection>

        <SubSection number="5.3" title="Çalışma ortamı">
          <Step
            done="Tüm eğitimler Google Colab üzerinde GPU desteğiyle PyTorch ile gerçekleştirildi."
            result="Aynı yapılandırmayı iki kez (A1a ve K5) koştuğumda fark 0,002 çıktı (Tablo 6)."
            decision="Tüm koşular bu ortamda yapılıyor."
          />
        </SubSection>

        <SubSection number="5.4" title="İlk baseline">
          <Step
            done="Dört modeli ortak ve ince ayarı yapılmamış bir düzenle eğittim. 16 kişiyle 40 epoch eğitim yaptım, 5 kişilik validation seti üzerinden en iyi epoch'u seçtim ve 5 farklı seed ile koştum (Tablo 3). Ardından modelleri test kümesinde ölçtüm."
            result="Macro F1 değerleri MLP için 0,841, 1D CNN için 0,819, GRU için 0,786 ve LSTM için 0,666 (Tablo 4). LSTM tutarsız davrandı; std 0,094. En zayıf performans transition sınıflarındaydı; SITTING ve STANDING'de de ham modeller MLP'nin gerisinde kaldı (Tablo 5). Ham modellerin MLP'ye yenilmesini beklemiyordum."
            decision="Ham modelleri iyileştirmek için derinlemesine düşündüm."
          />
        </SubSection>

        <SubSection number="5.5" title="Yöntem düzeltmesi">
          <Step
            done="Kodun birkaç kritik noktasına odaklandım. Bunların hiçbiri doğrudan ölçüme dayanmıyordu, hepsi varsayıma bağlıydı. RNN'ler yeterince eğitilmemişti; gradient clipping ve warmup eksikti ve son zaman adımı kullanılıyordu. Model seçimi sonrasında 21 kişiyle yeniden eğitim yapılmıyordu. Küçük validation seti epoch seçimini gürültülü hâle getiriyordu. Ayrıca biraz yapay zekadan fikir aldıktan sonra şunları da fark ettim: gravity/body ayrımı ve augmentasyon yoktu, class weight ise fazla agresif ayarlanmıştı."
            result="Bir de yöntemsel bir sorun keşfettim. Baseline teşhisimi test kümesinin confusion matrix'ine ve sınıf F1 değerlerine bakarak koymuştum. Bu yaklaşımla devam etseydim test sonucu olduğundan iyi görünebilirdi; bu kabul edilebilir bir durum değil."
            decision="Bundan sonra her kararı yalnızca 21 eğitim kişisi üzerinde 5-fold kişi bazlı CV ile verdim; ölçüt out-of-fold macro F1. Test en sonda, sabitlenmiş düzenle tek sefer koşuldu. MLP'ye de aynı arama bütçesini ayırdım. Baseline koduna dokunmadım; yeni deneyleri ayrı ortamda yürüttüm."
          />
        </SubSection>

        <SubSection number="5.6" title="Baseline düzeninin CV ile ölçmek (A0)">
          <Step
            done="Baseline'ın düzenini CV altında yeniden ölçtüm. İki küçük değişiklik var: model seçimi son epoch ile yapıldı ve LSTM'de forget gate bias 1 ile başlatıldı."
            result="MLP 0,824, 1D CNN 0,807, GRU 0,776 ve LSTM 0,768 (Tablo 6). Testte gözlemlediğim LSTM düşüşü, yani 0,666, CV'de tekrarlanmadı."
            decision="Testteki LSTM sonucunun bir kısmının epoch seçimindeki şansa bağlı olduğu görülüyordu; bu yüzden bundan sonra CV değerlerini temel almaya karar verdim."
          />
        </SubSection>

        <SubSection number="5.7" title="Optimizasyon (A1)">
          <Step
            done="Epoch sayısını 100'e çıkardım, warmup ve gradient clipping ekledim. Öğrenme hızı olarak 1e-3 (A1a) ve 2e-3 (A1b) denedim. MLP'de ayrıca 5e-4, 200 epoch ve sqrt class weight kombinasyonlarını da test ettim."
            result="MLP 0,824'ten 0,845'e yükseldi; MLP'nin diğer denemeleri 0,838 ile 0,845 aralığında kaldı. Ham modellerde lr 2e-3, 1e-3'ten daha başarılıydı: CNN 0,822, LSTM 0,797, GRU 0,779 (Tablo 6). Yani baseline düzeni yalnızca ham modeller için değil, MLP için de yetersiz ayarlıydı."
            decision="Ham modeller için lr 2e-3, warmup ve clipping ortak taban oldu. MLP için A1a seçildi: 100 epoch ve lr 1e-3."
          />
        </SubSection>

        <SubSection number="5.8" title="RNN yapısı, pooling ve bidirectional">
          <Step
            done="A1a düzeni üzerinde son zaman adımı yerine mean/max pooling denedim; ardından buna çift yönlü (bidirectional) katmanlar ekledim."
            result="Tek başına mean/max pooling sonuç vermedi: LSTM 0,763, GRU 0,767. Bidirectional ile LSTM 0,787, GRU 0,789 oldu; A1a'ya göre sırasıyla 0,016 ve 0,022 artış (Tablo 6)."
            decision="RNN'lerde bidirectional ve mean/max pooling kullanılıyor."
          />
        </SubSection>

        <SubSection number="5.9" title="Gravity/body ayrımı (9 kanal)">
          <Step
            done="A1a düzeninde ivmeyi gravity ve body bileşenlerine ayırarak 9 kanallı girdi denedim."
            result="CNN 0,809'dan 0,827'ye çıktı; yani +0,018. LSTM +0,010, GRU ise -0,003 değişti (Tablo 6)."
            decision="CNN ve LSTM'de 9 kanalı kullanıyorum. GRU'da bir yarar göremediğim için onu ayrı tutuyorum."
          />
        </SubSection>

        <SubSection number="5.10" title="Derin CNN">
          <Step
            done="Dört bloklu, dilation içeren ve mean/max pooling uygulayan bir CNN denedim (Tablo 2)."
            result="0,809'dan 0,830'a çıktı, yani +0,021 (Tablo 6)."
            decision="Derin CNN'i benimsiyorum. Gravity ile bir araya getirince ortak taban C1 0,833 oldu."
          />
        </SubSection>

        <SubSection number="5.11" title="Feature mı, mimari mi? (MLP-raw)">
          <Step
            done="MLP'nin avantajı hazır feature'lardan mı yoksa mimariden mi kaynaklanıyor, bunu ayırt etmek için aynı MLP'yi düzleştirilmiş ham window'larla eğittim."
            result="MLP-raw 6 kanalla 0,803, 9 kanalla 0,808 elde etti. Aynı MLP, 561 feature ile 0,845 almıştı (Tablo 6)."
            decision="Bu düzende MLP'nin üstünlüğü büyük ölçüde mimariden değil, hazır feature'lardan geliyor. Bu kontrol deneyini finale kadar taşımaya karar verdim (Bölüm 5.13)."
          />
        </SubSection>

        <SubSection number="5.12" title="Augmentasyon ve yoğun window: 2 × 2 tasarım">
          <Step
            done="C1 tabanı üzerinde iki etkeni hem ayrı ayrı hem birlikte test ettim. K1'de yalnızca augmentasyon, adım 64. D1'de yalnızca yoğun window, adım 16. D2'de ikisi bir arada. D1 ve D2'de epoch 40 aldım; çünkü adım 16 ile bir epoch, adım 64'e kıyasla yaklaşık dört kat fazla window içeriyor."
            result="CNN'de C1 0,833 iken yalnızca augmentasyonla 0,849 (+0,016), yalnızca yoğun window ile 0,823, ikisi birden 0,855 oldu. LSTM ve GRU'da D1 0,817 ve 0,811, D2 0,857 ve 0,845 (Tablo 6)."
            decision="CNN'de asıl sıçrama augmentasyondan geldi. Yoğun window tek başına karışık bir etki bıraktı; augmentasyonla birlikte sağladığı 0,006'lık ek katkı gürültü bandında kalıyor. LSTM ve GRU'da adım 64 ile augmentasyon ayrıca denenmediğinden bu iki etkeni birbirinden ayıramıyorum. Final düzen D2."
          />
        </SubSection>

        <SubSection number="5.13" title="Class weight ve MLP'ye eşit arama bütçesi">
          <Step
            done="CNN'de D2 üzerinde daha yumuşak sınıf ağırlığı (sqrt) denedim (E1s). MLP'ye eşit arama bütçesi vermek için feature'lara Gauss gürültüsü ekleyip A1a'yı yeniden koştum (K5). MLP-raw'ı da D2 düzeniyle eğittim (K2)."
            result="E1s 0,858 ± 0,003, D2 0,855 ± 0,010. Gürültü MLP'ye katkı sağlamadı (0,838 ve 0,843), K5 0,843 çıktı. MLP-raw D2 düzeniyle 0,840 oldu ve 561 feature'lı MLP'ye 0,005 yaklaştı (Tablo 6)."
            decision="CNN'de tutarlılık adına tam class weight'i muhafaza ettim; fark zaten gürültü bandı içinde. MLP için A1a sabitlendi. Feature bulgusunu yalnızca augmentasyonsuz karşılaştırma için geçerli kabul ediyorum."
          />
        </SubSection>

        <SubSection number="5.14" title="Ara değerlendirme ve dondurma">
          <Step
            done="Bu noktada tüm CV tablosunu ve kodu baştan sona inceleyip ikinci bir değerlendirme yaptım. Girdi temsilinin etkisi, baseline'ın yetersiz ayarlanması ve augmentasyonun CNN'e sağladığı katkı gürültünün çok ötesindeydi. CNN ile MLP arasındaki CV farkı (0,855 ve 0,845) ise gürültü bandı içindeydi."
            result="Seed standart sapması kişiden kaynaklanan belirsizliği içermiyordu. CV 21 kişiye, test ise 9 kişiye dayanıyordu."
            decision="Keşif aşamasını kapattım. Final yapılandırmalarını (Tablo 3) ve analiz planını, test koşusundan önce yazıp arşivledim. Birincil ölçüt test macro F1. 10 seed'in ortalaması ± std ve 10 seed'in olasılık ortalamasıyla ensemble şeklinde raporlanacaktı. Belirsizlik için 9 test kişisi üzerinde kişi bazlı bootstrap ile %95 güven aralığı (GA) hesaplanacak, MLP'ye kıyasla fark aynı örnekleme ile ölçülecekti. İddia eşiğim şu: bir ham model için 'MLP'yi geçti' diyebilmem için farkın GA'sı sıfırı kapsamamalı ve CV'de fark aynı yönde olmalı. Aksi takdirde 'karşılaştırılabilir düzeyde' ifadesini kullanıyorum."
          />
        </SubSection>

        <SubSection number="5.15" title="Final test koşusu">
          <Step
            done="Sabitlenmiş beş yapılandırmayı 21 eğitim kişisiyle 10 seed için eğitip test kümesinde tek sefer değerlendirdim."
            result="Ensemble macro F1 sonuçları şöyle: LSTM 0,928, 1D CNN 0,921, GRU 0,921, MLP 0,864 ve MLP-raw 0,862 (Tablo 7). MLP'ye kıyasla farklar Tablo 8'de, sınıf bazında sonuçlar Tablo 9'da."
            decision="Bu sonuçlar ve sabitlenmiş düzen bundan sonra değişmez. Bundan sonraki her deneyi ayrıca 'keşif amaçlı' olarak raporlayacağım."
          />
        </SubSection>
      </Section>

      <Section number="6" title="Eğitim ve Test Sonuçları" newPage>
        <SubSection number="6.1" title="İlk sonuçlar: baseline düzeni, test kümesi">
          <Paragraph>
            Tablo 4 ve Tablo 5, ilk baseline düzeninin test sonuçlarını veriyor. Bu düzen sonraki
            tabloların protokolünden farklı: 16 kişiyle, ince ayarı yapılmamış biçimde eğitildi ve
            epoch validation'a göre seçildi. Bu nedenle final sonuçlarla aynı tabloda sunmadım.
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
              Tablo 6, Bölüm 5'teki kararların dayandığı CV sonuçlarını içeriyor. Her hücre, 21
              eğitim kişisinde 5-fold kişi bazlı CV ile hesaplanan out-of-fold macro F1'in 3 seed
              ortalaması ± std'sidir. Seed std'si 0,002 ile 0,020 arasında değiştiğinden 0,01'in
              altındaki farkları gürültü olarak değerlendirdim.
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
            Tablo 7, final koşunun sonuçlarını içeriyor. Tekil model 10 seed'in ortalaması ± std,
            ensemble ise 10 seed'in olasılık ortalaması. GA'yı yalnızca ensemble için hesapladım;
            kişi örneklemeden gelen belirsizliği kapsıyor ama seed std'sini içermiyor. CV sütunu
            karşılaştırma için duruyor; ancak protokoller farklı: CV'de fold başına 16 ya da 17
            kişi, finalde 21 kişi eğitiliyor.
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
            Önceden koyduğum iddia eşiğinin iki koşulu var. Test kümesinde kişi bazlı farkın %95
            GA'sı sıfırı dışlamalı ve CV'de fark aynı yönde olmalı (Bölüm 5.14). 1D CNN ve LSTM
            ikisini de sağladı. Test farkları +0,056 [+0,026; +0,093] ve +0,063 [+0,029; +0,097], CV
            farkları +0,010 ve +0,012 (Tablo 8). Bu yüzden bu veri setinde ve bu eğitim düzeninde 1D
            CNN ve LSTM'nin test macro F1'de MLP'den yüksek olduğunu yazabiliyorum. CV farkları 0,01
            civarında ve tek başına gürültü bandında. Test farkı (yaklaşık 0,06) CV farkından büyük
            ve 9 kişilik test yüzünden GA geniş.
          </Paragraph>
          <Paragraph>
            GRU testte MLP'nin üzerinde, +0,055 [+0,024; +0,086]; ama CV'de iki model birbirinden
            ayrışamıyor, ikisi de 0,845 (Tablo 8). Eşik sağlanamadığından GRU hakkında
            söyleyebileceğim şu: testte MLP'den yüksek, CV'de ayırt edilemez. GRU'nun MLP'ye üstün
            geldiğini iddia etmiyorum.
          </Paragraph>
          <Paragraph>
            Ham modellerde ensemble, tekil seed ortalamasının üstüne çıktı: CNN 0,894'ten 0,921'e,
            LSTM 0,898'den 0,928'e, GRU 0,888'den 0,921'e. MLP'de artış küçük kaldı: 0,860'tan
            0,864'e (Tablo 7). Tekil ortalamalarda da üç ham model MLP'nin üstünde (0,888-0,898 ve
            0,860); fakat seed std'si kişi belirsizliğini kapsamadığı için bu fark için GA
            hesaplamadım.
          </Paragraph>
        </SubSection>
        <SubSection number="7.2" title="Feature mı, mimari mi?">
          <Paragraph>
            MLP-raw kontrolünün sonucu eğitim düzenine göre şekilleniyor. Augmentasyonsuz koşullarda
            aynı MLP, 6 kanalda 0,803, 9 kanalda 0,808, 561 feature ile 0,845 aldı (Tablo 6). Yani
            bu koşullarda MLP'nin üstünlüğü büyük ölçüde hazır feature'lardan kaynaklanıyordu.
            Gravity, yoğun window ve augmentasyonla MLP-raw 0,840'a yükseldi ve fark 0,005'e indi.
            Testte de MLP-raw ile MLP birbirinden ayrışamıyor: fark -0,005 [-0,055; +0,043] (Tablo
            8). Bu yüzden "MLP'nin üstünlüğü hazır feature'lardan geliyor" demek yalnızca
            augmentasyonsuz karşılaştırma için geçerli.
          </Paragraph>
          <Paragraph>
            Macro F1'deki bu denklik, iki modelin aynı hataları ürettiği anlamına gelmiyor.
            MLP-raw'ın accuracy'si daha düşük: 0,914 ve 0,940 (Tablo 7). SITTING ve STANDING'de de
            zayıf kalıyor; F1 değerleri 0,799 ve 0,835, MLP'de bu rakamlar 0,920 ve 0,931 (Tablo 9).
            Denkliğin kaynağı MLP-raw'ın transition sınıflarındaki daha yüksek ortalaması: 0,801 ve
            0,776. Aynı ham girdiyle çalışan 1D CNN, LSTM ve GRU'nun testte MLP-raw'ın üstünde
            olması (Tablo 7), ham girdi üzerinde mimarinin de etkili olduğuyla uyumlu. Ne var ki bu
            fark için eşleştirilmiş bir test yapmadım.
          </Paragraph>
        </SubSection>
        <SubSection number="7.3" title="Sınıflar: temel aktiviteler ve transition'lar">
          <Paragraph>
            Ham sinyal modelleri hem temel aktivitelerde hem transition sınıflarında MLP'nin önünde
            (Tablo 9). Temel aktivitelerde ortalama F1 0,979-0,984 aralığında, MLP'de 0,952.
            Transition sınıflarında ise 0,858-0,874, MLP'de 0,776. En zayıf halka yine SIT_TO_LIE ve
            STAND_TO_LIE. Confusion matrix'lerde bu iki sınıfın birbirine karıştığı görülüyor.
            MLP'de SIT_TO_LIE örneklerinin 0,28'i STAND_TO_LIE olarak, LSTM'de STAND_TO_LIE
            örneklerinin 0,22'si SIT_TO_LIE olarak tahmin edildi (Şekil 3 ve 6). İki hareket de
            yatarak bittiğinden bu benzerlik karışmayla örtüşüyor. MLP'de SITTING örneklerinin
            0,11'i STANDING'e kayarken, LSTM'de bu oran 0,06.
          </Paragraph>
          <Paragraph>
            Transition sınıfları test kümesinde çok az örneğe dayanıyor; ham modellerde toplam 157
            window (Tablo 1). Bu yüzden sınıf bazındaki farkları kesin bir dille yorumlamamak
            gerekiyor. Örneğin LIE_TO_SIT'te LSTM 0,950, CNN 0,826 aldı (Tablo 9); ancak bu sınıfın
            resmi test kümesinde yalnızca 25 örneği bulunuyor (Şekil 1).
          </Paragraph>
        </SubSection>
        <SubSection number="7.4" title="İlk sonuçlarla ilişki">
          <Paragraph>
            İlk baseline'da sıralama MLP, 1D CNN, GRU, LSTM şeklindeydi (Tablo 4). Final düzeninde
            ise ham sinyal modelleri MLP'nin önüne geçti (Tablo 7). İki tabloyu doğrudan kıyaslamak
            mümkün değil çünkü protokoller farklı. Baseline 16 kişiyle ve validation'a göre seçilen
            epoch ile eğitilirken final 21 kişiyle ve sabit epoch ile eğitildi; ayarlar da farklı.
            Aynı CV protokolünde LSTM, A0'da 0,768'den D2'de 0,857'ye yükseldi (Tablo 6).
            Sıralamadaki değişim eğitim düzenindeki iyileştirmelerle uyumlu görünüyor.
          </Paragraph>
        </SubSection>
      </Section>

      <Section number="8" title="Gerçek Telefon Sensör Verileriyle Ek Testler">
        <Paragraph>
          Bu test gerçekleştirilmedi. Bu bölüm planlanan çalışmayı ve bir sınırlılığı açıklıyor.
          Raporda gerçek telefon verisiyle elde edilmiş bir sonuç bulunmuyor; canlı bir demo da
          sunulmadı.
        </Paragraph>
        <Paragraph>
          Plan şöyle: hazır bir sensör kayıt uygulamasıyla, telefon beldeyken accelerometer ve
          gyroscope 50 Hz'de kaydedilecek. Etiketler önceden belirlenmiş bir aktivite sırasına ve
          zamanlamasına göre atanacak. Kayıt, eğitim verisine uyumlu hâle getirilecek; birimler veri
          setindekiyle aynı olacak ve telefonun eksenleri veri setinin eksen yönleriyle hizalanacak.
          Ardından aynı window kuralı, gravity/body ayrımı ve eğitim kümesi istatistikleriyle
          standardizasyon uygulanacak.
        </Paragraph>
        <Paragraph>
          Değerlendirme çevrimdışı yapılacak ve yalnızca ham sinyal modelleri olan 1D CNN, LSTM ve
          GRU ile sınırlı kalacak. MLP planın dışında; çünkü resmi 561 feature hattını sıfırdan
          kurmak gerekiyor. Telefon, takma biçimi ve kişi farklı olacağı için performansın test
          kümesindekinden geride kalması olası. Ne kadar geride olacağını ölçmeden kestiremem.
        </Paragraph>
      </Section>

      <Section number="9" title="Sonuçlar ve Değerlendirme">
        <SubSection number="9.1" title="Yazılabilir iddialar">
          <BulletList
            items={[
              "UCI #341 veri setinde, kişi bazlı CV ile seçilip sabitlenen düzende 1D CNN ve LSTM, test macro F1'de 561 feature'lı MLP'nin üstüne çıktı. Ensemble değerleri 0,921 ve 0,928, MLP 0,864. Kişi bazlı farkın GA'sı sıfırı kapsamıyor ve CV aynı yönde (Tablo 7 ve 8).",
              "GRU testte MLP'den yüksek, CV'de ayırt edilemiyor (Tablo 8).",
              "Augmentasyonsuz düzende MLP'nin avantajı büyük ölçüde hazır feature'lardan kaynaklanıyordu. Augmentasyon ve yoğun window ile ham girdili aynı MLP bu farkı CV'de 0,005'e indirdi, testte de iki modeli birbirinden ayırt edilemez hâle getirdi (Tablo 6 ve 8).",
              "1D CNN'de en büyük CV kazancı augmentasyondan geldi, +0,016 (Tablo 6). İlk baseline tüm modeller için yetersiz ayarlıydı; MLP bile 0,824'ten 0,845'e çıktı (Tablo 6).",
            ]}
          />
        </SubSection>
        <SubSection number="9.2" title="Yazılamaz iddialar">
          <BulletList
            items={[
              "Ham sinyal modellerinin genel anlamda feature tabanlı modellerden üstün olduğunu söyleyemem. Sonuç tek bir veri setine, tek bir MLP'ye ve sınırlı bir aramaya dayanıyor.",
              "GRU'nun MLP'den üstün olduğunu söyleyemem; eşik karşılanmadı. LSTM, CNN ve GRU arasında bir sıralama da yapamam; GA'lar örtüşüyor (Tablo 7).",
              "Gerçek telefon verisinde ya da canlı kullanımdaki performans hakkında bir şey söyleyemem; bu test yapılmadı (Bölüm 8).",
            ]}
          />
        </SubSection>
        <SubSection number="9.3" title="Sınırlılıklar">
          <BulletList
            items={[
              "Test kümesi 9 kişiden oluşuyor. Kişi bazlı bootstrap GA'ları geniş; az sayıda kişiden yeniden örnekleme yapıldığı için biraz iyimser de olabilir (Tablo 7).",
              "MLP ile ham modellerin test kümeleri birebir özdeş değil: 3.162 ve 3.124 örnek (Tablo 1). Bootstrap aynı kişileri örnekliyor ama aynı window'ları değil.",
              "Test değerleri CV'nin üstünde: MLP'de +0,015, ham modellerde yaklaşık +0,04 (Tablo 7). Bunun nedeni finalde 21 kişiyle eğitim olabilir, ham modellerin ek kişiden daha fazla yararlanması olabilir ya da test kişilerinin daha kolay olması olabilir. Bu deneylerle bu olasılıkları birbirinden ayıramadım.",
              "Hiperparametre araması dardı. Her seçenek 3 seed ile ve tek tek test edildi; kapsamlı bir ızgara taraması yapılmadı (Tablo 6).",
              "İlk baseline'ın sorunlarını test sonuçlarına bakarak teşhis ettim (Bölüm 5.5). Sonraki kararları yalnızca CV ile verdim; ancak araştırmanın yönü bu ilk bakıştan etkilenmiş olabilir.",
              "Resmi 561 feature'ın [-1, 1] normalizasyonunun test kişilerini de kapsayıp kapsamadığını doğrulayamadım (Bölüm 2.6).",
            ]}
          />
        </SubSection>
      </Section>
    </Document>
  ),
};
