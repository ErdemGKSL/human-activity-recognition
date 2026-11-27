import { defineDeck } from "@pptx/core";

/**
 * 3. Sunum – Final Results (20–30 dk, sunum 30.11.2026 veya 07.12.2026; tarih
 * kesinleşmediği için kapakta tarih yok). Slaytlar yalnızca sayıları taşır;
 * anlatım, iddia eşikleri ve olası sorular
 * `slide-directions/src/directions/final-results.ts` içindedir.
 * Her sayı `report/src/documents/final-results.tsx` (Tablo 1–9) ile aynıdır.
 * Telefonda doğruluk ölçülmedi (rapor Bölüm 8): demo slaytı ölçülmüş sonuç
 * iddia etmez.
 */
export const finalResults = defineDeck({
  id: "final-results",
  title: "Nöral Ağlarla İnsan Aktivitesi Tanıma · Final Results",
  lang: "tr-TR",
  transition: { effect: "fade", duration: 0.5 },
  slides: [
    {
      id: "cover",
      layout: "cover",
      title: "Akıllı Telefon Sensörleriyle Nöral Ağları Kullanarak İnsan Aktivitesi Tanıma",
      subtitle: "Final Sonuçlarımız · BİL 512 Yapay Sinir Ağları",
      presenter: "Erdem Göksel · 261402103",
      instructor: "Öğretim Üyesi: Cem CANTEKİN",
      animate: false,
    },
    {
      id: "agenda",
      layout: "agenda",
      title: "Gündem",
      items: [
        "Problemimiz, veri setimiz ve modeller",
        "Yöntem: CV, dondurma, bootstrap",
        "İzlenen yol",
        "İlk sonuçlar ve final test sonuçları",
        "Modellerin kıyas edilmesi",
        "Canlı demo (apk)",
        "Sonuçlar ve sınırlılıklar",
      ],
    },
    {
      id: "overview",
      layout: "bullets",
      title: "Proje Özeti",
      lead: "Bele takılı telefonun sensörlerinden 12 sınıflı aktivite tanıma.",
      points: [
        "MLP: veri setinden hazır 561 feature",
        "1D CNN, GRU, LSTM: ham sinyal window'ları",
        "MLP-raw: aynı MLP, ham girdiyle (kontrol amaçlı)",
        "Ana metriğimiz: test macro F1",
      ],
      highlights: [
        { label: "Sınıf", value: "12", delta: "6 aktivite ve 6 transition" },
        { label: "Gönüllü", value: "30", delta: "21 eğitim · 9 test" },
        { label: "Model", value: "4 + 1", delta: "+ MLP-raw kontrolü" },
      ],
    },
    {
      id: "data",
      layout: "bullets",
      title: "Veri Seti ve Ön İşleme",
      lead: "UCI #341 (HAPT): accelerometer + gyroscope, 50 Hz",
      points: [
        "Window: 128 ölçüm (2,56 sn), adım 64",
        "Gravity ve body ayrımı: 0,3 Hz; low-pass filter; 9 kanal",
        "Augmentasyon: ±12° rotation, 0,9-1,1 scaling",
      ],
      highlightsLabel: "Örnek adedimiz",
      highlights: [
        { label: "MLP'de kullanılacak 561 feature", value: "10.929", delta: "test: 3.162" },
        { label: "Üretilen ham window", value: "10.776", delta: "test: 3.124" },
      ],
    },
    {
      id: "class-balance",
      layout: "metrics",
      title: "Sınıf Dengesizliği",
      metrics: [
        { label: "En büyük sınıf (eğitim)", value: "1.423", delta: "STANDING" },
        { label: "En küçük sınıf (eğitim)", value: "23", delta: "SIT_TO_STAND" },
        { label: "Oran", value: "~62×", delta: "birincil metrik: macro F1" },
        { label: "Transition (test)", value: "10-49", delta: "örnek / sınıf" },
      ],
    },
    {
      id: "models",
      layout: "table",
      title: "Final Mimariler",
      columns: ["Model", "Girdi", "Yapı", "Parametre"],
      rows: [
        ["MLP", "561 feature", "256-128", "178.316"],
        ["MLP-raw", "128 × 9 ham", "256-128", "329.612"],
        ["1D CNN", "9 kanal", "4 blok, dilation 2", "138.700"],
        ["LSTM", "9 kanal", "BiLSTM, mean/max", "140.812"],
        ["GRU", "6 kanal", "BiGRU, mean/max", "105.228"],
      ],
    },
    {
      id: "method",
      layout: "flow",
      title: "Yöntem Düzeltmesi",
      lead: "İlk başta baseline'ın test sonuçlarına bakıldı; sonraki kararlar yalnızca CV'yle yapılacaktır.",
      steps: [
        { label: "Baseline", items: ["Test'e bakıldı"], tone: "accent" },
        { label: "5-fold CV", items: ["21 eğitim kişisi", "3 seed"] },
        { label: "Dondurma", items: ["Düzen + plan", "commit"] },
        { label: "Final test", items: ["10 seed", "tek koşu"] },
        { label: "Bootstrap", items: ["9 kişi", "B = 2.000"] },
      ],
      points: [
        "İddia eşiğimiz: eşleştirilmiş farkın %95 GA'sı sıfırı dışlamalı ve CV aynı yönde olmalı.",
      ],
    },
    {
      id: "journey",
      layout: "table",
      title: "İzlenen Yol (CV macro F1)",
      columns: ["Adım", "Model", "Önce", "Sonra"],
      rows: [
        ["Optimizasyon (A1)", "MLP", "0,824", "0,845"],
        ["Bidirectional + mean/max", "LSTM", "0,771", "0,787"],
        ["Derin CNN", "1D CNN", "0,809", "0,830"],
        ["Augmentasyon (K1)", "1D CNN", "0,833", "0,849"],
        ["Aug. + yoğun window (D2)", "MLP-raw", "0,808", "0,840"],
        ["Tüm adımlar: A0 ve D2", "LSTM", "0,768", "0,857"],
      ],
    },
    {
      id: "baseline",
      layout: "bar-chart",
      title: "İlk Sonuçlar: Baseline (test macro F1)",
      caption:
        "İlk sonuçlar · 16 kişiyle eğitim, ayarsız düzen, 5 seed ortalaması · LSTM std 0,094",
      data: [
        { label: "MLP", value: 0.841 },
        { label: "1D CNN", value: 0.819 },
        { label: "GRU", value: 0.786 },
        { label: "LSTM", value: 0.666 },
      ],
    },
    {
      id: "final-chart",
      layout: "bar-chart",
      title: "Final Test: Ensemble Macro F1",
      caption:
        "Dondurulmuş düzen · 10 seed'in olasılık ortalaması · 9 test kişisi · mavi: MLP baseline",
      data: [
        { label: "MLP", value: 0.864 },
        { label: "MLP-raw", value: 0.862 },
        { label: "1D CNN", value: 0.921 },
        { label: "LSTM", value: 0.928 },
        { label: "GRU", value: 0.921 },
      ],
    },
    {
      id: "final-table",
      layout: "table",
      title: "Final Test Sonuçları",
      columns: ["Model", "Macro F1 (10 seed)", "Ensemble", "%95 GA", "Ens. accuracy"],
      rows: [
        ["MLP", "0,860 ± 0,004", "0,864", "[0,823; 0,899]", "0,941"],
        ["MLP-raw", "0,862 ± 0,006", "0,862", "[0,793; 0,907]", "0,914"],
        ["1D CNN", "0,894 ± 0,011", "0,921", "[0,888; 0,947]", "0,972"],
        ["LSTM", "0,898 ± 0,010", "0,928", "[0,888; 0,955]", "0,975"],
        ["GRU", "0,888 ± 0,008", "0,921", "[0,874; 0,951]", "0,976"],
      ],
    },
    {
      id: "comparison",
      layout: "table",
      title: "MLP'ye Göre Fark (ensemble macro F1)",
      columns: ["Model", "Test farkı", "%95 GA", "CV farkı", "Sonuç"],
      rows: [
        ["1D CNN", "+0,056", "[+0,026; +0,093]", "+0,010", "MLP'den yüksek"],
        ["LSTM", "+0,063", "[+0,029; +0,097]", "+0,012", "MLP'den yüksek"],
        ["GRU", "+0,055", "[+0,024; +0,086]", "0,000", "Eşik sağlanmadı"],
        ["MLP-raw", "-0,005", "[-0,055; +0,043]", "-0,005", "Ayırt edilemez"],
      ],
    },
    {
      id: "feature-vs-arch",
      layout: "metrics",
      title: "Feature mı, yoksa Mimari mi? (MLP-raw)",
      metrics: [
        { label: "MLP-raw, aug. yok", value: "0,808", delta: "CV macro F1" },
        { label: "MLP-raw, aug. var", value: "0,840", tone: "positive", delta: "CV macro F1" },
        { label: "MLP, 561 feature", value: "0,845", delta: "CV macro F1" },
        { label: "MLP-raw, test", value: "0,914", tone: "negative", delta: "accuracy; MLP 0,940" },
      ],
    },
    {
      id: "per-class",
      layout: "table",
      title: "Sınıf Bazlı Test F1 (ensemble)",
      columns: ["Sınıf", "MLP", "MLP-raw", "1D CNN", "LSTM", "GRU"],
      rows: [
        ["Aktivite ort.", "0,952", "0,924", "0,979", "0,982", "0,984"],
        ["Transition ort.", "0,776", "0,801", "0,863", "0,874", "0,858"],
        ["SITTING", "0,920", "0,799", "0,957", "0,961", "0,968"],
        ["SIT_TO_LIE", "0,688", "0,725", "0,794", "0,750", "0,767"],
      ],
    },
    {
      id: "demo",
      layout: "bullets",
      title: "Canlı Demo: Android",
      lead: "Telefonda deneyebilirsiniz.",
      points: [
        "Kotlin, bağımlılıksız GRU çıkarımı",
        "Her 1,28 sn'de 2,56 sn'lik window, 12 sınıf",
        "Kalibrasyon: ayakta, oturma, yatma",
        "Telefon belinizde dik bir pozisyonda durmalıdır",
      ],
      highlightsLabel: "Akış",
      highlights: [
        { label: "1", value: "Kalibre et" },
        { label: "2", value: "Yürü, otur, kalk" },
        { label: "3", value: "Tahmini izle" },
      ],
    },
    {
      id: "conclusion",
      layout: "bullets",
      title: "Sonuçlar",
      points: [
        "1D CNN ve LSTM test macro F1'de MLP'den daha yüksek (0,921 ve 0,928; MLP 0,864)",
        "GRU: testte daha yüksek, CV'de ayırt edilemeyecek düzeyde küçük fark",
        "Augmentasyonsuz düzende MLP'nin avantajı büyük ölçüde hazır feature'lardan",
        "1D CNN'de en büyük CV kazancı augmentasyondan (+0,016)",
      ],
    },
    {
      id: "limitations",
      layout: "bullets",
      title: "Sınırlılıklar",
      points: [
        "9 test kişisi: güven aralıkları geniş",
        "Test kümeleri birebir aynı değil (3.162 ve 3.124)",
        "Test, CV'den yüksek; sebebi ayrılamadı",
        "İlk baseline'da test sonuçlarına bakıldı",
        "Gerçek telefon testi yapılmadı",
      ],
    },
    {
      id: "closing",
      layout: "closing",
      title: "Teşekkürler",
      subtitle: "Sorularınız",
    },
  ],
});
