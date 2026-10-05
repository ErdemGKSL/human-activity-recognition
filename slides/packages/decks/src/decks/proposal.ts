import { defineDeck } from "@pptx/core";

/**
 * 1. Sunum – Project Proposal (5–10 dk, sunum 19.10.2026; teslim 18.10.2026 23:55,
 * yalnızca sunumun PDF'i yüklenir: `bun run generate proposal --pdf`).
 * İstenen içerik: problemin tarifi ve önemi, veri seti, ANN modelleri, sonuç
 * beklentileri. Slaytlar az metin taşır;
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
      instructor: "Öğretim Üyesi: Cem CANTEKİN",
      date: "19.10.2026",
      animate: false,
      notes:
        "Projemiz, telefonun hareket sensörlerinden gelen sinyallerle kişinin ne yaptığını nöral ağlarla tanımayı amaçlıyor. Bugün problemi, veri setini ve planladığımız yöntemi kısaca sunacağız.",
    },
    {
      id: "problem",
      layout: "bullets",
      title: "Problem ve Önemi",
      points: [
        "Telefon sensörleri saniyede 50 ölçüm üretir (6 kanal).",
        "Problem, bu sinyalden 6 aktiviteyi ayırt etmektir.",
        "Oturma ve ayakta durma birbirine çok benzer.",
        "Aktivite tanıma, hasta takibi ve spor uygulamalarında kullanılır.",
      ],
      notes:
        "Telefon üç eksende ivme ve açısal hız ölçüyor, ama bu sayılar tek başına 'yürüyor' ya da 'oturuyor' demiyor. Aktivite tanıma; hasta ve yaşlı takibi, spor uygulamaları ve bağlama göre davranan cihazlar için girdi sağlıyor.",
    },
    {
      id: "goal",
      layout: "bullets",
      title: "Amaç ve Araştırma Soruları",
      lead: "Dört model aynı veriyle eğitilip karşılaştırılacak.",
      pointsLabel: "Araştırma soruları",
      points: [
        "Ham sinyal kullanan modeller MLP baseline'ını geçebilir mi?",
        "Hangi aktiviteler birbirine karışır?",
        "Modeller yeni bir kişide ne kadar başarılıdır?",
      ],
      notes:
        "Üç sorunun hepsine aynı deney düzeniyle bakacağız: aynı veri ayrımı, aynı metrikler. Sonraki raporları da bu sorulara göre yazacağız.",
    },
    {
      id: "dataset",
      layout: "bullets",
      title: "Kullanılacak Veri Seti",
      lead: "UCI ML Repository: Smartphone-Based Recognition of Human Activities and Postural Transitions",
      points: [
        "Veri, 30 gönüllüden bele takılı telefonla toplanmıştır.",
        "Sinyaller 50 Hz ile örneklenir ve 2,56 saniyelik window'lara bölünür.",
        "Veri setinde 10.929 örnek ve 12 etiket (6 aktivite, 6 postural transition) bulunur.",
        "Eğitim ve test kümeleri kişiye göre ayrılmıştır (%70 / %30).",
      ],
      notes:
        "Veri seti, bellerinde telefon taşıyan 30 gönüllünün kayıtlarından oluşuyor. Test kümesindeki kişiler eğitimde hiç görülmediği için sonuçlar yeni kullanıcılara genellemeyi ölçecek.",
    },
    {
      id: "method",
      layout: "flow",
      title: "Önerilen Yöntem",
      steps: [
        { label: "Veri", items: ["UCI veri seti"] },
        { label: "Ön İşleme", items: ["Filtreleme", "Windowing", "Normalizasyon"] },
        { label: "Modelleme", items: ["MLP", "1D CNN", "LSTM", "GRU"] },
        { label: "Değerlendirme", items: ["Test kümesi"] },
        { label: "Gerçek Veri", items: ["Kendi telefonumuz"], tone: "accent" },
      ],
      points: ["MLP hazır feature'ları, diğer modeller ham sinyali kullanır."],
      notes:
        "Veri ayrımı ve metrikler dört model için ortak olacak. MLP'nin girdisi hazır feature'lar olduğundan, MLP ile diğer modeller arasındaki fark hem mimariden hem input representation'ından gelecek. Son adımda modelleri kendi telefonumuzla topladığımız verilerle sınayacağız.",
    },
    {
      id: "architectures",
      layout: "table",
      title: "Kullanılacak ANN Modelleri",
      columns: ["Model", "Girdi", "Özellik"],
      rows: [
        ["MLP", "561 feature", "Baseline modeldir."],
        ["1D CNN", "Ham sinyal", "Kısa pattern'leri yakalar."],
        ["LSTM", "Ham sinyal", "Uzun temporal dependency'leri öğrenir."],
        ["GRU", "Ham sinyal", "LSTM'e benzer, daha az parametre kullanır."],
      ],
      notes:
        "MLP sinyalin zaman sırasını görmediği için hazır feature'larla baseline model olacak. 1D CNN yerel pattern'leri, LSTM ve GRU ise zaman içindeki bağımlılıkları doğrudan öğrenecek.",
    },
    {
      id: "evaluation",
      layout: "bullets",
      title: "Değerlendirme Yöntemi",
      points: [
        "Modeller Accuracy, Precision, Recall ve F1-score (macro) ile ölçülecek.",
        "Accuracy tek başına yeterli değildir, çünkü az örnekli sınıflardaki hataları gizler.",
        "Karışan aktiviteler Confusion Matrix ile incelenecek.",
      ],
      notes:
        "Accuracy tek başına sınıf bazındaki hataları göstermez ve az örnekli postural transition'ları gizleyebilir. Bu yüzden sınıf bazında Precision, Recall ve F1 de raporlanacak. İkinci araştırma sorusunun cevabını Confusion Matrix'te arayacağız.",
    },
    {
      id: "outcomes",
      layout: "bullets",
      title: "Sonuç Beklentileri",
      points: [
        "Ham sinyal kullanan modellerin MLP baseline'ına yakın sonuç vermesi beklenmektedir.",
        "En çok karışıklık oturma ile ayakta durma arasında beklenir.",
        "LSTM ve GRU'nun benzer sonuç vermesi, GRU'nun ise daha az hesaplama gerektirmesi beklenir.",
        "Kendi telefon verisinde başarı düşebilir.",
      ],
      notes:
        "Bunlar tahmin; gerçek sonuçları final sunumunda göstereceğiz. Katkımız yeni bir mimari değil, dört mimarinin kontrollü karşılaştırması ve gerçek telefon verisiyle bir genelleme testi.",
    },
    {
      id: "plan",
      layout: "table",
      title: "Çalışma Planı",
      columns: ["Aşama", "Tarih", "Çıktı"],
      rows: [
        ["Proje önerisi", "18.10 (PDF) · 19.10.2026", "Bu sunum"],
        ["Literatür taraması", "01.11 – 09.11.2026", "Rapor ve 2. sunum"],
        ["Ön işleme ve model eğitimi", "Kasım 2026", "Model deneyleri"],
        ["Gerçek telefon verisi", "Kasım 2026", "Genelleme testi"],
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
