import { defineDeck } from "@pptx/core";

/**
 * 1. Sunum – Project Proposal (5–10 dk, 19.10.2026). Slaytlar az metin taşır;
 * ayrıntılı anlatım, olası sorular ve açılış konuşması
 * `slide-directions/src/directions/proposal.ts` içindedir.
 * Henüz deney yapılmadı: sonuçlar kesinmiş gibi yazılmaz.
 */
export const proposal = defineDeck({
  id: "proposal",
  title: "Nöral Ağlarla İnsan Aktivitesi Tanıma · Proje Önerisi",
  lang: "tr-TR",
  transition: { effect: "fade", duration: 0.5 },
  slides: [
    {
      id: "cover",
      layout: "cover",
      title: "Akıllı Telefon Sensörleri Kullanılarak Nöral Ağlarla İnsan Aktivitesi Tanıma",
      subtitle: "Proje Önerisi · BİL 512 Yapay Sinir Ağları",
      presenter: "Erdem Göksel · 261402103",
      date: "19.10.2026",
      animate: false,
      notes:
        "Projemiz, telefonun hareket sensörlerinden gelen sinyallerle kişinin ne yaptığını nöral ağlarla tanımayı amaçlıyor. Bugün problemi, veri setini ve planladığımız yöntemi kısaca sunacağız.",
    },
    {
      id: "problem",
      layout: "bullets",
      title: "Problem Tanımı",
      lead: "Ham sensör sinyali, hangi aktivitenin yapıldığını doğrudan söylemez.",
      points: [
        "Accelerometer ve gyroscope, saniyede 50 ölçümlük 6 kanallı bir time-series üretir",
        "Oturma ve ayakta durma gibi durağan aktivitelerin sinyalleri birbirine benzer",
        "Hareket biçimi kişiden kişiye farklılık gösterir",
        "Projenin sorusu: bu veriye hangi nöral ağ mimarisi daha uygun?",
      ],
      highlightsLabel: "Girdi",
      highlights: [
        { label: "Sensör", value: "2", delta: "accelerometer + gyroscope" },
        { label: "Kanal", value: "6", delta: "her sensörde 3 eksen" },
        { label: "Temel aktivite", value: "6", delta: "yürüme, oturma, uzanma…" },
      ],
      notes:
        "Telefon üç eksende ivme ve açısal hız ölçüyor, ama bu sayılar tek başına 'yürüyor' ya da 'oturuyor' demiyor. Durağan aktivitelerin sinyalleri birbirine benziyor; bu sınıfların karışması bekleniyor.",
    },
    {
      id: "goal",
      layout: "bullets",
      title: "Projenin Amacı ve Motivasyonu",
      lead: "Amaç: dört mimariyi aynı veri ayrımı ve aynı metriklerle karşılaştırmak.",
      pointsLabel: "Araştırma soruları",
      points: [
        "Dört mimari, aynı test kümesinde aktivite sınıflandırmasında nasıl performans gösterecek?",
        "Time-series yapısını doğrudan kullanan 1D CNN, LSTM ve GRU, MLP referans modelinden ne kadar farklı sonuç verecek?",
        "Modeller, görülmemiş gerçek bir kullanıcının verisine ne kadar genellenebilecek?",
        "Hangi aktiviteler birbirine daha çok karışacak?",
      ],
      highlightsLabel: "Motivasyon",
      highlights: [
        { label: "Sağlık", value: "İzleme", delta: "yaşlı ve hasta takibi" },
        { label: "Spor", value: "Takip", delta: "aktivite ve egzersiz" },
        {
          label: "Akıllı cihazlar",
          value: "Bağlam",
          delta: "kullanıcıya uyum sağlayan uygulamalar",
        },
      ],
      notes:
        "Projenin çıktısı tek bir model değil, dört mimarinin aynı veri ayrımı ve aynı metriklerle karşılaştırılması olacak. Sonraki raporlar da bu dört soruya göre düzenlenecek.",
    },
    {
      id: "dataset",
      layout: "bullets",
      title: "Kullanılacak Veri Seti",
      lead: "UCI ML Repository: Smartphone-Based Recognition of Human Activities and Postural Transitions",
      points: [
        "Bele takılı telefondan 3 eksenli accelerometer ve gyroscope sinyalleri",
        "50 Hz örnekleme; 2,56 saniyelik (128 ölçüm), %50 örtüşen pencereler",
        "Katılımcı bazlı ayrım: gönüllülerin %70'i eğitim, %30'u test",
        "Temel hedef 6 aktivite; geçiş sınıflarının kullanımı ayrıca değerlendirilecektir",
      ],
      highlights: [
        { label: "Katılımcı", value: "30", delta: "19–48 yaş arası" },
        { label: "Etiket", value: "12", delta: "6 aktivite + 6 duruş geçişi" },
        { label: "Örnek", value: "10.929", delta: "her biri 561 öznitelik" },
      ],
      notes:
        "Veri seti, bellerinde telefon taşıyan 30 gönüllünün kayıtlarından oluşuyor. Test kümesindeki kişiler eğitimde hiç görülmediği için sonuçlar yeni kullanıcılara genellemeyi ölçecek.",
    },
    {
      id: "method",
      layout: "flow",
      title: "Önerilen Yöntem",
      lead: "Veriden gerçek kullanıcı testine beş adım",
      steps: [
        { label: "Veri", items: ["Accelerometer", "Gyroscope", "UCI veri seti"] },
        { label: "Ön İşleme", items: ["Filtreleme", "Pencereleme", "Normalizasyon"] },
        { label: "Modelleme", items: ["MLP", "1D CNN", "LSTM", "GRU"] },
        { label: "Değerlendirme", items: ["Test kümesi", "Metrikler", "Hata analizi"] },
        { label: "Gerçek Veri", items: ["Kendi telefonumuz", "Yeni kullanıcı"], tone: "accent" },
      ],
      points: [
        "Tüm modeller aynı katılımcı ayrımı ve aynı metriklerle değerlendirilecektir",
        "MLP öznitelik vektörleriyle, diğer modeller ham sinyal pencereleriyle beslenecektir",
      ],
      notes:
        "Veri ayrımı ve metrikler dört model için ortak olacak. MLP'nin girdisi hazır öznitelikler olduğundan, MLP ile diğer modeller arasındaki fark hem mimariden hem girdi temsilinden gelecek. Son adımda modelleri kendi telefonumuzla topladığımız verilerle sınayacağız.",
    },
    {
      id: "architectures",
      layout: "table",
      title: "Kullanılacak Nöral Ağ Mimarileri",
      columns: ["Model", "Girdi", "Yakalaması beklenen yapı", "Projedeki rolü"],
      rows: [
        [
          "MLP",
          "561 öznitelik vektörü",
          "Özniteliklerin doğrusal olmayan birleşimi",
          "Referans model",
        ],
        ["1D CNN", "Ham pencere (128 × 6)", "Kısa, yerel zamansal örüntüler", "Evrişimli model"],
        [
          "LSTM",
          "Ham pencere (128 × 6)",
          "Uzun süreli zamansal bağımlılıklar",
          "Tekrarlayan model",
        ],
        [
          "GRU",
          "Ham pencere (128 × 6)",
          "LSTM'e benzer, daha az parametre",
          "Hafif tekrarlayan model",
        ],
      ],
      notes:
        "MLP sinyalin zaman sırasını görmediği için hazır özniteliklerle referans model olacak. 1D CNN yerel örüntüleri, LSTM ve GRU ise zaman içindeki bağımlılıkları doğrudan öğrenecek.",
    },
    {
      id: "evaluation",
      layout: "table",
      title: "Değerlendirme Yöntemi",
      columns: ["Metrik", "Sorduğu soru"],
      rows: [
        ["Accuracy", "Pencerelerin ne kadarı doğru sınıflandırıldı?"],
        ["Precision", "“Yürüme” tahminlerinin ne kadarı gerçekten yürüme?"],
        ["Recall", "Gerçek yürüme örneklerinin ne kadarı yakalandı?"],
        ["F1-score", "Precision ve Recall'un harmonik ortalaması (macro)"],
        ["Confusion Matrix", "Hangi aktiviteler birbirine karışıyor?"],
      ],
      notes:
        "Accuracy tek başına sınıf bazındaki hataları göstermez ve az örnekli duruş geçişlerini gizleyebilir. Bu yüzden sınıf bazında Precision, Recall ve F1 de raporlanacak. Confusion Matrix, dördüncü araştırma sorusunun cevabını verecek.",
    },
    {
      id: "outcomes",
      layout: "bullets",
      title: "Beklenen Çıktılar ve Projenin Katkısı",
      points: [
        "Dört mimarinin aynı veri ayrımı ve metriklerle karşılaştırılması",
        "Sınıf bazında hata analizi: hangi aktiviteler karışıyor, neden?",
        "Gerçek kullanıcı verisinde genelleme başarısının ölçülmesi",
        "Yeniden üretilebilir kod ve deney düzeneği",
      ],
      highlights: [
        { label: "Model", value: "4", delta: "MLP · 1D CNN · LSTM · GRU" },
        { label: "Metrik", value: "5", delta: "Accuracy'den Confusion Matrix'e" },
        { label: "Veri kaynağı", value: "2", delta: "UCI veri seti + gerçek telefon" },
      ],
      notes:
        "Katkımız yeni bir mimari değil. Dört mimarinin kontrollü bir karşılaştırmasını ve gerçek telefon verisiyle bir genelleme testini hedefliyoruz.",
    },
    {
      id: "plan",
      layout: "table",
      title: "Çalışma Planı ve Sonraki Adımlar",
      columns: ["Aşama", "Tarih", "Çıktı"],
      rows: [
        ["Proje önerisi", "19.10.2026", "Bu sunum"],
        ["Literatür taraması", "01.11 – 09.11.2026", "Rapor ve 2. sunum"],
        ["Ön işleme ve model eğitimi", "Kasım 2026", "Dört modelin deneyleri"],
        ["Gerçek telefon verisi", "Kasım 2026", "Ek genelleme deneyi"],
        ["Final raporu ve sunumu", "29.11 – 07.12.2026", "Rapor, 3. sunum ve demo"],
      ],
      notes:
        "Sıradaki adım literatür taraması; ardından Kasım ayında deneyleri ve gerçek telefon testini tamamlamayı planlıyoruz.",
    },
    {
      id: "closing",
      layout: "closing",
      title: "Teşekkürler",
      subtitle: "Sorularınız ve önerileriniz",
      notes: "Dinlediğiniz için teşekkürler; soru ve önerilerinizi bekliyoruz.",
    },
  ],
});
