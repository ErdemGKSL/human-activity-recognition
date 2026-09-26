import { defineDeck } from "@pptx/core";
import { todoSlide } from "../skeleton";

/** 2. Sunum – Literature Review (15–20 dk, 02.11.2026 veya 09.11.2026). İskelet. */
export const literatureReview = defineDeck({
  id: "literature-review",
  title: "Human Activity Recognition — Literature Review",
  lang: "tr-TR",
  transition: { effect: "fade", duration: 0.5 },
  slides: [
    {
      id: "cover",
      layout: "cover",
      title: "Human Activity Recognition",
      subtitle: "Literature Review",
      presenter: "Erdem Göksel · 261402103",
      date: "TODO: 02.11.2026 / 09.11.2026",
    },
    {
      id: "agenda",
      layout: "agenda",
      title: "Gündem",
      items: [
        "Literatür özeti",
        "İncelenen çalışmalar",
        "Yöntemlerin karşılaştırılması",
        "Yaklaşımımızın gerekçesi",
      ],
    },
    todoSlide("summary", "Literatür Özeti", "HAR alanının kısa haritası"),
    todoSlide("studies", "İncelenen Çalışmalar", "Smartphone sensör verisiyle yapılan çalışmalar"),
    todoSlide("comparison", "Yöntemlerin Karşılaştırılması", "MLP, 1D CNN, LSTM, GRU sonuçları"),
    todoSlide("our-approach", "Yaklaşımımızın Gerekçesi", "Projede neyi neden uygulayacağız"),
    { id: "closing", layout: "closing", title: "Teşekkürler", subtitle: "Sorular?" },
  ],
});
