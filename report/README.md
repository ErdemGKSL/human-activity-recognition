# report — raporlar (PDF)

Projenin yazılı teslimleri, JSX'ten PDF'e. Ayrıca repo genelinde kullanılan
**JSX → PDF dönüştürücüsü** burada: `src/pdf` (`@har/report/pdf`).

```bash
bun run build                      # tüm raporlar → output/<id>.pdf
bun run build final-results        # tek rapor
bun run build --list
```

| Rapor | Dosya | Teslim |
| --- | --- | --- |
| `literature-review` | `src/documents/literature-review.tsx` | 01.11.2026 23:55 |
| `final-results` | `src/documents/final-results.tsx` | 29.11.2026 23:55 |

## Dönüştürücü (`src/pdf`)

[takumi-pdf](https://takumi.kane.tw/docs/pdf) (Takumi'nin PDF motoru, wasm, tarayıcı yok)
üzerine ince bir katman:

- `renderPdf(jsx, options)` / `writePdf(path, jsx, options)`: A4, sayfa numaralı alt bilgi,
  PDF metadata ve başlıklardan (`h1`–`h3`) otomatik yer imleri.
- Bileşenler: `Document`, `TitlePage`, `Section`, `SubSection`, `Paragraph`, `BulletList`,
  `Table`, `Callout`, `Todo`, `FigurePlaceholder`, `KeyValue`, `Code`.
- Font: tam Geist (`geist` npm paketi), Türkçe karakterleri kapsar.

Proje bilgileri (yazarlar, ders, tarihler) tek yerde: `src/project.ts`. Ayrıntılar:
[pdf-documents skill](../.claude/skills/pdf-documents/SKILL.md).
