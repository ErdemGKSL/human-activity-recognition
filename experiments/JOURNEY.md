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

## Adım 4: Kapanış CV ve DONDURMA (22.11, final koşudan önce)

Kapanış CV sonuçları (OOF macro F1, 3 seed, `results2/ablation.md`): d2_lstm 0,857 ± 0,005; d2_gru 0,845 ± 0,007; k2_mlpraw (MLP-raw + d2 düzeni: gravity, yoğun window, augmentasyon) 0,840 ± 0,004; MLP feature gürültüsü (k3, k4) 0,843-0,845 (yardım etmedi); k5 referans. d2 koşuları T4'te yeniden koşuldu; L4'teki ilk seed'lerle aynı düzeyde (LSTM 0,864 vs 0,862; GRU 0,850 vs 0,858).

Bulgular (CV, tablo işaretiyle rapora girecek):
- Augmentasyon tek başına CNN'e +0,017 verdi (c1 0,833 → k1 0,849); yoğun window eklemek +0,006 daha (d2 0,855), gürültü bandında.
- Aynı MLP ham girdiyle augmentasyonsuz 0,803-0,808; augmentasyon ve yoğun window'la 0,840. Yani ham girdideki kazancın büyük kısmı mimariden değil eğitim düzeninden geliyor; 561 feature'lı MLP'nin tavanı 0,845. Ham MLP ile feature MLP arasındaki fark 0,005'e indi (CV'de gürültü bandında). "MLP'nin üstünlüğü hazır feature'lardan geliyor" iddiası yalnızca augmentasyonsuz karşılaştırma için geçerlidir; bu bölüm raporda böyle yazılacak.

### Dondurulan yapılandırmalar (CV'de seçildi; bundan sonra değişmez)
Ortak: son epoch modeli (erken durdurma yok), 21 eğitim kişisinin tamamıyla eğitim, standardizasyon eğitim istatistiğiyle, AdamW, batch 128, dropout 0,3, class-weighted loss (full), `train2.py --mode final`, `--out /content/exp/final`, 10 seed (0-9) 2'şerli parçalarla.
- **MLP (561 feature):** a1a: `--epochs 100 --lr 1e-3 --warmup 3 --clip 1` (a1e sqrt ağırlıkla eşit olduğundan ortak ayara sahip a1a seçildi).
- **1D CNN:** d2_cnn: `--variant deep --gravity --aug --tstep 16 --epochs 40 --lr 2e-3 --warmup 2 --clip 1` (e1s sqrt ağırlık 0,858 ile eşit; gürültü bandı, tutarlılık için class weight full).
- **LSTM:** d2_lstm: `--pool meanmax --bidir --gravity --aug --tstep 16 --epochs 40 --lr 2e-3 --warmup 2 --clip 1`.
- **GRU:** d2_gru: `--pool meanmax --bidir --aug --tstep 16 --epochs 40 --lr 2e-3 --warmup 2 --clip 1` (gravity yok: CV'de GRU'da yardım etmedi).
- **Kontrol:** MLP-raw: `--model mlpraw --gravity --aug --tstep 16 --epochs 40 --lr 2e-3 --warmup 2 --clip 1`.

### Analiz planı (önceden ilan edilmiş)
Birincil metrik: test macro F1. Tekil model: 10 seed ortalaması ± std. Ensemble: 10 seed olasılığının ortalaması. %95 GA: kişi bazlı bootstrap (9 test kişisi yerine koymalı, B=2000, percentile). Model farkı: aynı kişi çekilişlerinde eşleştirilmiş Δ macro F1 (model - MLP). İddia eşiği: "ham model MLP'yi geçti" yalnızca Δ GA'sı sıfırı dışlar VE CV'de aynı yön olursa; aksi halde "karşılaştırılabilir düzeyde". Araç: `analyze_final.py`. Test bir kez koşulur; sonrasında denenen her şey "keşif amaçlı" etiketiyle ayrı yazılır. CV ve test değerleri raporda yan yana verilir, ama iki protokol (16 kişi + en iyi validation epoch'u ile baseline testi; 21 kişi + sabit epoch ile final) ayrı tablolarda durur.

## Adım 5: Final test sonuçları (dondurulmuş düzen, test kümesine ilk ve tek koşu)

Kaynak: `results2/final/summary.md` (tablolar), `summary.json`, `confusion_*.png`, `delta_vs_mlp.png`; üretici `analyze_final.py`. 21 eğitim kişisi, son epoch, 10 seed (0-9), 9 test kişisi. Test örnek sayıları: MLP 3.162; ham modeller 3.124 (farklı küme). Seed'ler birden çok Colab runtime'ında ve parçalar halinde koşuldu (runtime'lar defalarca düştü; düşen parçalar aynı bayraklar ve aynı seed'lerle yeniden koşuldu, seed başına `manual_seed` kullanıldığı için tasarım gereği aynı sonucu verir, ancak T4/L4 farkı küçük sayısal sapma yaratabilir).

| Model | Macro F1 (10 seed, ort. ± std) | Ensemble macro F1 | Ensemble %95 GA (kişi bootstrap) | Accuracy (seed ort.) |
|---|---|---|---|---|
| MLP (561 feature) | 0,860 ± 0,004 | 0,864 | [0,823; 0,899] | 0,940 |
| MLP-raw (kontrol) | 0,862 ± 0,006 | 0,862 | [0,793; 0,907] | 0,914 |
| 1D CNN | 0,894 ± 0,011 | 0,921 | [0,888; 0,947] | 0,966 |
| LSTM | 0,898 ± 0,010 | 0,928 | [0,888; 0,955] | 0,964 |
| GRU | 0,888 ± 0,008 | 0,921 | [0,874; 0,951] | 0,958 |

Eşleştirilmiş Δ macro F1 (model - MLP, ensemble, kişi bazlı bootstrap, B=2000): MLP-raw -0,005 [-0,055; +0,043]; 1D CNN +0,056 [+0,026; +0,093]; LSTM +0,063 [+0,029; +0,097]; GRU +0,055 [+0,024; +0,086].

### İddia eşiğinin uygulanması (önceden ilan edilen kural: Δ GA'sı sıfırı dışlar VE CV aynı yönde)
- **1D CNN ve LSTM:** testte GA sıfırı dışlıyor; CV'de de aynı yön (CNN +0,010, LSTM +0,012). Eşik karşılandı: "ham sinyal modelleri bu veri setinde, bu düzenle MLP'den daha yüksek test macro F1 verdi" yazılabilir. Ek notlar: CV farkları tek başına gürültü bandındaydı (0,01 civarı), test farkı (≈0,06) CV'den büyük; 9 test kişisiyle GA geniş ve biraz iyimser.
- **GRU:** testte GA sıfırı dışlıyor (+0,055) ama CV'de fark yok (0,845 ve 0,845). Eşik karşılanmadı: iddia "testte MLP'den yüksek, CV'de ayırt edilemez" biçiminde ihtiyatla yazılır, güçlü bir üstünlük iddiası yapılmaz.
- **MLP-raw (augmentasyon + yoğun window):** MLP ile ayırt edilemez (Δ -0,005, GA sıfırı kapsıyor), ama accuracy'si belirgin düşük (0,914 ve 0,940) ve SITTING/STANDING'de zayıf (F1 0,80 ve 0,84). Yani macro F1 eşitliği transition sınıflarındaki iyi sonuçlardan (MLP-raw transition 0,801; MLP 0,776) geliyor, temel aktivitelerde değil.

### Diğer gözlemler (yorum, kanıt düzeyleri belirtilerek)
- **Sınıf bazlı:** ham modeller transition sınıflarında MLP'den yüksek (transition ortalama F1: MLP 0,776; CNN 0,863; LSTM 0,874; GRU 0,858) ve temel aktivitelerde de (aktivite ortalaması: MLP 0,952; CNN 0,979; LSTM 0,982; GRU 0,984). En zayıf sınıflar yine SIT_TO_LIE (0,69-0,79) ve STAND_TO_LIE (0,72-0,79). Transition sınıfları test kümesinde çok az örneğe dayanır (toplam yaklaşık 160 window), bu yüzden sınıf bazlı farklar kesin yorumlanmaz.
- **Ensemble:** 10 seed'in olasılık ortalaması ham modellerde tekil seed ortalamasından +0,03 yüksek (CNN 0,894 → 0,921), MLP'de +0,004. Raporda tekil model ve ensemble ayrı satırlarda verilir.
- **CV ve test farkı:** Test değerleri CV'den yüksek (MLP +0,015; CNN, LSTM, GRU yaklaşık +0,04). Olası açıklamalar: final modeller 21 kişiyle (CV'de 16 kişi) eğitildi; ham modeller ek kişiden daha çok yararlanıyor olabilir; test kişileri CV kişilerinden kolay olabilir. Hangisinin etkili olduğu bu deneylerle ayrılamıyor, ayrı ayrı ölçülmedi.
- **Önceki baseline testi ile karşılaştırma yapılmaz:** iki protokol farklı (baseline: 16 kişi + validation'a göre en iyi epoch, ayarsız; final: 21 kişi + sabit epoch, ayarlı). Baseline testi "ilk sonuçlar" tablosunda, final "son düzen" tablosunda durur.

Bu noktadan sonra yapılan her deney "keşif amaçlı" etiketiyle ayrı yazılır; dondurulmuş düzen ve bu sonuçlar değişmez.
