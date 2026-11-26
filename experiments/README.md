# HAR deney kodları

BİL 512 Yapay Sinir Ağları dersi, İnsan Aktivitesi Tanıma (HAR) projesi. Bu klasör, raporda ve sunumda
verilen tüm sonuçları üreten PyTorch kodunu içerir: MLP, 1D CNN, LSTM ve GRU modellerinin eğitimi,
kişi bazlı çapraz doğrulama (CV), final test koşusu ve çevrimdışı analiz.

Veri seti: UCI #341, *Smartphone-Based Recognition of Human Activities and Postural Transitions* (HAPT).
Kullanım koşulları ve atıf için paketteki `VERI_SETI_README.txt` dosyasına bakın.

## Kurulum

Python 3.10 veya üzeri ve [uv](https://docs.astral.sh/uv/) gerekir. GPU zorunlu değildir, ancak yoğun
window'lı LSTM ve GRU koşuları CPU'da çok yavaştır (raporda tüm koşular Colab T4/L4 GPU'da yapıldı).

```bash
cd experiments
uv sync
```

Veri seti ilk çalıştırmada `data/raw` altına UCI'den otomatik indirilir (`har/data.py`). İnternet
yoksa paketteki `UCI_HAPT_veri_seti.zip` dosyasını `data/raw` klasörüne açın.

## Dosyalar

| Dosya | İşlev |
|---|---|
| `har/data.py` | Veri indirme, resmi 561 feature'lı kümeler, ham sinyalden 128'lik window üretimi (en az %90 tek etiket), gravity/body ayrımı |
| `har/models.py` | İlk baseline modelleri |
| `har/models2.py` | Ayarlanabilir MLP, MLP-raw, 1D CNN (base/deep), LSTM ve GRU (pooling, bidirectional) |
| `train.py` | İlk baseline koşusu (raporda "ilk sonuçlar") |
| `train2.py` | CV (`--mode cv`) ve final test (`--mode final`) koşusu, augmentasyon, class weight, dışa aktarma |
| `summarize.py`, `summarize2.py` | Baseline ve CV sonuçlarını tabloya döker |
| `analyze_final.py` | Final test: seed ortalaması, ensemble, kişi bazlı bootstrap, eşleştirilmiş Δ, sınıf bazlı F1, confusion matrix |
| `plot_class_dist.py` | Sınıf dağılımı şekli |
| `har/export.py`, `export/gru_demo/` | Android demo için GRU ağırlıklarının JSON dökümü ve dökülen model |
| `calib_sim.py`, `calib_sim2.py`, `make_calib_testdata.py` | Android kalibrasyon yönteminin simülasyonu ve test verisi |
| `results/` | İlk baseline test sonuçları |
| `results2/cv/` | CV sonuçları (koşu başına JSON), `results2/ablation.md` özet tablo |
| `results2/final/` | Final test: parça başına JSON ve olasılık dosyaları (`*_probs.npz`), `summary.md`, şekiller |
| `JOURNEY.md` | Deneylerin günlüğü: ne yapıldı, ne oldu, hangi karar alındı |

## Değerlendirme protokolü

- Resmi kişi bazlı ayrım: 21 kişi eğitim, 9 kişi test.
- Hiperparametre ve tasarım kararları yalnızca 21 eğitim kişisi üzerinde 5-fold kişi bazlı CV ile
  (havuzlanmış out-of-fold macro F1) verildi. Test kümesi, yapılandırmalar dondurulduktan sonra bir kez koşuldu.
- İlk baseline'ın teşhisi test sonuçlarına bakılarak konmuştur. Bu durum raporda açıkça yazılıdır.

## Sonuçları yeniden üretme

CV koşusu (örnek: dondurulan GRU yapılandırması, 3 seed):

```bash
uv run python train2.py --mode cv --model gru --name d2_gru --epochs 40 --lr 2e-3 --warmup 2 --clip 1 \
  --tstep 16 --pool meanmax --bidir --aug --seeds 0 1 2 --out results2/cv
uv run python summarize2.py results2/cv
```

Final test koşusu, dondurulan yapılandırmalar (21 kişiyle eğitim, son epoch, 10 seed; raporda seed'ler
parçalar halinde koşuldu, parça adı `f_<model>_<parça>`). Aşağıda tek parça (`_all`) kullanılır ve çıktı,
depodaki rapor çıktılarıyla karışmasın diye ayrı klasöre yazılır (aynı klasörde seed'ler iki kez sayılırdı):

```bash
D="--epochs 40 --lr 2e-3 --warmup 2 --clip 1 --tstep 16"
S="--seeds 0 1 2 3 4 5 6 7 8 9"
uv run python train2.py --mode final --name f_mlp_all   --model mlp    --epochs 100 --lr 1e-3 --warmup 3 --clip 1 $S --out results2/final_repro
uv run python train2.py --mode final --name f_cnn_all   --model cnn    $D --variant deep --gravity --aug $S --out results2/final_repro
uv run python train2.py --mode final --name f_lstm_all  --model lstm   $D --pool meanmax --bidir --gravity --aug $S --out results2/final_repro
uv run python train2.py --mode final --name f_gru_all   --model gru    $D --pool meanmax --bidir --aug $S --out results2/final_repro
uv run python train2.py --mode final --name f_mlpraw_all --model mlpraw $D --gravity --aug $S --out results2/final_repro
uv run python analyze_final.py results2/final_repro
```

`analyze_final.py`, `results2/final/f_<model>_*_probs.npz` dosyalarını okur. Depodaki `results2/final/`
klasöründe raporun kullandığı parçalı çıktılar hazır olduğundan, analiz eğitim yapmadan tekrar
çalıştırılabilir: `uv run python analyze_final.py results2/final`.

## Notlar ve sınırlılıklar

- Final koşuların eğitilmiş ağırlıkları saklanmamıştır, yalnızca test olasılıkları (`*_probs.npz`) vardır.
  Android demosunda kullanılan GRU'nun ağırlıkları `export/gru_demo/model.json` dosyasındadır (seed 0).
- Koşular birden çok Colab runtime'ında (T4 ve L4) parçalar halinde yapıldı. Seed başına `manual_seed`
  kullanılır, ancak farklı GPU türleri küçük sayısal farklar üretebilir.
- MLP ve ham sinyal modellerinin test kümeleri biraz farklıdır (3.162 ve 3.124 window): ham window'lar
  bu kodla yeniden üretilir, resmi 561 feature dosyasında hangi satırın hangi ham window olduğu verilmez.
