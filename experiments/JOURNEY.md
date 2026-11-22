# Deney günlüğü

Final Results raporunun "izlenen yol" bölümü bu dosyadan yazılır. Her adım: ne yapıldı, neden, hangi sonuç çıktı (tablo/dosya işaretiyle). Sonuç olmayan şey sonuç gibi yazılmaz.

## Adım 0: Baseline (tamamlandı)

- Veri: UCI #341. MLP resmi 561 feature ile; CNN/LSTM/GRU ham 128x6 window ile (window'lar bizim üretimimiz: en az %90 tek etiket, 10.776 window; resmi 10.929).
- Ayrım: resmi kişi bazlı (21 eğitim / 9 test); validation eğitim kişilerinden her 5. kişi.
- Düzen: AdamW 2e-3, cosine, 40 epoch, batch 128, dropout 0,3, class-weighted CE, augmentasyon yok, arama yok. 5 seed, Colab L4.
- Sonuç (`results/summary.md`): macro F1 MLP 0,841; 1D CNN 0,819; GRU 0,786; LSTM 0,666 (std 0,094, bir seed 0,484).
- Gözlem: transition sınıfları en zayıf (F1 0,43 ile 0,77); SITTING/STANDING ham modellerde zayıf.
- Karar: ham modelleri iyileştirmek için Fable'dan strateji istendi.

## Adım 1: Danışmanlık (Fable) ve yöntem düzeltmesi

Fable koddan şu teşhisleri çıkardı (tahmindir, ölçüm değil):

1. RNN'ler az eğitildi (yaklaşık 1800 güncelleme), gradient clipping ve warmup yok, son zaman adımı çıktısı kullanılıyor.
2. Seçim sonrası 21 kişiyle yeniden eğitim yok; modeller yalnızca 16 kişiyi görüyor, 5 kişi validation.
3. "En iyi epoch" seçimi küçük ve gürültülü validation'da şansa bağlı.
4. Gravity/body ayrımı yok (SITTING/STANDING için kritik); MLP'nin 561 feature'ında hazır.
5. Class weight çok agresif (nadir sınıf için yaklaşık 20 kat).
6. Transition örnekleri az, augmentasyon yok.

Önemli yöntem notu: Baseline teşhisi test confusion matrix'ine bakılarak yapıldı. Bu yüzden bundan sonraki tüm kararlar yalnızca 21 eğitim kişisi üzerindeki 5-fold kişi bazlı CV ile (havuzlanmış out-of-fold macro F1) verilir. Test, dondurulmuş düzenle son adımda bir kez koşulur. Aynı arama bütçesi MLP'ye de verilir.

Yeni kod: `train2.py` (CV ve final modları), `har/models2.py`, `har/data.py` (gravity, `step`). Baseline kodu (`train.py`, `har/models.py`) değişmedi.

## Sonraki adımlar

## Adım 2: CV ile Aşama 0-3 (havuzlanmış out-of-fold macro F1, 21 eğitim kişisi, 3 seed)

Tam tablo: `results2/ablation.md`. Karar ölçütü yalnızca CV; test'e dokunulmadı. Colab runtime'ı bir kez düştü (boşta kalma) ve çıktılar kayboldu; ızgara yeniden koşuldu ve a0 sonuçları öncekiyle birebir aynı çıktı (tekrarlanabilir).

| Model | A0 baseline (40 ep, lr 2e-3) | A1a (100 ep, lr 1e-3, warmup, clip) | A1b (lr 2e-3) | pooling meanmax | + bidir | + gravity 9 kanal | derin CNN |
|---|---|---|---|---|---|---|---|
| MLP (561) | 0,824 | 0,845 | 0,844 | - | - | - | - |
| 1D CNN | 0,807 | 0,809 | 0,822 | - | - | 0,827 | 0,830 |
| LSTM | 0,768 | 0,771 | 0,797 | 0,763 | 0,787 | 0,781 | - |
| GRU | 0,776 | 0,767 | 0,779 | 0,767 | 0,789 | 0,764 | - |
| MLP-raw (düzleştirilmiş ham) | - | 0,803 (6 kanal) | - | - | - | 0,808 (9 kanal) | - |

Gözlemler: (1) Ayarlı optimizasyon MLP'ye de yaradı (0,824 → 0,845), yani baseline tüm modeller için eksik ayarlıydı. (2) lr 2e-3 RNN ve CNN'de lr 1e-3'ten iyi. (3) bidirectional + mean/max pooling LSTM ve GRU'da fayda sağladı. (4) Gravity/body ayrımı CNN ve LSTM'de yardım etti, GRU'da etkisiz. (5) Aynı MLP ham girdiyle 0,803, 561 feature'la 0,845: fark girdi temsilinden geliyor. Std değerleri 0,003-0,02; 0,01 altındaki farklar gürültü sayılır.

