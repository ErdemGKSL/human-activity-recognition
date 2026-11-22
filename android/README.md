# HAR Demo (Android)

Telefonda canlı insan aktivitesi tanıma demosu. Uygulama accelerometer ve gyroscope verisini
50 Hz'e yeniden örnekler, 128 örneklik (2,56 sn) window'larla her 64 örnekte (1,28 sn) bir
çift yönlü GRU modelini çalıştırır ve 12 sınıfı (6 aktivite, 6 postural transition) gösterir.
Kotlin ile yazıldı; yalnızca Android framework ve kotlin-stdlib kullanılır (androidx yok).
Paket adı `com.example.hardemo`.

## Derleme

Gereken: JDK 17+, Android SDK (platform 34, build-tools 34.0.0). SDK yolu
`android/local.properties` dosyasında (`sdk.dir=...`, gitignored) durur; dosya yoksa
`build.sh` onu `ANDROID_HOME` ya da `$HOME/android-sdk` ile yazar.

```bash
android/build.sh                 # assets'teki model.json ile
android/build.sh path/model.json # önce modeli assets'e kopyalar
```

Betik keystore yoksa üretir, birim testleri (`testDebugUnitTest`) çalıştırır, imzalı release
APK'yı derler, `apksigner verify` ile doğrular ve sonucu `android/dist/har-demo.apk` olarak
koyar. Minify kapalıdır.

## İmza anahtarı

`android/make_keystore.sh` geçici (throwaway) bir anahtar üretir: RSA 2048, 10000 gün,
rastgele parola. Anahtar `android/keystore/release.jks`, parola
`android/keystore/keystore.properties` içindedir; ikisi de gitignored. Anahtar kaybolursa yenisi
üretilir, ama telefondaki eski kurulum farklı imza yüzünden önce kaldırılmalıdır.

## Modeli değiştirme

Model `app/src/main/assets/model.json` dosyasıdır ve `experiments/har/export.py` çıktısıyla
aynı şemayı (`har-gru-v1`) kullanır. Repodaki dosya `experiments/export/dummy/model.json`
kopyasıdır: rastgele ağırlıklı, yalnızca geliştirme içindir ve uygulama bunu ekranda uyarıyla
belirtir. Gerçek model gelince `android/build.sh <model.json>` yeterlidir. Sınıf sırası
JSON'daki `labels` alanından okunur; Türkçe adlar `Signal.kt` içindeki tablodan gelir.

Birim test (`GruModelTest`) Kotlin çıkarımını modelin `test_vectors` alanındaki PyTorch
logit'leriyle karşılaştırır (mutlak hata < 1e-3). Yeni model bu testi geçmeden APK üretilmez.

## Sensör ve eksenler

- Girdi: [acc_x, acc_y, acc_z (g), gyro_x, gyro_y, gyro_z (rad/s)], HAPT eksen çerçevesinde.
  Accelerometer m/s² verir ve 9,80665'e bölünür; gyroscope zaten rad/s'dir.
- Telefon dik tutulunca yerçekimi +y'de okunur, HAPT'ta ayakta dururken +x'tedir: her seçenekte
  x_h = +y_a. (y_h, z_h) için 8 seçenek vardır, [1] = (−x_a, +z_a) varsayılandır.
- [1], [3], [5], [8] gerçek dönmelerdir (det +1) ve gyro'ya aynı matris uygulanır. [2], [4],
  [6], [7] aynadır (det −1); gyro eksensel vektör olduğu için bu seçeneklerde işareti ters çevrilir.
- Sensörler 20000 µs örnekleme periyoduyla kaydedilir. 20 ms'lik bir zamanlayıcı her tick'te
  son acc ve gyro değerini (zero-order hold) halka tampona yazar. Çıkarım ayrı bir thread'de
  çalışır. Uygulama arka plana geçince sensörler kapanır.

## Sınırlılıklar

- Uygulama yalnızca derlendi ve imzalandı. Bir telefonda ya da emülatörde çalıştırılmadı.
- Model UCI HAPT verisiyle eğitildi (bele takılı Samsung Galaxy S II, 50 Hz). Farklı konum,
  cihaz ve sensörlerde doğruluk düşebilir; projede ölçülen test sonucu telefonda geçerli değildir.
- Doğru eksen eşlemesi denemeyle bulunur: ayakta dururken STANDING, otururken SITTING
  görülmelidir.

## Uygulamadaki model

`experiments/export/gru_demo/model.json`: donmuş GRU yapılandırması (bidirectional, mean/max pooling, 6 kanal, augmentasyon, yoğun window; 40 epoch), 21 eğitim kişisiyle, seed 0. UCI HAPT resmi test kümesinde (9 kişi) macro F1 0.885, accuracy 0.952 (`experiments/export/gru_demo/demo_gru_metrics.json`). Bu değerler kayıtlı veri seti içindir; bu telefonda ölçülmemiştir ve farklı cihaz, takılma yeri ve örnekleme nedeniyle düşük olabilir.
