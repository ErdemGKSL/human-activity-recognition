# Human Activity Recognition

Akıllı telefon **accelerometer** ve **gyroscope** verileriyle insan aktivitesi tanıma
(MLP, 1D CNN, LSTM, GRU). Şu an kapsam: 1. Sunum – Project Proposal.

## Çıktılar

Her deck için `dist/<deck-id>/` altında üç dosya:

| Dosya | Ne | Nasıl üretilir |
| --- | --- | --- |
| `slide.pptx` | Sunum | DeckCraft (`deckcraft-cli`) |
| `slide.pdf` | Sunumun PDF hali | DeckCraft PDF export |
| `slide-directions.pdf` | Anlatıcı rehberi | takumi-pdf |

## Başlangıç

Gereksinimler: [Bun](https://bun.sh) ≥ 1.3, git ve bir DeckCraft derlemesi.

```bash
git clone https://github.com/storytold/deckcraft ~/storytold/deckcraft
cd ~/storytold/deckcraft && cargo build --release -p deckcraft-cli

cd ~/human-activity-recognition   # bu repo
bun install
export DECKCRAFT_CLI=~/storytold/deckcraft/target/release/deckcraft-cli
bun run build                     # dist/proposal/
bun run check                     # lint + typecheck + testler
```

`DECKCRAFT_CLI` verilmezse build `deckcraft-cli`'yi `PATH` üzerinden arar.

## Klasörler

| Klasör | İçerik |
| --- | --- |
| `deck/` | Sunum içeriği (`proposal.ts`) |
| `scripts/` | Build: deck → DeckCraft komutları → `.pptx`, PDF, PNG |
| `slide-directions/` | Anlatıcı rehberi verisi ve takumi-pdf düzeni |
| `report/` | Raporlar ve ortak takumi-pdf dönüştürücüsü |

AI ajanları için rehber: [AGENTS.md](AGENTS.md).