Karar: Aşama 4'te modele göre en iyi birleşim (CNN: deep + gravity; LSTM: bidir+meanmax + gravity; GRU: bidir+meanmax) lr 2e-3 ile kurulur, sonra yoğun window (adım 16) ve augmentasyon eklenir.

## Adım 3 (sürüyor): Aşama 4 CV

(Sonuçlar eklenecek.)

## Karar kronolojisi (rapordaki "izlenen yol" bölümünün iskeleti)

Her satır: ne yaptık, ne oldu, hangi karar çıktı. Rapor bölümü bu sırayla yazılacak.

1. **Veri seti seçimi ve doğrulama.** UCI #341 (HAPT) indirildi. Resmi dosyalarda 10.929 örnek (7.767 eğitim, 3.162 test), 30 kişi, 12 sınıf. Karar: resmi kişi bazlı ayrım korunur.
2. **Girdi tasarımı.** Resmi 561 feature MLP içindir. Ham sinyal modelleri (CNN/LSTM/GRU) için ham window'lar bizim üretmemiz gerekti, çünkü resmi dosyalarda hangi satırın hangi ham window olduğu yok. Denenen kural: window, tek bir etiketli segmentin en az %90'ını kapsamalı. Sonuç: 10.776 window (resmi 10.929'a %1,4 yakın; geçiş sınıfları 471 window, resmi 518). Karar: %90 kuralı; MLP ile ham modellerin test kümeleri biraz farklı (3.162 ve 3.124) ve bu raporda açıkça yazılır.
3. **Donanım kararı.** Önce CPU'da denendi: tek koşuda MLP 5 sn, CNN 36 sn, LSTM 150 sn; baseline (4 model x 3 seed) CPU'da mümkündü. CV ve ablation planı büyüyünce (tek RNN yapılandırması için CPU tahmini yaklaşık 1,5 saat) karar: eğitim Colab L4 GPU'da yapılır (aynı RNN yapılandırması orada yaklaşık 5 dk).
4. **Baseline (Adım 0).** MLP 0,841 > CNN 0,819 > GRU 0,786 > LSTM 0,666. LSTM tutarsızdı (bir seed 0,484). Bu beklenen sonuçtan farklıydı: ham sinyal modelleri MLP'nin gerisinde.
5. **Danışmanlık ve yöntem düzeltmesi (Adım 1).** Teşhis: RNN eğitim düzeni zayıf, validation küçük ve gürültülü, gravity/body ayrımı yok, augmentasyon yok. Önemli düzeltme: baseline'ın test confusion matrix'ine bakıldığı için, bundan sonra karar yalnızca eğitim kişilerinde 5-fold kişi bazlı CV ile verilir; test son adımda bir kez koşulur.
6. **İlk CV ölçümü (Adım 2, A0).** Baseline düzen CV'de yeniden ölçüldü: MLP 0,824; CNN 0,807; GRU 0,776; LSTM 0,768. Test'teki LSTM çöküşü CV'de görülmedi; yani o sonuç kısmen seçim şansıydı. Karar: CV değerleri esas alınır.
7. **Optimizasyon (A1).** 100 epoch, warmup, gradient clipping. MLP 0,824 → 0,845; CNN ve RNN'lerde lr 2e-3, lr 1e-3'ten iyi (CNN 0,822; LSTM 0,797). Karar: lr 2e-3, 100 epoch, warmup 3, clip 1 tüm modellere ortak taban.
8. **RNN yapısı.** mean/max pooling tek başına fayda vermedi (LSTM 0,763); bidirectional ile birlikte LSTM 0,787, GRU 0,789. Karar: RNN'lerde bidirectional + mean/max pooling.
9. **Gravity/body ayrımı (9 kanal).** CNN +0,018, LSTM +0,010, GRU ≈0 (-0,003). Karar: CNN ve LSTM için 9 kanal; GRU için ayrıca denenir.
10. **Derin CNN (dilation, 4 blok).** 0,809 → 0,830 (+0,021). Karar: derin CNN kullanılır.
11. **Feature mı, mimari mi?** Aynı MLP düzleştirilmiş ham girdiyle 0,803 (6 kanal) ve 0,808 (9 kanal); 561 feature'la 0,845. Sonuç: MLP'nin üstünlüğü büyük ölçüde hazır feature'lardan geliyor, MLP mimarisinden değil. Bu bulgu raporda ham sinyal modellerinin karşılaştırmasının merkezinde yer alır.
12. **Altyapı olayları.** Colab runtime'ı boşta kaldığı için bir kez silindi ve CV çıktıları kayboldu; ızgara yeniden koşuldu ve a0 sonuçları birebir aynı çıktı (tekrarlanabilirlik doğrulandı). Karar: sonuçlar her kontrolde repoya indirilir; colab-gpu skill'i yazıldı.
13. **Aşama 4: yoğun window ve augmentasyon (CV).** Kombine taban c1 (lr 2e-3, 100 epoch; CNN: deep + gravity, LSTM: bidir + meanmax + gravity, GRU: bidir + meanmax): CNN 0,833; LSTM 0,808; GRU 0,786 (gravity ile 0,802). Yalnızca yoğun window (adım 16, 40 epoch, d1): CNN 0,823; LSTM 0,817; GRU 0,811. Yoğun window + augmentasyon (küçük rotation, scaling, d2): CNN **0,855**; LSTM ve GRU'da ilk seed'ler 0,862 ve 0,858 (tam sonuçlar eklenecek). Karar: augmentasyon ana kazanç kaynağı; yoğun window tek başına karışık etki verdi.
14. **Altyapı olayı 2.** Colab runtime'ı yaklaşık 1 saat 50 dakika sonra, düzenli poll'a rağmen yeniden silindi (ilki yaklaşık 40 dakika sonra, poll'suz boşta). Çıkarım: düzenli poll tek başına yeterli değil, runtime ömrü sınırlı olabilir (doğrulanmadı). Karar: işler kısa parçalara bölünür, çıktılar her kontrolde indirilir; d2_lstm, d2_gru ve Aşama 5 koşuları yeni runtime'da yeniden başlatıldı.

Sonraki satırlar (Aşama 5, final koşu, ensemble) sonuçlar çıktıkça buraya eklenecek.

## Ara değerlendirme 2 (Fable, 22.11): yön değişmiyor, keşif kapanıyor

Fable (tüm CV tablosu ve kod okunarak) şunu bildirdi (özet; değerlendirme, ölçüm değil):

- **Gürültünün çok üstünde:** girdi temsili etkisi (aynı MLP ham girdiyle 0,803-0,808, 561 feature ile 0,845); baseline'ın eksik ayarlı olması; yoğun window + augmentasyonun CNN'e katkısı (0,823 → 0,855, özellikle SITTING/STANDING). CNN temel aktivitelerde MLP'den iyi, transition'da eşit.
- **Gürültüde:** CNN 0,855 ile MLP 0,845 farkı (yaklaşık 1,5 sigma, kişi örneklemesi hariç); tek seed'lik BiLSTM/BiGRU değerleri; gravity ve bidir/meanmax gibi ara tercihler.
- **Yapısal zayıflıklar:** seed std'si kişi belirsizliğini içermiyor (21 CV, 9 test kişisi; 471 transition window'u); MLP ve ham modellerin değerlendirme kümeleri farklı; adım 64 + augmentasyon hücresi eksikti (bu yüzden "augmentasyon ana kazanç" iddiası kapanış kolu k1_cnn'e bağlı).
- **Karar:** Keşif 23.11 akşamı kapanır; yapılandırmalar ve analiz planı dondurulur (aşağıdaki plan, test koşusundan ÖNCE commit edilir); test bir kez koşulur; sonrası "keşif amaçlı" diye ayrı yazılır. "Ham modeller MLP'yi geçti" iddiası yalnızca testte eşleştirilmiş kişi bazlı bootstrap'in %95 GA'sı sıfırı dışlarsa ve CV ile aynı yöndeyse yazılır; aksi halde "karşılaştırılabilir düzeyde".

Kapanış kolları (CV): k1_cnn (adım 64 + augmentasyon), k2_mlpraw (MLP-raw + d2 düzeni), k3/k4 (MLP + feature gürültüsü 0,1 ve 0,3), k5 (referans). Ayrıca e1s_cnn (class weight sqrt, d2 düzeni): 0,858 ± 0,003 (d2_cnn 0,855 ± 0,010); fark gürültüde, varyans düşük.

Kod: `train2.py` final modunda test kişilerini kaydeder; CV'de `--save-oof` ile OOF tahminlerini kaydeder; `--noise` MLP için feature-uzayı gürültüsüdür.

### Dondurma planı (test koşusundan önce kesinleşecek)

Birincil metrik: test macro F1. Bootstrap: kişi bazlı (9 test kişisi, B=2000, percentile %95 GA), model farkları için eşleştirilmiş. Tekil model ortalaması ± std (10 seed) ve 10 seed olasılık ortalaması ensemble. Seed'ler 2'şerli parçalarla koşulur. Yapılandırmalar kapanış kolları bitince buraya yazılacak.
