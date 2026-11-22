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

## Kalibrasyon

Telefonun belde duruşu HAPT kayıtlarındakinden farklı olabilir, bu yüzden önce kalibrasyon
yapılır. Telefon belde dik takılıyken "Kalibrasyon" düğmesine basılır ve üç adım sırayla
izlenir: ayakta, otururken, sırtüstü yatarken. Her adımda hazırlık (ayakta 5 sn, oturma 6 sn, yatma 12 sn), bip, 8 sn kayıt ve
yine bip vardır; kayıt sırasında kıpırdanmaz. Kayıtların ilk 1,5 sn'si atılır. İptal düğmesi,
geri tuşu ya da uygulamanın arka plana geçmesi kalibrasyonu iptal eder. Kalibrasyon sırasında
canlı çıkarım durur.

Yöntem: her duruşun telefon çerçevesindeki ortalama ivmesi (g, ham eksenler) HAPT eğitim
kişilerinin aynı duruştaki ortalama yerçekimi vektörüne en iyi eşleyen dönme R ile hizalanır
(Wahba problemi, ağırlıklar ayakta 1, oturma 1, yatma 2; quaternion tabanlı Davenport/Horn
çözümü, `Calibration.kt`). Sonra a_hapt = R a_app ivmeye ve gyro'ya aynı şekilde uygulanır.

Sonuç ekranı, kayıtları R ile döndürüp GRU'yu 128'lik window'larla (adım 64) çalıştırır ve her
duruş için doğru window sayısını, R'yi ve kaliteyi gösterir. Üç duruşta da oran en az %60 ve
ayakta ortalama ivme 0,8-1,2 g ise kalite "İyi"dir; R `SharedPreferences`'a kaydedilir ve
eksen eşlemede "Kalibre edilmiş" seçilir. Aksi halde "Düşük güven" ve olası neden yazılır;
sonuç ancak "Yine de kullan" ile uygulanır. Kayıtlı kalibrasyon açılışta varsayılan seçilir;
8 hazır seçenek yedek olarak kalır.

Simülasyonda (`experiments/calib_sim2.py`: HAPT test kullanıcıları, rastgele ayrık ve sürekli
telefon duruşları) 6 sınıflı window doğruluğu bu yöntemle 0,958-0,968, gerçek dönmeyi bilen
oracle ile 0,972-0,974, kalibrasyonsuz 0,23 oldu. Birim test (`CalibrationTest`), HAPT test
kullanıcısı 2'nin bilinen bir dönmeyle çevrilmiş gerçek window'larında (`calib_testdata.json`,
`experiments/make_calib_testdata.py`) Python sonucuyla aynı R'yi bulduğunu denetler.

Sınırlamalar: kalibrasyon gerçek bir telefonda denenmedi. HAPT'taki "yatma" sınıfı farklı
yatış pozlarının ortalamasıdır; sırtüstü yatmanın bu ortalamaya yakın olduğu bir varsayımdır.
Kalibrasyondaki doğru window sayısı yalnızca o kısa kayıtlar içindir.

## Sensör ve eksenler

- Girdi: [acc_x, acc_y, acc_z (g), gyro_x, gyro_y, gyro_z (rad/s)], HAPT eksen çerçevesinde.
  Accelerometer m/s² verir ve 9,80665'e bölünür; gyroscope zaten rad/s'dir.
- Eşleme genel bir 3x3 matristir (`AxisMapping`): "Kalibre edilmiş" seçeneği R'yi, hazır
  seçenekler aşağıdaki işaretli eksen matrislerini tutar.
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
- Kalibrasyon işe yaramazsa doğru eksen eşlemesi hazır seçeneklerle denenerek bulunur: ayakta
  dururken STANDING, otururken SITTING görülmelidir.

## Uygulamadaki model

`experiments/export/gru_demo/model.json`: donmuş GRU yapılandırması (bidirectional, mean/max pooling, 6 kanal, augmentasyon, yoğun window; 40 epoch), 21 eğitim kişisiyle, seed 0. UCI HAPT resmi test kümesinde (9 kişi) macro F1 0.885, accuracy 0.952 (`experiments/export/gru_demo/demo_gru_metrics.json`). Bu değerler kayıtlı veri seti içindir; bu telefonda ölçülmemiştir ve farklı cihaz, takılma yeri ve örnekleme nedeniyle düşük olabilir.
