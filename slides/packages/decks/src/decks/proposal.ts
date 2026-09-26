import { defineDeck } from "@pptx/core";
import { todoSlide } from "../skeleton";

/** 1. Sunum – Project Proposal (5–10 dk, 19.10.2026). İskelet. */
export const proposal = defineDeck({
  id: "proposal",
  title: "Human Activity Recognition — Project Proposal",
  lang: "tr-TR",
  transition: { effect: "fade", duration: 0.5 },
  slides: [
    {
      id: "cover",
      layout: "cover",
      title: "Human Activity Recognition",
      subtitle: "Project Proposal",
      presenter: "TODO: Sunum yapanlar",
      date: "19.10.2026",
    },
    {
      id: "agenda",
      layout: "agenda",
      title: "Gündem",
      items: ["Proje amacı", "Veri seti", "Planlanan yöntem", "Zaman planı"],
    },
    todoSlide("goal", "Proje Amacı", "Problem tanımı ve hedef"),
    todoSlide("dataset", "Veri Seti", "Accelerometer + gyroscope verisi, sınıflar, örnek sayısı"),
    todoSlide("method", "Planlanan Yöntem", "MLP, 1D CNN, LSTM, GRU ve değerlendirme metrikleri"),
    todoSlide("timeline", "Zaman Planı", "Rapor ve sunum takvimi"),
    { id: "closing", layout: "closing", title: "Teşekkürler", subtitle: "Sorular?" },
  ],
});
