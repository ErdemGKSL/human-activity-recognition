import { defineDeck } from "@pptx/core";
import { todoSlide } from "../skeleton";

/** 3. Sunum – Final Results (20–30 dk, 30.11.2026 veya 07.12.2026). İskelet. */
export const finalResults = defineDeck({
  id: "final-results",
  title: "Human Activity Recognition — Final Results",
  lang: "tr-TR",
  transition: { effect: "fade", duration: 0.5 },
  slides: [
    {
      id: "cover",
      layout: "cover",
      title: "Human Activity Recognition",
      subtitle: "Final Results",
      presenter: "TODO: Sunum yapanlar",
      date: "TODO: 30.11.2026 / 07.12.2026",
    },
    {
      id: "agenda",
      layout: "agenda",
      title: "Gündem",
      items: [
        "Proje özeti",
        "Veri seti ve yöntem",
        "Model mimarileri",
        "Deney sonuçları",
        "Modellerin karşılaştırılması",
        "Gerçek telefon verisi",
        "Sonuç ve canlı demo",
      ],
    },
    todoSlide("overview", "Proje Özeti", "Problem, hedef ve yol haritası"),
    todoSlide("data-method", "Veri Seti ve Yöntem", "Ön işleme ve deney düzeni"),
    todoSlide("architectures", "Model Mimarileri", "MLP, 1D CNN, LSTM, GRU"),
    todoSlide("results", "Deney Sonuçları", "Accuracy, Precision, Recall, F1, Confusion Matrix"),
    todoSlide("comparison", "Modellerin Karşılaştırılması", "Hangi model neden kazandı"),
    todoSlide("real-phone", "Gerçek Telefon Verisi", "Kendi kaydettiğimiz verilerle testler"),
    todoSlide("conclusion", "Sonuç ve Çıkarımlar", "Öğrendiklerimiz ve gelecek çalışmalar"),
    todoSlide("demo", "Canlı Demo", "Mümkünse telefonla canlı tahmin"),
    { id: "closing", layout: "closing", title: "Teşekkürler", subtitle: "Sorular?" },
  ],
});
