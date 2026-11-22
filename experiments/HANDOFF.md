# Devir-teslim (22.11.2026, öğleden sonra)

Yeni oturum için: önce `AGENTS.md`, sonra bu dosya, `experiments/JOURNEY.md` (kronoloji ve tüm kararlar), `.claude/skills/colab-gpu/SKILL.md`. Kullanıcı Türkçe konuşur; her şeyi Türkçe yanıtla. Dal: `claude/zealous-lovelace-smjw8t`, bitince `git push origin HEAD:main`; commit mesajına oturumun attribution satırları eklenir. `v2` dalına dokunma. Yazı kuralları AGENTS.md "Writing prose" bölümünde (em-dash yok, İngilizce jargon İngilizce kalır, dürüst kip, her sayı bir tabloya/şekle işaret eder).

## Hedef
BİL 512 HAR projesi (UCI #341). Final Results raporu **29.11.2026 23:55**, sunum 30.11 veya 07.12. Literatür raporu ve 2. sunum tarihleri geçmiş görünüyor; kullanıcı onlara şimdilik dokunmamamızı istedi. Kullanıcı sonunda raporda "izlenen yol"u (ne yaptık, ne oldu, hangi karar) tane tane anlatmamızı istiyor; kaynak `JOURNEY.md` karar kronolojisi.

## Yöntem kuralları (Fable danışmanlığından)
- Kararlar yalnızca 21 eğitim kişisinde 5-fold kişi bazlı CV ile (havuzlanmış OOF macro F1) verilir. Baseline'ın test sonuçlarına teşhis için bakıldı; bu raporda açıkça yazılır.
- Test (9 kişi) dondurulmuş düzenle **bir kez** koşulur (`train2.py --mode final`), 10 seed, 2'şerli parçalarla (`--seeds 0 1`, ayrı `--name`). Final koşudan ÖNCE yapılandırmalar ve analiz planı `JOURNEY.md`'ye yazılıp commit edilir.
- Analiz: tekil ortalama ± std, 10 seed olasılık ortalaması (ensemble), kişi bazlı bootstrap (9 test kişisi, B=2000, percentile %95 GA), MLP'ye göre eşleştirilmiş Δ macro F1.
- "Ham modeller MLP'yi geçti" yalnızca eşleştirilmiş bootstrap GA'sı sıfırı dışlar ve CV ile aynı yöndeyse yazılır. Aksi halde "karşılaştırılabilir düzeyde". MLP'nin üstünlüğünün hazır feature'lardan geldiği (MLP-raw 0,80 vs 0,845) CV'de güçlü bir bulgu.
- MLP ve ham modellerin test kümeleri farklı (3.162 ve 3.124): raporda yazılır. 561 feature'ın resmi normalizasyonunun test kişilerini içerip içermediği doğrulanmadı (README'den kontrol et).
- Rapor tabloları: T1 ön sonuçlar (baseline test), T2 CV ablation, T3 dondurulmuş düzen test (ortalama ± std, ensemble, GA, CV yanında), T4 sınıf bazlı F1; Ş1 ablation grafiği, Ş2 iki confusion matrix, Ş3 eşleştirilmiş Δ. İlk sonuçlar ve son düzen ayrı tablolarda. PDF bileşenlerinde resim desteği yok (şekiller şimdilik yer tutucu); bir `Figure` bileşeni eklenmeli (takumi-pdf img desteğini dene).

## CV sonuçları (OOF macro F1, 3 seed; tam tablo `results2/ablation.md`)
MLP baseline 0,824 → ayarlı 0,845 (tavan; a1c 0,838, a1d 0,844, a1e sqrt 0,845). CNN: a0 0,807; a1b 0,822; c1 (deep+gravity) 0,833; d1 (yoğun window) 0,823; k1 (adım 64 + augmentasyon) 0,849; d2 (yoğun + aug) 0,855; e1s (d2 + sqrt ağırlık) 0,858. LSTM: a0 0,768; a1b 0,797; c1 0,808; d1 0,817; d2 log değerleri 0,862/0,855 (json yok). GRU: a0 0,776; a1b 0,779; c1 0,786; c1g 0,802; d1 0,811; d2 log değerleri 0,858/0,833 (json yok). MLP-raw 0,803 (6 kanal) / 0,808 (9 kanal). Augmentasyon ana kazanç (+0,017 CNN); yoğun window ≈ +0,006 (gürültü bandı).
Baseline test (5 seed, `results/summary.md`): MLP 0,841; CNN 0,819; GRU 0,786; LSTM 0,666.

