import { defineDeck } from "./types";

/**
 * 2. Sunum – Literatür Taraması (tarih 01.11.2026).
 * Kısa bir anlatı (narrative) taramasıdır: 8 çalışma, sinir ağı odaklı, klasik
 * çalışmalar yalnızca bağlam için. Slaytlar kısa metin taşır; çalışmaların tam
 * İngilizce başlıkları, açıklamalar ve süreler
 * `slide-directions/src/directions/literature-review.ts` içindedir.
 * Makalelerden yalnızca özetinde okunup doğrulanan bilgiler yazılır; hiçbir
 * doğruluk (accuracy) değeri slayta konmaz. Kendi projemiz için henüz sonuç yoktur.
 */
export const literatureReview = defineDeck({
  id: "literature-review",
  title: "İnsan Aktivitesi Tanıma · Literatür Taraması",
  lang: "tr-TR",
  transition: { effect: "fade", duration: 0.5 },
  slides: [
    {
      id: "cover",
      layout: "cover",
      title: "Sensörlerle İnsan Aktivitesi Tanıma - Literatür Taraması",
      subtitle: "Literatür Taraması · BİL 512 Yapay Sinir Ağları",
      presenter: "Erdem Göksel · 261402103",
      instructor: "Öğretim Üyesi: Cem CANTEKİN",
      date: "01.11.2026",
      animate: false,
    },
    {
      id: "scope",
      layout: "bullets",
      title: "Kapsam ve Yöntem",
      pointsLabel: "Tarama",
      points: ["8 çalışma", "Sinir ağları merkezli"],
    },
    {
      id: "map",
      layout: "flow",
      title: "Alanın Haritası",
      steps: [
        { label: "Feature tabanlı", items: ["Kwapisz 2011", "Anguita 2013", "Reyes-Ortiz 2016"] },
        { label: "Deep learning", items: ["Ordóñez 2016", "Hammerla 2016"] },
        { label: "Hibrit modeller", items: ["Xia 2020"] },
        { label: "Değerlendirme", items: ["Banos 2014", "Dehghani 2019"], tone: "accent" },
      ],
    },
    {
      id: "classical",
      layout: "bullets",
      title: "Feature Tabanlı HAR (Klasik Yaklaşım)",
      pointsLabel: "Çalışmalar",
      points: [
        "Kwapisz vd. (2011): telefon accelerometer'ı, 29 kullanıcı.",
        "Anguita vd. (2013): UCI HAR, 30 kişi, 561 feature, SVM.",
        "Reyes-Ortiz vd. (2016): UCI HAR'a postural transition etiketleri.",
      ],
    },
    {
      id: "datasets",
      layout: "table",
      title: "Veri Setleri",
      columns: ["Veri seti", "Kaynak", "Katılımcı", "Sensör"],
      rows: [
        ["UCI HAR", "Anguita vd. 2013", "30", "Accelerometer, gyroscope"],
        ["UCI HAR + Transitions", "Reyes-Ortiz vd. 2016", "30", "Accelerometer, gyroscope"],
        ["Kwapisz vd. veri seti", "Kwapisz vd. 2011", "29", "Accelerometer"],
      ],
    },
    {
      id: "cnn",
      layout: "bullets",
      title: "Derin öğrenme: CNN",
      pointsLabel: "Çalışmalar",
      points: [
        "Ordóñez ve Roggen (2016): convolutional ve LSTM katmanları, feature elle verilmiyor.",
        "Hammerla vd. (2016): DNN, CNN ve recurrent modeller.",
      ],
    },
    {
      id: "rnn",
      layout: "bullets",
      title: "Derin öğrenme: LSTM ve GRU",
      pointsLabel: "Çalışmalar",
      points: [
        "Ordóñez ve Roggen (2016): convolutional ve LSTM katmanları.",
        "Hammerla vd. (2016): DNN, CNN ve recurrent modeller, üç veri seti.",
      ],
    },
    {
      id: "hybrid",
      layout: "bullets",
      title: "Hibrit Modeller",
      pointsLabel: "Çalışmalar",
      points: [
        "Xia vd. (2020): LSTM-CNN; UCI, WISDM ve OPPORTUNITY.",
        "Ordóñez ve Roggen (2016): convolutional ve LSTM, katmanları.",
        "Bu projelerde hibrit model planlanmamaktadır ve MLP, 1D CNN, LSTM ve GRU karşılaştırılacaktır.",
      ],
    },
    {
      id: "evaluation",
      layout: "bullets",
      title: "Değerlendirme Pratiği",
      pointsLabel: "Dikkat edilecekler",
      points: [
        "Window boyutu: Banos vd. (2014).",
        "Overlap, cross validation türleri: Dehghani vd. (2019).",
        "Projelerde katılımcılara göre ayrım ve macro F1-score planlanmaktadır.",
      ],
    },
    {
      id: "comparison",
      layout: "table",
      title: "Çalışmaların Karşılaştırması",
      columns: ["Çalışma", "Veri seti", "Model", "Not"],
      rows: [
        ["Anguita 2013", "UCI HAR", "SVM", "Hazır feature'lar"],
        ["Reyes-Ortiz 2016", "UCI HAR + Transitions", "Feature tabanlı", "Geçişler"],
        ["Ordóñez 2016", "İki veri seti", "CNN + LSTM", "Elle feature yok"],
        ["Hammerla 2016", "Üç veri seti", "DNN, CNN, LSTM", "Hiperparametre analizi"],
        ["Xia 2020", "UCI, WISDM, OPPORTUNITY", "LSTM-CNN", "Az parametre"],
      ],
    },
    {
      id: "gaps",
      layout: "bullets",
      title: "Boşluklar ve Projenin Konumu",
      pointsLabel: "Projede planlanan",
      points: [
        "Dört model aynı veri ayrımı ve metriklerle karşılaştırılacaktır.",
        "Confusion Matrix kullanılarak karışan aktiviteler incelenecektir.",
        "Kendi telefon uygulamamızla genel çalışma durumu test edilecektir.",
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
