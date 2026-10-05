# Human Activity Recognition

Akıllı telefon **accelerometer** ve **gyroscope** verileriyle insan aktivitesi tanıma
(MLP, 1D CNN, LSTM, GRU). Bu repo projenin tüm teslimlerini üretir: sunumlar, raporlar ve
sunumlar için anlatıcı rehberleri.

| Klasör | Ne üretir | Nasıl |
| --- | --- | --- |
| [`slides/`](slides/README.md) | Sunumlar (`.pptx`) | deck verisi → Takumi JSX → SVG → ppt-master |
| [`report/`](report/README.md) | Raporlar (PDF) + ortak JSX → PDF dönüştürücü | JSX → takumi-pdf |
| [`slide-directions/`](slide-directions/README.md) | Her sunum için anlatıcı rehberi (PDF) | deck + yönlendirme verisi → takumi-pdf |

## Teslimler

| Teslim | Nerede | Tarih |
| --- | --- | --- |
| 1. Sunum – Project Proposal (5–10 dk); yalnızca sunum PDF'i yüklenir | `slides` + `slide-directions` → `proposal` (`slides/output/proposal.pdf`) | PDF 18.10.2026 23:55, sunum 19.10.2026 |
| Literature Review Raporu | `report` → `literature-review` | 01.11.2026 23:55 |
| 2. Sunum – Literature Review (15–20 dk) | `slides` + `slide-directions` → `literature-review` | 02.11.2026 veya 09.11.2026 |
| Final Results Raporu (düz PDF) | `report` → `final-results` | 29.11.2026 23:55 |
| 3. Sunum – Final Results (20–30 dk) | `slides` + `slide-directions` → `final-results` | 30.11.2026 veya 07.12.2026 |

Şu an hepsi iskelet: içerik yazılacak yerler `TODO` olarak işaretli.

## Başlangıç

Gereksinimler: [Bun](https://bun.sh) ≥ 1.3, [uv](https://docs.astral.sh/uv/), git.

```bash
git clone --recurse-submodules <repo>
cd human-activity-recognition
bun run setup        # submodule + bun install + uv sync

bun run slides       # → slides/output/<deck>.pptx + <deck>.pdf
bun run report       # → report/output/<id>.pdf
bun run directions   # → slide-directions/output/<deck>.pdf
bun run build        # hepsi

bun run check        # lint + doküman linkleri + typecheck + testler
```

AI ajanları (Claude Code vb.) için rehber: [AGENTS.md](AGENTS.md).
