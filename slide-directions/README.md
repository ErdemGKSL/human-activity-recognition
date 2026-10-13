# slide-directions — anlatıcı rehberleri (PDF)

Slaytlar az metin, çok veri içerir (istatistik, grafik, tablo). Hikâye burada: her sunum
için bir PDF, her slayt için bir sayfa. Anlatıcı sunumdan önce bunu çalışır.

Her slayt sayfasında:

- slaytın küçük görüntüsü, süresi ve konuşmacısı,
- **amaç**: dinleyici bu slayttan tek cümleyle ne almalı,
- **anlatıcı metni**: ezberlenmeden anlatılacak paragraflar,
- **veriler ne anlama geliyor**: slayttaki her sayı/grafik ve nasıl açıklanacağı,
- **fun fact**'ler, **sunum ipuçları** (nereyi göster, nerede dur),
- **olası sorular** ve cevapları, **sonraki slayta geçiş** cümlesi.

Rehber, kökteki `bun run build` ile her deck'in yanında üretilir:
`dist/<deck-id>/slide-directions.pdf`. Slayt görüntüleri DeckCraft'ın PNG çıktısından gelir.

Veriler `src/directions/<deck-id>.ts` içinde, slayt id'sine göre (`SlideDirection`, bkz.
`src/types.ts`). Deck içeriği `deck/<deck-id>.ts` içinde; bir test her deck'in her slaytı
için tam bir giriş olmasını zorunlu tutar. PDF'ler [report](../report/README.md)
içindeki ortak dönüştürücüyle üretilir. Ayrıntılar:
[pdf-documents skill](../.claude/skills/pdf-documents/SKILL.md).
