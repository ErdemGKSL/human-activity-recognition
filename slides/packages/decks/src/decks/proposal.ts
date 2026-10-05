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
    },
    {
      id: "problem",
      layout: "bullets",
      title: "Problem ve Önemi",
      points: [
        "Telefon sensörleri 50 ölçüm/s üretir (6 farklı kanal).",
        "Çözeceğimiz problem, bu sinyallerden 6 aktiviteyi ayırt edebilmektir.",
        "Oturmak ve ayakta durma birbirine çok benzer, bunların ayırt edilebilmesi ayrı bir öneme sahiptir.",
        "Mevcut aktiviteyi tanıma ve spor uygulamalarında kullanılabilir.",
      ],
    },
    {
      id: "goal",
      layout: "bullets",
      title: "Amaç ve Araştırma Soruları",
      lead: "Dört farklı model aynı veriyle eğitilip karşılaştırılacaktır.",
      pointsLabel: "Araştırma soruları",
      points: [
        "Ham sinyal modelleri MLP baseline'ını geçebilecek mi?",
        "Birbirine karışma ihtimali olan aktiviteler hangileri?",
        "Kendimiz denersek (telefonla vs.) benzer sonuç alabilecek miyiz?",
      ],
    },
    {
      id: "dataset",
      layout: "bullets",
      title: "Kullanılacak Veri Seti",
      lead: "UCI ML Repository: Smartphone-Based Recognition of Human Activities and Postural Transitions",
      points: [
        "Veriler, gönüllülerden (30 tane) bele takılı telefonla toplanmıştır.",
        "50 Hz ile örneklenen sinyaller ve 2,56 saniyelik window'lara bölünmüştür.",
        "Veri setinde 10.929 örnek ve 12 etiket (6 aktivite, 6 postural transition) bulunur.",
      ],
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
      points: [
        "MLP veri setindeki hazır feature'ları, diğer modeller ise direkt sinyalleri kullanır.",
      ],
    },
    {
      id: "architectures",
      layout: "table",
      title: "Kullanılacak ANN Modelleri",
      columns: ["Model", "Girdi", "Özellik"],
      rows: [
        ["MLP", "561 feature", "Baseline modeli"],
        ["1D CNN", "Ham sinyal", "Kısa patternleri yakalar."],
        ["LSTM", "Ham sinyal", "Uzun temporal dependency'leri öğrenen"],
        ["GRU", "Ham sinyal", "LSTM'e benziyor fakat, daha az parametre kullanır."],
      ],
    },
    {
      id: "evaluation",
      layout: "bullets",
      title: "Değerlendirme Yöntemi",
      points: [
        "Modeller, Accuracy, Precision, Recall ve F1-score (macro) ile ölçülecek.",
        "Accuracy önemli fakat tek başına yeterli değildir, çünkü az örnekli sınıflardaki hataları es geçer.",
        "Karışan aktiviteler Confusion Matrix’le incelenecektir.",
      ],
    },
    {
      id: "outcomes",
      layout: "bullets",
      title: "Sonuç Beklentileri",
      points: [
        "Ham sinyal kullanan modellerin de MLP baselineına yakın sonuç vermesi beklenmektedir.",
        "En çok karışıklık ise oturma ile ayakta durma arasında bekleniyor.",
        "LSTM ve GRU'nun benzer sonuç vermesi, GRU'nun optimize olmasından dolayı daha az hesaplama gerektirmesi beklenir.",
        "Telefon testimizde başarı, telefon modeli ve yapısı gereği düşmesi beklenmektedir.",
      ],
    },
    {
      id: "closing",
      layout: "closing",
      title: "Teşekkürler",
      subtitle: "Sorularınız ve önerileriniz",
    },
  ],
});
