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
      title: "Problem ve Neden Önemli",
      points: [
        "Telefondaki accelerometer ve gyroscope saniyede 50 ölçüm alıyor (6 kanal)",
        "Bu sinyale bakıp kişinin o an yürüdüğünü mü, oturduğunu mu, uzandığını mı söyleyebilir miyiz? 6 aktivite var",
        "En zoru oturma ile ayakta durmayı ayırmak, çünkü ikisinde de telefon neredeyse hiç hareket etmiyor",
        "Herkes biraz farklı yürür",
        "Neden önemli? Yaşlı ve hasta takibi gibi sağlık uygulamaları da, spor uygulamaları da kişinin ne yaptığını bilmek zorunda",
      ],
      notes:
        "Telefon üç eksende ivme ve açısal hız ölçüyor, ama bu sayılar tek başına 'yürüyor' ya da 'oturuyor' demiyor. Aktivite tanıma; hasta ve yaşlı takibi, spor uygulamaları ve bağlama göre davranan cihazlar için girdi sağlıyor.",
    },
    {
      id: "goal",
      layout: "bullets",
      title: "Amaç ve Araştırma Soruları",
      lead: "Dört modeli aynı veriyle eğitip yan yana koyacağız.",
      pointsLabel: "Sorularımız",
      points: [
        "Ham sinyali doğrudan alan 1D CNN, LSTM ve GRU, hazır feature'larla çalışan MLP baseline'ını geçebilecek mi?",
        "Hangi aktiviteler birbirine karışacak?",
        "Eğitimde olmayan bir kişide, mesela kendi telefonumuzla kaydettiğimiz veride, başarı ne kadar düşüyor?",
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
        "30 gönüllü (19–48 yaş), telefon bellerinde, 3 eksenli accelerometer ve gyroscope ile kaydedilmiş",
        "50 Hz örnekleme, 2,56 saniyelik window'lar (128 ölçüm), %50 overlap",
        "10.929 örnek, her birinde 561 feature",
        "12 etiket var, 6 aktivite + 6 postural transition. Ana hedefimiz 6 aktivite; geçişleri katıp katmayacağımıza sonra karar vereceğiz",
        "Gönüllülerin %70'i eğitimde, %30'u testte. Yani test kişileri eğitimde hiç yok",
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
        {
          label: "Ön İşleme",
          items: ["low-pass filter", "128 ölçümlük window'lar", "normalizasyon"],
        },
        { label: "Modelleme", items: ["MLP", "1D CNN", "LSTM", "GRU"] },
        {
          label: "Değerlendirme",
          items: ["test kümesinde metrikler", "hangi sınıf neyle karışıyor?"],
        },
        { label: "Gerçek Veri", items: ["Kendi telefonumuzla", "yeni bir kişi"], tone: "accent" },
      ],
      points: ["MLP hazır 561 feature'la çalışacak. Diğer üçü ham window'ları alacak"],
      notes:
        "Veri ayrımı ve metrikler dört model için ortak olacak. MLP'nin girdisi hazır feature'lar olduğundan, MLP ile diğer modeller arasındaki fark hem mimariden hem input representation'ından gelecek. Son adımda modelleri kendi telefonumuzla topladığımız verilerle sınayacağız.",
    },
    {
      id: "architectures",
      layout: "table",
      title: "Kullanılacak ANN Modelleri",
      columns: ["Model", "Girdi", "Neden bu model"],
      rows: [
        [
          "MLP",
          "561 feature",
          "Baseline. Zaman sırasını görmüyor, sadece hazır feature'lara bakıyor",
        ],
        ["1D CNN", "Ham window (128 × 6)", "Sinyaldeki kısa pattern'leri convolution ile yakalar"],
        ["LSTM", "Ham window (128 × 6)", "Uzun temporal dependency'ler için (recurrent)"],
        ["GRU", "Aynı", "LSTM gibi ama daha az parametre"],
      ],
      notes:
        "MLP sinyalin zaman sırasını görmediği için hazır feature'larla baseline model olacak. 1D CNN yerel pattern'leri, LSTM ve GRU ise zaman içindeki bağımlılıkları doğrudan öğrenecek.",
    },
    {
      id: "evaluation",
      layout: "bullets",
      title: "Değerlendirme Yöntemi",
      lead: "Accuracy, Precision, Recall, F1-score (macro) ve Confusion Matrix",
      points: [
        "Sadece Accuracy'ye bakmak yetmez, çünkü az örnekli sınıflardaki hatalar toplamda kaybolur",
        "Bu yüzden Precision, Recall ve F1'i her sınıf için ayrı raporlayacağız",
        "Karışan aktiviteler Confusion Matrix'te",
      ],
      notes:
        "Accuracy tek başına sınıf bazındaki hataları göstermez ve az örnekli postural transition'ları gizleyebilir. Bu yüzden sınıf bazında Precision, Recall ve F1 de raporlanacak. İkinci araştırma sorusunun cevabını Confusion Matrix'te arayacağız.",
    },
    {
      id: "outcomes",
      layout: "bullets",
      title: "Sonuç Beklentileri",
      points: [
        "1D CNN, LSTM ve GRU, feature engineering olmadan MLP baseline'ına yaklaşır diye düşünüyoruz",
        "En çok karışacak ikili: oturma ve ayakta durma",
        "LSTM ile GRU yakın çıkar, GRU daha az hesaplama ister",
        "Kendi telefon verimizde başarı düşerse şaşırmayız, sonuçta başka bir cihaz ve başka bir kişi",
      ],
      notes:
        "Bunlar tahmin; gerçek sonuçları final sunumunda göstereceğiz. Katkımız yeni bir mimari değil, dört mimarinin kontrollü karşılaştırması ve gerçek telefon verisiyle bir genelleme testi.",
    },
    {
      id: "plan",
      layout: "table",
      title: "Çalışma Planı ve Sonraki Adımlar",
      columns: ["Aşama", "Tarih", "Çıktı"],
      rows: [
        ["Proje önerisi", "18.10 (PDF) · 19.10.2026", "Bu sunum"],
        ["Literatür taraması", "01.11 – 09.11.2026", "Rapor ve 2. sunum"],
        ["Ön işleme ve model eğitimi", "Kasım 2026", "4 modeli eğitip karşılaştırma"],
        ["Gerçek telefon verisi", "Kasım 2026", "Kendi telefonumuzla test"],
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
