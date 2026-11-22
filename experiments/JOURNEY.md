# Deney günlüğü

Final Results raporunun "izlenen yol" bölümü bu dosyadan yazılır. Her adım: ne yapıldı, neden, hangi sonuç çıktı (tablo/dosya işaretiyle). Sonuç olmayan şey sonuç gibi yazılmaz.

## Adım 0: Baseline (tamamlandı)

- Veri: UCI #341. MLP resmi 561 feature ile; CNN/LSTM/GRU ham 128x6 window ile (window'lar bizim üretimimiz: en az %90 tek etiket, 10.776 window; resmi 10.929).
- Ayrım: resmi kişi bazlı (21 eğitim / 9 test); validation eğitim kişilerinden her 5. kişi.
- Düzen: AdamW 2e-3, cosine, 40 epoch, batch 128, dropout 0,3, class-weighted CE, augmentasyon yok, arama yok. 5 seed, Colab L4.
- Sonuç (`results/summary.md`): macro F1 MLP 0,841; 1D CNN 0,819; GRU 0,786; LSTM 0,666 (std 0,094, bir seed 0,484).
- Gözlem: transition sınıfları en zayıf (F1 0,43 ile 0,77); SITTING/STANDING ham modellerde zayıf.
- Karar: ham modelleri iyileştirmek için Fable'dan strateji istendi.

## Sonraki adımlar

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

(Her aşamanın CV sonucu buraya eklenecek.)