## Colab durumu
- Aboneliğin Colab Pro. Runtime'lar üç kez silindi (ilk ikisinde sebep belirsiz; son ikisi "worker restarted" bildirimiyle aynı ana denk geldi, hipotez: runtime'lar açan oturumun worker'ına bağlı olabilir). Yeni oturumda yeni runtime aç; L4 açılamazsa T4 dene (L4 "Precondition check failed" verdi).
- Şu an çalışan T4 runtime'ı `runtimes/r-e5711110-744a-480b-b593-31cfd3ef8135` eski oturumun worker'ına bağlıysa düşebilir. Üzerinde `/content/exp/t1.log` (d2_lstm), `t2.log` (d2_gru), `t3.log` (k5_mlp_ref, k3/k4 MLP gürültü, k2_mlpraw) koşuyor. Önce `list_runtimes` ile bak; yoksa bu koşuları yeniden başlat (komutlar aşağıda).
- Sonuçları tek çağrıda repoya çekmek için `experiments/tools/colab_sync.py` (ortam: CB = runtime url, CT = token; token `list_runtimes` çıktısındadır, ~1 saat geçerli). Yükleme: `.claude/skills/colab-gpu/scripts/colab_up.py`.
- Her kontrol onay istemi çıkardığı için kullanıcı rahatsız: kontrolleri seyrek (15+ dk) ve tek çağrıda yap; mümkünse oturumu Auto moda al (mod menüsü kullanıcıda).

### Yeniden başlatma komutları (CV; `R="python train2.py --mode cv --data /content/exp/data --out /content/exp/cv"`, `D="--epochs 40 --lr 2e-3 --warmup 2 --clip 1 --tstep 16"`, `M="--epochs 100 --lr 1e-3 --warmup 3 --clip 1"`)
- `$R --model lstm --name d2_lstm $D --pool meanmax --bidir --gravity --aug`
- `$R --model gru --name d2_gru $D --pool meanmax --bidir --aug`
- `$R --model mlp --name k5_mlp_ref $M`; `... k3_mlp_n01 $M --noise 0.1`; `... k4_mlp_n03 $M --noise 0.3`
- `$R --model mlpraw --name k2_mlpraw $D --gravity --aug`
Kod `/content/exp` altında olmalı (`train2.py`, `har/`); yeni runtime'da `/content/exp/har` ve `/content/exp/cv` klasörlerini önce `os.makedirs` ile aç, sonra `colab_up.py` ile yükle.

## Sıradaki işler (Fable planı)
1. d2_lstm/d2_gru CV'yi 3 seed'e tamamla; MLP kapanış kolları ve MLP-raw+d2 (k2) bitir. Keşfi bu aşamada kapat.
2. Dondurma planını `JOURNEY.md`'ye yaz (MLP a1a veya a1e; CNN d2 veya e1s; LSTM d2; GRU d2; kontrol: MLP-raw d2), commit et.
3. Final koşu (test bir kez), çevrimdışı ensemble + bootstrap + tablolar/şekiller (`experiments/` altında analiz betiği yaz; `results2/final/` çıktıları).
4. Raporu yaz (`report/src/documents/final-results.tsx`; bölüm 2, 4, 5, 6, 7 ve "izlenen yol"): academic-humanizer ve avoid-ai-writing geçişleri, sonda değişiklik raporu. Sunum ve rehber de (`slides/.../final-results.ts`, `slide-directions/.../final-results.ts`) gerçek sayılarla doldurulur; slayt ekleme/çıkarmada rehber aynı commit'te güncellenir.
5. Gerçek telefon testi (rapor bölüm 8): Android uygulaması yazmak yerine hazır sensör kayıt uygulamasıyla ~10 dk, 50 Hz CSV; birim dönüşümü (m/s² → g) ve eksen eşleştirmesi; yalnızca ham modellerle çevrimdışı. Android kodlama gerekirse Opus alt ajanı (Agent, model "opus") kullanılabilir (kullanıcı onayladı). Yapılmazsa bölüm "planlanan / sınırlılık" olarak yazılır.
6. `colab-gpu` skill'ini son bulgularla güncelle (runtime ömrü/worker hipotezi, T4 yedeği, tek-çağrılık eşitleme betiği).
7. `bun run check` geçmeli; `cd report && bun run build final-results`.

## Eski oturumun zamanlanmış görevleri
Bu (eski) oturumdan kurulan `send_later` hatırlatmaları yalnızca eski oturuma düşer. Yeni oturum kendi hatırlatmalarını kurmalı.
