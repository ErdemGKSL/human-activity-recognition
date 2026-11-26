import { defineDirections } from "../types";

/**
 * Anlatıcı rehberi: 3. Sunum: Final Results (hedef ~25 dk, demo dahil).
 * Her sayı `report/src/documents/final-results.tsx` ile aynıdır; tablo numaraları
 * o rapora işaret eder. Telefonda ölçülmüş bir sonuç yoktur (rapor Bölüm 8):
 * demo nitel bir gösterimdir, sonuç gibi anlatılmaz.
 */
export const finalResults = defineDirections({
  deckId: "final-results",
  duration: "20–30 dakika (hedef ~25 dk; demo ~3 dk)",
  date: "30.11.2026 veya 07.12.2026 (kesinleşmedi)",
  summary:
    "Bu projede bele takılı bir akıllı telefonun accelerometer ve gyroscope sinyallerinden 12 sınıflı aktivite tanıma problemi ele alındı (6 temel aktivite, 6 postural transition; UCI #341). Aynı kişi bazlı eğitim/test ayrımında dört model karşılaştırıldı: veri setinin hazır 561 feature'ını kullanan MLP ile ham sinyal window'larını kullanan 1D CNN, LSTM ve GRU. Aynı MLP ham girdiyle de eğitildi (MLP-raw); bu kontrol, hazır feature'ların etkisini mimarinin etkisinden ayırmak içindi. İlk baseline'da sıralama MLP 0,841, 1D CNN 0,819, GRU 0,786, LSTM 0,666 oldu (test macro F1). Bu baseline'ın sorunları test sonuçlarına bakılarak teşhis edildi; bu yüzden sonraki her karar 21 eğitim kişisi üzerinde 5-fold kişi bazlı CV ile verildi, düzen ve analiz planı dondurulup commit edildi ve test kümesi en sonda bir kez koşuldu. Final testte ensemble macro F1 MLP için 0,864, 1D CNN için 0,921, LSTM için 0,928, GRU için 0,921 oldu. Önceden ilan edilen iddia eşiğine göre 1D CNN ve LSTM MLP'den yüksek sonuç verdi; GRU testte yüksek, CV'de ise MLP'den ayırt edilemez. Augmentasyonsuz düzende MLP'nin avantajı büyük ölçüde hazır feature'lardan geliyordu. Gerçek telefon verisiyle sayısal bir test yapılmadı; Android uygulaması canlı demo içindir.",
  opening: {
    duration: "~40 saniye",
    text: "Proje önerisinde üç soru sormuştuk: ham sinyal modelleri MLP baseline'ını geçebilir mi, hangi aktiviteler birbirine karışır ve kendi telefonumuzda benzer sonuç alabilir miyiz. Bugün ilk iki soruya sayılarla cevap vereceğim. İlk baseline'da cevap “hayır” gibi görünüyordu. Sonunda 1D CNN ve LSTM, önceden ilan ettiğimiz bir eşiğe göre MLP'den yüksek çıktı. Arada yöntemde bir hata yaptık ve düzelttik; o hikâyeyi de anlatacağım. Üçüncü soruya sayıyla cevap veremiyoruz; onun yerine telefonda canlı bir demo göstereceğim.",
  },
  overview: [
    "Dinleyici: yüksek lisans sınıfı ve hoca. Mimarilerin ne olduğunu değil, karşılaştırmanın nasıl adil ve dürüst yapıldığını anlatın.",
    "Hikâye üç parça: (1) ilk baseline beklenmedik çıktı, (2) yöntem düzeltildi ve her karar CV ile verildi, (3) dondurulmuş düzenle test bir kez koşuldu ve iddialar önceden ilan edilen eşiğe göre yazıldı.",
    "Sayılar rapordaki tablolarla birebir aynıdır (Tablo 5, 7, 8, 9, 10). Bir sayıyı söylerken hangi protokolden geldiğini de söyleyin: ilk baseline testi mi, CV mi, final test mi.",
    "İddia eşiği: “MLP'den yüksek” yalnızca 1D CNN ve LSTM için söylenir. GRU için “testte yüksek, CV'de ayırt edilemez”. “Ham modeller genel olarak MLP'den üstün” ya da “LSTM en iyisi” denmez.",
    "Telefon: uygulama hazır, ama telefonda doğruluk ölçülmedi. Demo sırasında görülen tahminler sonuç değildir; öyle anlatın.",
    "Süre planı: giriş ve veri ~6 dk (slayt 1–6), yöntem ve izlenen yol ~6 dk (7–9), sonuçlar ~8 dk (10–14), demo ~3 dk (15), kapanış ~2,5 dk (16–18). Demo çalışmazsa 15. slaytı 1 dakikada anlatıp geçin; toplam ~22 dk olur.",
    "Teslim: sunumun PDF'i (slides/output/final-results.pdf). PDF'te animasyon yok.",
  ],
  glossary: [
    {
      term: "Accuracy",
      meaning:
        "Doğru sınıflandırılan window'ların oranı. Büyük sınıflar baskın olduğu için transition hatalarını gizleyebilir; bu projede ikincil metrik.",
    },
    {
      term: "Augmentasyon",
      meaning:
        "Eğitim sırasında window'ları rastgele değiştirerek yeni örnek üretme. Burada en fazla ±12° rastgele rotation ve 0,9–1,1 arası genlik scaling; yalnızca ham modellerde ve yalnızca eğitim batch'lerinde.",
    },
    {
      term: "Baseline",
      meaning:
        "Diğer modellerin karşılaştırıldığı referans. Bu projede 561 feature'lı MLP. “İlk baseline” ise ayarsız ilk eğitim düzeninin adıdır (Tablo 5).",
    },
    {
      term: "Bidirectional",
      meaning:
        "Recurrent katmanın window'u hem baştan sona hem sondan başa okuması; iki yönün çıktıları birleştirilir. Final LSTM ve GRU bidirectional'dır.",
    },
    {
      term: "Bootstrap (kişi bazlı)",
      meaning:
        "Test kişilerinden yerine koyarak 9 kişilik yeni örneklemler çekip metriği her biri için yeniden hesaplama (B = 2.000). Sonuçların dağılımından %95 güven aralığı (GA) çıkar. Kişi çekildiği için kişiler arası farkı da içerir.",
    },
    {
      term: "Class-weighted loss",
      meaning:
        "Az örnekli sınıfların hatalarına daha büyük ağırlık veren loss. Burada w_c = N / (12 · n_c).",
    },
    {
      term: "Confusion Matrix",
      meaning:
        "Satırları gerçek sınıf, sütunları tahmin edilen sınıf olan tablo. Satır normalize edildiğinde bir hücre, o sınıfın örneklerinin ne kadarının hangi sınıfa tahmin edildiğini gösterir.",
    },
    {
      term: "Cross-validation (CV, 5-fold, kişi bazlı)",
      meaning:
        "21 eğitim kişisi beş gruba bölünür; her seferinde bir grup değerlendirilir, kalanlarla eğitilir. Bütün out-of-fold tahminler birleştirilip tek bir macro F1 hesaplanır (havuzlanmış OOF). Test kişileri hiç kullanılmaz.",
    },
    {
      term: "Dilation",
      meaning:
        "Convolution filtresinin girdideki noktaları aralıklı okuması. Dilation 2, filtrenin aynı parametreyle iki kat geniş bir zaman aralığını görmesini sağlar.",
    },
    {
      term: "Dondurma (freeze)",
      meaning:
        "Final yapılandırmalarının ve analiz planının test koşusundan önce yazılıp commit edilmesi. Test sonucunu gördükten sonra ayar değiştirmenin önüne geçer.",
    },
    {
      term: "Ensemble",
      meaning:
        "Aynı yapılandırmanın 10 farklı seed'le eğitilmiş modellerinin olasılıklarının ortalaması. Final tablosunda tekil seed ortalamasından ayrı verilir.",
    },
    {
      term: "Feature",
      meaning:
        "Bir window'dan hesaplanan özet sayı (ortalama, enerji, frekans bileşeni vb.). Veri setinde her window için 561 feature hazır gelir.",
    },
    {
      term: "Gravity/body ayrımı",
      meaning:
        "Ham ivmenin 0,3 Hz low-pass filter ile yerçekimi (gravity) ve vücut hareketi (body) bileşenlerine ayrılması. Açıkken girdi 9 kanal, kapalıyken 6 kanaldır.",
    },
    {
      term: "Güven aralığı (GA)",
      meaning:
        "Bootstrap dağılımının %2,5 ve %97,5 yüzdelikleri arasındaki aralık. Sıfırı dışlayan bir fark GA'sı, farkın yönünün kişi örneklemesine karşı dayanıklı olduğunu gösterir.",
    },
    {
      term: "Macro F1-score",
      meaning:
        "Her sınıfın F1-score'unun ağırlıksız ortalaması. 23 örnekli bir sınıf 1.423 örnekli bir sınıf kadar sayılır; bu projenin birincil metriği.",
    },
    {
      term: "Mean/max pooling",
      meaning:
        "Recurrent ya da convolutional katmanın tüm zaman adımlarındaki çıktısının ortalamasını ve maksimumunu alıp birleştirme. Yalnızca son zaman adımına bakmanın yerine kullanıldı.",
    },
    {
      term: "MLP-raw",
      meaning:
        "561 feature'lı MLP ile aynı mimari, ama girdi düzleştirilmiş ham window (128 × 9 = 1.152 sayı). Hazır feature'ların etkisini ölçen kontrol modeli.",
    },
    {
      term: "Overlap",
      meaning:
        "Ardışık window'ların ortak kısmı. Değerlendirme window'ları adım 64 ile (%50 overlap), yoğun window'lu eğitim adım 16 ile (%87,5 overlap) üretildi.",
    },
    {
      term: "Postural transition",
      meaning:
        "İki duruş arasındaki kısa geçiş: STAND_TO_SIT, SIT_TO_STAND, SIT_TO_LIE, LIE_TO_SIT, STAND_TO_LIE, LIE_TO_STAND. Az örnekli sınıflardır.",
    },
    {
      term: "Seed",
      meaning:
        "Rastgele sayı üretecinin başlangıç değeri. Aynı yapılandırma farklı seed'lerle biraz farklı sonuç verir; ± değerleri bu farkın standart sapmasıdır.",
    },
    {
      term: "Window",
      meaning:
        "Sinyalin 128 ölçümlük (2,56 sn) parçası. Model her window için bir sınıf tahmin eder.",
    },
    {
      term: "Yoğun window",
      meaning:
        "Eğitim window'larının adım 16 ile üretilmesi; bir epoch'ta yaklaşık dört kat window olur. Değerlendirme window'ları her zaman adım 64'tür.",
    },
  ],
  questions: [
    {
      question: "İlk baseline'da test kümesine baktınız. Bu final sonuçlarını geçersiz kılmaz mı?",
      answer:
        "Baktık ve raporda açıkça yazdık (Bölüm 5.5). İlk baseline'ın sorunlarını test kümesinin confusion matrix'ine ve sınıf bazlı F1 değerlerine bakarak teşhis ettik. Bunu fark ettikten sonra kuralı değiştirdik: sonraki her karar yalnızca 21 eğitim kişisi üzerinde CV ile verildi, final düzen ve analiz planı test koşusundan önce commit edildi ve test bir kez koşuldu. Sayısal kararlar test sonucuna dayanmadı. Yine de araştırma yönü, örneğin ham modelleri iyileştirmeye odaklanmak, o ilk bakıştan etkilenmiş olabilir; bunu sınırlılıklarda belirttik.",
    },
    {
      question: "Neden validation set yerine CV kullandınız?",
      answer:
        "İlk baseline'da validation set 5 kişiydi ve en iyi epoch'u bu 5 kişiye göre seçiyorduk. Bu seçim gürültülüydü: aynı baseline düzeni CV'de ölçüldüğünde LSTM 0,768 aldı, testteki 0,666 görülmedi (Tablo 7). 5-fold kişi bazlı CV, 21 kişinin hepsini değerlendirmede kullanır ve tek bir küçük gruba bağlı kalmaz. Ayrıca CV, test kümesine dokunmadan karar vermemizi sağladı.",
    },
    {
      question: "GRU neden gravity/body ayrımı olmadan, 6 kanalla eğitildi?",
      answer:
        "CV'de GRU'ya fayda vermediği için. A1a düzeninde gravity eklemek 1D CNN'de +0,018, LSTM'de +0,010 getirdi, GRU'da -0,003 oldu (Tablo 7). Karar kuralımız “CV'de faydası olan eklenir” olduğu için GRU 6 kanalla dondu. Bunun neden böyle olduğunu ayrıca incelemedik.",
    },
    {
      question:
        "GRU testte MLP'den +0,055 yüksek ve GA sıfırı dışlıyor. Neden “GRU MLP'yi geçti” demiyorsunuz?",
      answer:
        "Çünkü test koşusundan önce iki koşul ilan ettik: test farkının GA'sı sıfırı dışlamalı ve CV'deki fark aynı yönde olmalı. GRU'da CV farkı 0,000 (0,845 ve 0,845). İkinci koşul sağlanmadı. Kuralı sonuca göre esnetirsek ilan etmenin anlamı kalmaz; bu yüzden “testte yüksek, CV'de ayırt edilemez” diyoruz.",
    },
    {
      question: "MLP-raw bulgusu ne söylüyor?",
      answer:
        "İki şey. Augmentasyonsuz düzende aynı MLP ham girdiyle 0,803–0,808, 561 feature ile 0,845 aldı; yani o düzende MLP'nin avantajı büyük ölçüde hazır feature'lardan geliyordu. Augmentasyon ve yoğun window eklenince MLP-raw 0,840'a çıktı ve fark 0,005'e indi; testte de MLP ile ayırt edilemedi (-0,005 [-0,055; +0,043]). Ama macro F1'deki bu eşitlik aynı davranış demek değil: MLP-raw'ın accuracy'si daha düşük (0,914 ve 0,940) ve SITTING/STANDING'de zayıf. Eşitlik, transition sınıflarındaki daha yüksek ortalamasından geliyor.",
    },
    {
      question: "Gerçek telefon testi neden yapılmadı?",
      answer:
        "Bu çalışmada yapılmadı; öncelik dondurulmuş final koşusunu tamamlamaktı (gerçek sebebi kendi cümlenizle söyleyin). Bu test yapılmadan telefondaki doğruluk hakkında bir şey söyleyemeyiz; farklı cihaz, takılma biçimi ve kişi nedeniyle düşük çıkması beklenebilir.",
    },
    {
      question: "Android uygulamasında neden yalnızca GRU var?",
      answer:
        "Dört final modelden yalnızca GRU, gravity/body ayrımı olmadan 6 kanalla dondu. Bizim gravity ayrımımız kayıt düzeyinde ve sıfır fazlı bir filtreyle yapılıyor; bu, kayıt bitmeden uygulanamaz. GRU telefondan gelen 6 kanalı doğrudan kullanabiliyor. Ayrıca final modeller arasında en az parametreli olanı (105.228). Bu bir başarı sıralaması değildir: üç ham model arasında sıralama yapmıyoruz.",
    },
    {
      question: "Test değerleri neden CV'den bu kadar yüksek?",
      answer:
        "MLP'de yaklaşık +0,015, ham modellerde yaklaşık +0,04. Üç olası sebep var: final modeller 21 kişiyle eğitildi (CV'de fold başına 16–17), ham modeller ek kişiden daha çok yararlanıyor olabilir ve 9 test kişisi daha kolay olabilir. Bu deneylerle bunları ayıramadık.",
    },
    {
      question: "LSTM 0,928 ile en yüksek. LSTM en iyi model mi?",
      answer:
        "Bunu söyleyemeyiz. 1D CNN, LSTM ve GRU'nun GA'ları büyük ölçüde örtüşüyor ([0,888; 0,947], [0,888; 0,955], [0,874; 0,951]) ve aralarında eşleştirilmiş test yapmadık. Söyleyebildiğimiz şey her birinin MLP'ye göre durumu.",
    },
    {
      question: "MLP ile ham modellerin test kümeleri farklıysa karşılaştırma adil mi?",
      answer:
        "Kişiler aynı, window'lar birebir aynı değil: 3.162 ve 3.124 örnek. Resmi dosyalar hangi feature satırının hangi ham window'a karşılık geldiğini vermediği için ham window'ları kendimiz ürettik. Eşleştirilmiş bootstrap aynı kişileri çeker ama aynı window'ları değil. Fark %1,4 ve en çok transition sınıflarında; bunu sınırlılık olarak raporladık.",
    },
  ],
  slides: {
    cover: {
      time: "1 dk",
      goal: "Bu sunumun planlar değil, ölçülmüş sonuçlar sunduğu anlaşılmalı.",
      script: [
        "Açılış konuşmasını (bkz. “Açılış Konuşması”) bu slayt açıkken yapın. Kendinizi tanıtın: Erdem Göksel, 261402103.",
        "Proposal'daki üç soruya geri döneceğinizi söyleyin; dinleyici neyin cevaplandığını takip edebilsin.",
      ],
      tips: [
        "Telefon yanınızda ve uygulama açık olsun; kapakta telefonu kısaca gösterip “sonda bunu canlı göreceğiz” deyin.",
        "Kapakta tarih yok; sunum tarihi kesinleşmediği için bilerek boş bırakıldı.",
      ],
      funFacts: [
        "Veri setinin kayıtları bele takılı bir Samsung Galaxy S II ile toplandı. Bizim demo telefonumuz başka bir cihaz; bu fark, veri setindeki test sonucunun telefona doğrudan taşınamamasının bir sebebi.",
      ],
      transition: "Bugün neleri konuşacağımıza bakalım.",
    },
    agenda: {
      time: "30 sn",
      goal: "Akış: veri ve modeller, yöntem, sonuçlar, demo, kapanış.",
      script: [
        "Önce problemi ve modelleri hatırlatacağım. Sonra yöntemde neyi değiştirdiğimizi ve neden değiştirdiğimizi anlatacağım; sonuçları bu düzenle okumak gerekiyor. Ardından sonuçları, karşılaştırmayı, demoyu ve sınırlılıkları göstereceğim.",
      ],
      tips: ["Maddeleri okumayın; tek cümlede akışı söyleyin."],
      transition: "Problemi kısaca hatırlayalım.",
    },
    overview: {
      time: "1,5 dk",
      goal: "Dört model ve bir kontrol modeli aynı ayrımda, macro F1 ile karşılaştırıldı.",
      script: [
        "Problem: bele takılı telefonun 6 sensör kanalından 12 sınıfı ayırt etmek. Altısı yürüme, merdiven, oturma, ayakta durma, uzanma gibi temel aktiviteler; altısı bu duruşlar arasındaki geçişler.",
        "MLP, veri setinin hazır 561 feature'ını kullanıyor. 1D CNN, LSTM ve GRU ham sinyali kullanıyor. Proposal'da bu farkın karşılaştırmayı bulandıracağını söylemiştik; bu yüzden aynı MLP'yi ham girdiyle de eğittik. Adı MLP-raw; kontrol modeli.",
        "Birincil metrik test macro F1. Neden accuracy değil, bir sonraki slaytlardan birinde göreceğiz.",
      ],
      data: [
        { label: "12 sınıf", meaning: "6 temel aktivite + 6 postural transition." },
        {
          label: "30 gönüllü, 21 eğitim · 9 test",
          meaning:
            "Veri setinin resmi kişi bazlı ayrımı (%70 / %30). Test kişileri hiçbir adımda eğitimde ya da model seçiminde kullanılmadı.",
        },
        {
          label: "4 + 1 model",
          meaning: "MLP, 1D CNN, LSTM, GRU ve kontrol modeli MLP-raw.",
        },
      ],
      transition: "Veriye ve ön işlemeye geçelim.",
    },
    data: {
      time: "1,5 dk",
      goal: "İki farklı girdi temsili var ve test kümeleri bu yüzden birebir aynı değil.",
      script: [
        "Sinyaller 50 Hz'de kaydedilmiş ve 128 ölçümlük, yani 2,56 saniyelik window'lara bölünüyor; window'lar 64 ölçüm kayarak ilerliyor, yani %50 overlap.",
        "Resmi dosyalarda her satır 561 feature'lık bir vektör, ama hangi satırın hangi ham window olduğu yazmıyor. Bu yüzden ham modeller için window'ları kendimiz ürettik. Kural: window'un en az %90'ı aynı etiketli segmente düşmeli. Sonuç: 10.776 window, resmi 10.929'a göre %1,4 eksik. Test kümesinde MLP 3.162, ham modeller 3.124 örnekle ölçülüyor; kişiler aynı, window'lar birebir aynı değil.",
        "İki ön işleme seçeneği daha var. Gravity/body ayrımı, ivmeyi 0,3 Hz low-pass filter ile yerçekimi ve hareket bileşenlerine ayırıyor; açıkken girdi 9 kanal oluyor. Augmentasyon yalnızca ham modellerde ve yalnızca eğitimde: küçük rastgele rotation ve genlik scaling.",
      ],
      data: [
        { label: "128 ölçüm, adım 64", meaning: "50 Hz × 2,56 s = 128; %50 overlap." },
        {
          label: "10.929 / 3.162",
          meaning: "Resmi 561 feature'lık örnekler: toplam ve test kümesi (MLP). Tablo 1.",
        },
        {
          label: "10.776 / 3.124",
          meaning:
            "%90 tek etiket kuralıyla üretilen ham window'lar: toplam ve test (ham modeller). Tablo 1.",
        },
        {
          label: "±12° rotation, 0,9–1,1 scaling",
          meaning:
            "Augmentasyon: her window rastgele bir eksen etrafında en fazla 12° döndürülür, genliği rastgele bir katsayıyla ölçeklenir.",
        },
      ],
      tips: [
        "“Test kümeleri birebir aynı değil” cümlesini burada söyleyin; sınırlılıklar slaytında geri döneceksiniz.",
      ],
      transition: "Sınıfların dağılımı metrik seçimini belirledi.",
    },
    "class-balance": {
      time: "1 dk",
      goal: "Sınıflar çok dengesiz; bu yüzden birincil metrik macro F1.",
      script: [
        "Eğitim kümesindeki en büyük sınıf STANDING, 1.423 örnek. En küçüğü SIT_TO_STAND, 23 örnek. Aradaki oran yaklaşık 62 kat.",
        "Accuracy büyük sınıflara göre şekillenir; transition'ları tamamen yanlış bilen bir model bile yüksek accuracy alabilir. Macro F1 her sınıfa eşit ağırlık verir. Kayıpta da class-weighted loss kullandık.",
        "Son kart önemli: test kümesinde bir transition sınıfı 10 ile 49 örnekle temsil ediliyor. Sınıf bazlı farkları yorumlarken bunu hatırlayacağız.",
      ],
      data: [
        {
          label: "1.423 ve 23",
          meaning:
            "Eğitim kümesinde en büyük ve en küçük sınıfın örnek sayısı (rapor Bölüm 3, Şekil 1).",
        },
        { label: "~62×", meaning: "1.423 / 23; rapordaki “yaklaşık 62 katı”." },
        {
          label: "10–49",
          meaning: "Resmi test kümesinde transition sınıflarının örnek sayısı aralığı.",
        },
      ],
      visuals: [
        "Raporun Şekil 1'i (experiments/results/class_distribution.png) sınıf başına çubuk grafiği gösterir. Slayt hattı görsel desteklemediği için slaytta yok; soru gelirse rapordan gösterin.",
      ],
      transition: "Bu veriyle eğittiğimiz final mimarilere bakalım.",
    },
    models: {
      time: "1 dk",
      goal: "Final mimariler CV ile seçildi; parametre sayıları aynı mertebede.",
      script: [
        "MLP 256 ve 128 nöronlu iki gizli katman. MLP-raw aynı yapı, ama girdisi 128 × 9'luk ham window düzleştirilmiş hâli; bu yüzden parametre sayısı daha büyük.",
        "1D CNN dört convolutional blok, son üçünde dilation 2. LSTM ve GRU iki katmanlı, bidirectional ve zaman boyunca mean/max pooling kullanıyor. CNN ve LSTM 9 kanal, GRU 6 kanal: GRU'da gravity ayrımı CV'de fayda vermedi.",
        "Bu yapılar baştan böyle değildi. İlk baseline'da CNN üç bloktu, RNN'ler tek yönlüydü ve yalnızca son zaman adımına bakıyordu. Bunların nasıl değiştiğini birazdan göreceğiz.",
      ],
      data: [
        { label: "178.316", meaning: "MLP parametre sayısı (baseline ve final aynı)." },
        { label: "329.612", meaning: "MLP-raw: 1.152 boyutlu girdi ilk katmanı büyütüyor." },
        {
          label: "138.700 / 140.812 / 105.228",
          meaning: "1D CNN, LSTM, GRU final sürümleri (Tablo 2).",
        },
      ],
      funFacts: [
        "Kontrol modeli MLP-raw, tablodaki en çok parametreli model; buna rağmen testte MLP ile ayırt edilemiyor. Parametre sayısı tek başına bir şey söylemiyor.",
      ],
      transition: "Önce yöntemde neyi değiştirdiğimizi anlatmam gerekiyor.",
    },
    method: {
      time: "2,5 dk",
      goal: "Test kümesine bir kez bakıldı; sonra her karar CV ile verildi ve test en sonda bir kez koşuldu.",
      script: [
        "Turuncu ilk adım bir hatayı gösteriyor. İlk baseline'ın sorunlarını test kümesinin confusion matrix'ine bakarak teşhis ettik. Bundan sonra test sonucuna göre ayar yapmaya devam etseydik, test sonucu iyimser çıkacaktı.",
        "Bu yüzden kuralı değiştirdik. Her karar 21 eğitim kişisi üzerinde 5-fold kişi bazlı CV ile verildi; her seçenek 3 seed'le denendi. Aynı arama bütçesi MLP'ye de verildi.",
        "Keşif bitince final yapılandırmalarını ve analiz planını test koşusundan önce yazıp commit ettik. Sonra her modeli 10 seed'le eğitip test kümesinde bir kez ölçtük.",
        "Son adım belirsizlik. Test kümesi 9 kişi; seed'in standart sapması kişiden kişiye değişimi içermiyor. Bu yüzden 9 kişiden yerine koyarak 2.000 kez örneklem çektik ve %95 güven aralığı hesapladık. Alttaki iddia eşiğini de önceden ilan ettik: bir ham model için “MLP'den yüksek” demek için eşleştirilmiş farkın GA'sı sıfırı dışlamalı ve CV'de fark aynı yönde olmalı.",
      ],
      data: [
        {
          label: "5-fold CV, 21 kişi, 3 seed",
          meaning:
            "Her seçenek için havuzlanmış out-of-fold macro F1; 3 seed ortalaması. Seed std'si 0,002–0,020; 0,01'in altındaki farklar gürültü sayıldı.",
        },
        { label: "10 seed, tek koşu", meaning: "Final: 21 kişiyle eğitim, sabit epoch, seed 0–9." },
        {
          label: "B = 2.000",
          meaning: "Kişi bazlı bootstrap tekrar sayısı; percentile yöntemiyle %95 GA.",
        },
      ],
      tips: [
        "Turuncu kartı gösterip durun. Hatayı kendiniz söylemeniz, hocanın sormasından iyidir.",
        "İddia eşiğini yavaş okuyun; karşılaştırma slaytında bu cümleye geri döneceksiniz.",
      ],
      funFacts: [
        "Tek bir RNN yapılandırmasının CV'si CPU'da yaklaşık 1,5 saat, Colab L4 GPU'da yaklaşık 5 dakika olarak tahmin edildi; eğitim bu yüzden Colab'a taşındı.",
      ],
      transition: "Bu kuralla CV'de neler denediğimize bakalım.",
    },
    journey: {
      time: "2 dk",
      goal: "Kazancın büyük kısmı eğitim düzeninden geldi; baseline MLP dahil herkes için eksik ayarlıydı.",
      script: [
        "Tablodaki her satır CV macro F1. İlk satır sürpriz: yalnızca 100 epoch, warmup ve gradient clipping eklemek MLP'yi 0,824'ten 0,845'e çıkardı. Baseline yalnızca ham modeller için değil, MLP için de eksik ayarlıydı.",
        "LSTM'de bidirectional ve mean/max pooling birlikte 0,771'den 0,787'ye; tek başına pooling fayda vermedi. CNN'de dört bloklu, dilation'lı yapı 0,809'dan 0,830'a.",
        "CNN'de en büyük tek kazanç augmentasyon: 0,833'ten 0,849'a, +0,016. Bunu yalnızca CNN için ayrıştırabildik; LSTM ve GRU'da augmentasyonu tek başına deneyen kolu koşmadık.",
        "MLP-raw satırı bir sonraki bölümün habercisi: aynı MLP ham girdiyle 0,808'den augmentasyon ve yoğun window'la 0,840'a çıktı. Son satır yolun tamamı: LSTM baseline düzeninde 0,768'di, final düzende 0,857.",
      ],
      data: [
        { label: "0,824 ile 0,845", meaning: "MLP, A0'dan A1a'ya (Tablo 7)." },
        {
          label: "0,771 ile 0,787",
          meaning: "LSTM, A1a'dan A1a + bidirectional + mean/max'a (+0,016).",
        },
        { label: "0,809 ile 0,830", meaning: "1D CNN, A1a'dan derin CNN'e (+0,021)." },
        {
          label: "0,833 ile 0,849",
          meaning: "1D CNN, C1'den K1'e: yalnızca augmentasyon (+0,016).",
        },
        {
          label: "0,808 ile 0,840",
          meaning: "MLP-raw, 9 kanal augmentasyonsuz (A1a + gravity) ile D2 düzeni.",
        },
        { label: "0,768 ile 0,857", meaning: "LSTM, A0'dan D2'ye: bütün değişiklikler birlikte." },
      ],
      tips: [
        "Bütün satırları okumayın; MLP satırı, augmentasyon satırı ve son satır yeter.",
        "CNN'de augmentasyona yoğun window eklemek 0,849'dan 0,855'e götürdü; bu +0,006 gürültü bandında. Soru gelirse böyle söyleyin.",
      ],
      funFacts: [
        "Colab runtime'ı iki kez beklenmedik biçimde silindi ve o ana kadarki CV çıktıları kayboldu. Izgara yeniden koşulduğunda A0 sonuçları öncekiyle aynı çıktı; istemeden bir tekrarlanabilirlik testi yapmış olduk.",
      ],
      transition: "Bu düzeltmelerden önce, ilk baseline testte ne vermişti?",
    },
    baseline: {
      time: "1,5 dk",
      goal: "İlk baseline'da ham modeller MLP'nin gerisindeydi; bu sonuç ayrı bir protokoldür.",
      script: [
        "Bunlar ilk sonuçlar: 16 kişiyle eğitim, 5 kişilik validation'a göre en iyi epoch, ayarsız düzen, 5 seed. MLP 0,841, 1D CNN 0,819, GRU 0,786, LSTM 0,666.",
        "LSTM kararsızdı: standart sapma 0,094. Aynı düzen CV'de ölçüldüğünde LSTM 0,768 aldı; o çöküş büyük ölçüde epoch seçiminin şansına bağlı görünüyordu.",
        "Bu tabloyu final tabloyla yan yana koymuyoruz, çünkü protokol farklı. Ama hikâyenin başlangıcı bu: proposal'da “ham modeller MLP'ye yakın olur” demiştik ve ilk bakışta değillerdi.",
      ],
      data: [
        {
          label: "0,841 / 0,819 / 0,786 / 0,666",
          meaning:
            "Test macro F1, 5 seed ortalaması (Tablo 5). Mavi çubuk o düzende en yüksek olan MLP.",
        },
        {
          label: "LSTM std 0,094",
          meaning:
            "Seed'ler arası büyük oynama; seed'lerden biri yaklaşık 0,48'de kaldı (deney günlüğü).",
        },
      ],
      tips: ["“İlk sonuçlar” etiketini vurgulayın; dinleyici bunu final sonuç sanmasın."],
      transition: "Şimdi dondurulmuş düzenin final test sonuçları.",
    },
    "final-chart": {
      time: "1 dk",
      goal: "Final testte üç ham model MLP'nin üzerinde; MLP-raw MLP ile aynı düzeyde.",
      script: [
        "Bu çubuklar ensemble macro F1: her model için 10 seed'in olasılıkları ortalanmış. Mavi olan MLP, referans: 0,864. MLP-raw 0,862. 1D CNN 0,921, LSTM 0,928, GRU 0,921.",
        "Çubuklar 0 ile 1 arasında çizildi; farklar küçük görünüyor, çünkü gerçekten birkaç puan. Hangisinin anlamlı olduğunu birazdan güven aralıklarıyla göreceğiz.",
      ],
      data: [
        {
          label: "0,864 / 0,862 / 0,921 / 0,928 / 0,921",
          meaning: "Ensemble test macro F1 (Tablo 8).",
        },
        {
          label: "Mavi çubuk",
          meaning: "MLP baseline'ı; renk bir kazanan göstermiyor, referansı gösteriyor.",
        },
      ],
      tips: [
        "LSTM'in çubuğu en uzun, ama “en iyi” demeyin; üç ham model arasında sıralama yapmıyoruz.",
      ],
      transition: "Aynı sonuçların ayrıntısı ve belirsizliği.",
    },
    "final-table": {
      time: "1,5 dk",
      goal: "Tekil seed ortalaması, ensemble ve kişi bazlı GA ayrı ayrı okunmalı.",
      script: [
        "İlk sütun 10 seed'in ortalaması ve standart sapması. Ensemble, ham modellerde tekil ortalamanın belirgin üstüne çıkıyor: CNN 0,894'ten 0,921'e, LSTM 0,898'den 0,928'e, GRU 0,888'den 0,921'e. MLP'de artış küçük, 0,860'tan 0,864'e.",
        "%95 GA sütunu 9 test kişisinden bootstrap. Aralıklar geniş: MLP için 0,823 ile 0,899 arası. Ham modellerin aralıkları birbiriyle büyük ölçüde örtüşüyor; bu yüzden CNN, LSTM ve GRU'yu sıralamıyoruz.",
        "Son sütun ensemble accuracy. MLP-raw'ın 0,914'ü diğerlerinden düşük; buna MLP-raw slaytında döneceğim.",
      ],
      data: [
        {
          label: "± değerleri",
          meaning: "10 seed'in standart sapması; kişi belirsizliğini içermez.",
        },
        {
          label: "%95 GA",
          meaning:
            "Yalnızca ensemble için; 9 test kişisi üzerinde kişi bazlı bootstrap, B = 2.000.",
        },
        {
          label: "Ens. accuracy",
          meaning: "Ensemble accuracy: 0,941 / 0,914 / 0,972 / 0,975 / 0,976 (Tablo 8).",
        },
        { label: "Test örnek sayısı", meaning: "MLP 3.162, diğerleri 3.124." },
      ],
      tips: ["GA sütununu parmakla gösterin; “aralıklar geniş, çünkü 9 kişi” cümlesi yeter."],
      transition: "İddiayı MLP'ye göre eşleştirilmiş farkla kuruyoruz.",
    },
    comparison: {
      time: "2 dk",
      goal: "İddia eşiği yalnızca 1D CNN ve LSTM için sağlandı.",
      script: [
        "Bu tablo önceden ilan ettiğimiz kuralın uygulanışı. Test farkı, aynı kişi çekilişlerinde model eksi MLP. 1D CNN +0,056, GA [+0,026; +0,093]; LSTM +0,063, GA [+0,029; +0,097]. İkisinde de GA sıfırı dışlıyor ve CV farkı aynı yönde: +0,010 ve +0,012. Bu yüzden şunu söyleyebiliriz: bu veri setinde ve bu düzende 1D CNN ve LSTM, test macro F1'de MLP'den yüksek sonuç verdi.",
        "GRU testte de yüksek, +0,055 ve GA sıfırı dışlıyor. Ama CV'de fark sıfır: 0,845 ve 0,845. İkinci koşul sağlanmadı. GRU için söyleyebileceğimiz: testte yüksek, CV'de ayırt edilemez.",
        "MLP-raw ise MLP'den ayırt edilemiyor: -0,005 ve GA sıfırı içine alıyor.",
        "Bir uyarı: CV farkları 0,01 civarında ve tek başına gürültü bandında. Test farkı yaklaşık 0,06 ile CV'den büyük ve 9 kişi yüzünden GA geniş.",
      ],
      data: [
        {
          label: "Test farkı",
          meaning: "Ensemble macro F1, model - MLP; eşleştirilmiş kişi bazlı bootstrap (Tablo 9).",
        },
        {
          label: "CV farkı",
          meaning:
            "Tablo 7'deki dondurulmuş satırların farkı (ör. CNN 0,855 - MLP 0,845 = +0,010).",
        },
        { label: "“Eşik sağlanmadı”", meaning: "GRU: GA sıfırı dışlıyor ama CV farkı 0,000." },
      ],
      tips: [
        "Bu slaytta yavaşlayın; sunumun ana iddiası burada.",
        "“Ham modeller MLP'yi geçti” gibi genelleyen bir cümle kurmayın. Tek veri seti, tek MLP ve sınırlı arama var.",
      ],
      transition: "Peki MLP'nin hazır feature'ları ne kadar fark yaratıyordu?",
    },
    "feature-vs-arch": {
      time: "2 dk",
      goal: "MLP'nin avantajı augmentasyonsuz düzende hazır feature'lardan geliyordu; augmentasyonla kapandı.",
      script: [
        "İlk üç kart CV macro F1. Augmentasyon olmadan aynı MLP, ham girdiyle 0,808 aldı (9 kanal; 6 kanalla 0,803). 561 feature ile 0,845. Mimari aynı, girdi farklı: o düzende MLP'nin avantajı büyük ölçüde hazır feature'lardan geliyordu.",
        "Augmentasyon ve yoğun window eklenince MLP-raw 0,840'a çıktı; fark 0,005'e indi. Testte de MLP ile ayırt edilemiyor.",
        "Son kart dikkat istiyor. Macro F1 eşit diye iki model aynı değil. MLP-raw'ın test accuracy'si 0,914, MLP'nin 0,940 (10 seed ortalaması). MLP-raw SITTING ve STANDING'de zayıf; eşitlik transition sınıflarındaki daha yüksek ortalamasından geliyor.",
        "Aynı ham girdiyi kullanan CNN, LSTM ve GRU testte MLP-raw'dan yüksek. Bu, ham girdide mimarinin de etkisi olduğuyla uyumlu; ama bu fark için eşleştirilmiş test yapmadık.",
      ],
      data: [
        { label: "0,808", meaning: "MLP-raw, A1a + gravity (9 kanal), augmentasyonsuz, CV." },
        {
          label: "0,840",
          meaning: "MLP-raw, D2 düzeni (gravity, yoğun window, augmentasyon), CV.",
        },
        { label: "0,845", meaning: "MLP, 561 feature, A1a (final düzeni), CV." },
        {
          label: "0,914 ve 0,940",
          meaning: "Test accuracy, 10 seed ortalaması: MLP-raw ve MLP (Tablo 8).",
        },
      ],
      tips: [
        "“Feature'lar işe yaramıyor” sonucuna gitmeyin. Doğru cümle: bulgu düzene bağlı; augmentasyonsuz karşılaştırmada geçerli.",
      ],
      transition: "Sınıf bazında hangi farklar var?",
    },
    "per-class": {
      time: "1,5 dk",
      goal: "Ham modeller hem temel aktivitelerde hem transition'larda MLP'den yüksek; en zor sınıflar uzanmayla biten geçişler.",
      script: [
        "İlk iki satır ortalamalar. Temel aktivitelerde MLP 0,952, ham modeller 0,979 ile 0,984 arası. Transition'larda fark daha büyük: MLP 0,776, ham modeller 0,858 ile 0,874 arası.",
        "SITTING satırı MLP-raw'ın zayıf noktası: 0,799. Proposal'da en çok oturma ile ayakta durmanın karışacağını beklemiştik. MLP'de SITTING örneklerinin 0,11'i STANDING'e kaydı; LSTM'de 0,06.",
        "Son satır en zor sınıflardan biri, SIT_TO_LIE: 0,688 ile 0,794 arası. Confusion matrix'te bu sınıf STAND_TO_LIE ile karışıyor: MLP'de SIT_TO_LIE örneklerinin 0,28'i STAND_TO_LIE diye tahmin edildi. İki hareket de uzanarak bitiyor.",
        "Transition sınıfları testte az örneğe dayanıyor, ham modellerde toplam 157 window. Sınıf bazlı farkları kesin yorumlamıyoruz.",
      ],
      data: [
        { label: "Aktivite ort.", meaning: "İlk 6 sınıfın ortalama F1'i (Tablo 10)." },
        {
          label: "Transition ort.",
          meaning: "Son 6 sınıfın ortalama F1'i: 0,776 / 0,801 / 0,863 / 0,874 / 0,858.",
        },
        { label: "SITTING", meaning: "0,920 / 0,799 / 0,957 / 0,961 / 0,968." },
        {
          label: "SIT_TO_LIE",
          meaning:
            "0,688 / 0,725 / 0,794 / 0,750 / 0,767; en zayıf iki sınıftan biri (diğeri STAND_TO_LIE).",
        },
      ],
      visuals: [
        "Raporun Şekil 3–7'si (experiments/results2/final/confusion_*.png) satır normalize confusion matrix'lerdir. Slayt hattı görsel desteklemiyor; soru gelirse rapordan gösterin.",
      ],
      funFacts: [
        "LIE_TO_SIT'te LSTM 0,950, CNN 0,826 aldı. Kulağa büyük fark gibi geliyor, ama bu sınıfın resmi test kümesinde yalnızca 25 örneği var; birkaç window sonucu değiştirir.",
      ],
      transition: "Şimdi modeli telefonda görelim.",
    },
    demo: {
      time: "3 dk (demo çalışmazsa 1 dk)",
      goal: "Uygulama çalışıyor ve canlı tahmin yapıyor; bu bir ölçüm değil, nitel bir gösterim.",
      script: [
        "Önce sınırı söyleyin: telefonda doğruluk ölçmedik; raporda da telefon testi yapılmadı diye yazıyor. Şimdi göreceğiniz şey bir gösterim.",
        "Uygulama Kotlin ile yazıldı ve GRU'yu kütüphane kullanmadan telefonda çalıştırıyor. Sensörleri 50 Hz'e getiriyor, her 1,28 saniyede son 2,56 saniyelik window'u modele veriyor ve 12 sınıftan birini gösteriyor.",
        "Telefonun belde duruşu veri setindekinden farklı olabilir; bu yüzden önce kalibrasyon yapılıyor: ayakta, otururken ve sırtüstü yatarken 8'er saniyelik kayıt. Uygulama bu kayıtlardan telefon eksenlerini veri setinin eksenlerine çeviren dönmeyi hesaplıyor.",
        "Demo: telefonu bele dik takın, kalibrasyonu yapın (yatma adımı sınıfta zorsa hazır eksen seçeneklerinden biriyle devam edin), sonra ayakta durun, oturun, kalkın ve birkaç adım yürüyün. Ekrandaki tahmini dinleyiciye gösterin.",
      ],
      data: [
        {
          label: "1,28 sn / 2,56 sn",
          meaning:
            "Window 128 örnek (2,56 sn), her 64 örnekte (1,28 sn) bir yeni tahmin (android/README.md).",
        },
        {
          label: "Kalibrasyon",
          meaning:
            "Üç duruş, her biri 8 sn kayıt; ilk 1,5 sn atılır. Üç duruşta doğru window oranı en az %60 ise kalite “İyi” görünür.",
        },
        {
          label: "Uygulamadaki model",
          meaning:
            "Final GRU yapılandırması, tek seed (seed 0), ensemble değil. Veri setinin test kümesinde macro F1 0,885 (experiments/export/gru_demo/demo_gru_metrics.json). Bu sayı telefonda ölçülmedi; slayta konmadı.",
        },
      ],
      tips: [
        "Sunumdan önce aynı telefonda baştan sona prova yapın. android/README.md'ye göre uygulama derlendi ve imzalandı, ama README yazıldığında henüz bir telefonda çalıştırılmamıştı.",
        "Kalibrasyonu sunumdan önce yapıp kaydedin; sunumda yalnızca canlı tahmini gösterin. Kayıtlı kalibrasyon açılışta varsayılan olarak seçilir.",
        "Yanlış bir tahmin görünürse saklamayın: “Telefonda ölçüm yapmadığımız için bunun ne kadar sık olduğunu bilmiyoruz” deyin. Bu, sınırlılığın canlı bir örneği.",
        "Demo hiç çalışmazsa slaytı 1 dakikada anlatın ve sonuçlara geçin.",
      ],
      funFacts: [
        "Simülasyonda (HAPT test kişileri, rastgele telefon duruşları) kalibrasyonsuz 6 sınıflı window doğruluğu 0,23, kalibrasyonla 0,958–0,968 oldu (android/README.md, experiments/calib_sim2.py). Bu bir simülasyon; gerçek telefonda ölçülmedi.",
        "Uygulama androidx kullanmıyor; GRU çıkarımı düz Kotlin ile yazıldı. Birim testi, Kotlin çıkarımını PyTorch'un çıktılarıyla karşılaştırıyor (mutlak hata < 1e-3).",
      ],
      questions: [
        {
          question: "Ekranda gördüğümüz tahminler ne kadar doğru?",
          answer:
            "Bilmiyoruz; telefonda etiketli bir kayıt toplayıp ölçmedik. Gördüğünüz şey nitel bir gösterim.",
        },
      ],
      transition: "Sonuçları toparlayalım.",
    },
    conclusion: {
      time: "1 dk",
      goal: "Yazılabilir dört iddia, kapsamlarıyla birlikte.",
      script: [
        "Bir: bu veri setinde, CV ile seçilip dondurulan düzende 1D CNN ve LSTM, test macro F1'de MLP'den yüksek sonuç verdi: 0,921 ve 0,928, MLP 0,864.",
        "İki: GRU testte yüksek, CV'de ayırt edilemez.",
        "Üç: augmentasyonsuz düzende MLP'nin avantajı büyük ölçüde hazır feature'lardan geliyordu; augmentasyon ve yoğun window bu farkı kapattı.",
        "Dört: 1D CNN'de en büyük CV kazancı augmentasyondan geldi, +0,016. İlk baseline ise MLP dahil herkes için eksik ayarlıydı.",
        "Proposal'daki sorulara dönersek: 1D CNN ve LSTM bu düzende MLP'yi geçti, GRU için eşik sağlanmadı. Karışan sınıflar uzanmayla biten iki geçiş ile oturma ve ayakta durma. Telefondaki soru açık kaldı.",
      ],
      tips: [
        "Her iddiayı tek cümleyle söyleyin; kapsam kısıtlarını (“bu veri setinde, bu düzende”) atlamayın.",
      ],
      transition: "Bu iddiaların sınırları var.",
    },
    limitations: {
      time: "1,5 dk",
      goal: "Sınırlılıkları dinleyici sormadan söyleyin.",
      script: [
        "Test kümesi 9 kişi. Güven aralıkları geniş ve az kişiden yeniden örneklendiği için biraz iyimser olabilir.",
        "MLP ile ham modellerin test kümeleri birebir aynı değil: 3.162 ve 3.124 örnek. Kişiler aynı, window'lar değil.",
        "Test değerleri CV'den yüksek: MLP'de yaklaşık +0,015, ham modellerde yaklaşık +0,04. Sebep 21 kişiyle eğitim mi, ham modellerin ek kişiden daha çok yararlanması mı, test kişilerinin kolay olması mı, bu deneylerle ayıramadık.",
        "İlk baseline'da test sonuçlarına baktık. Sonraki kararlar CV ile verildi, ama araştırma yönü bundan etkilenmiş olabilir.",
        "Gerçek telefon testi yapılmadı. Ayrıca hiperparametre araması sınırlıydı: her seçenek 3 seed'le, tek tek denendi.",
      ],
      data: [
        {
          label: "3.162 ve 3.124",
          meaning: "MLP ve ham modellerin test örnek sayıları (Tablo 1).",
        },
      ],
      transition: "Dinlediğiniz için teşekkürler.",
    },
    closing: {
      time: "15 sn + sorular",
      goal: "Tek cümlelik özet ve sorular.",
      script: [
        "Özet: “Yöntemi düzelttikten ve düzeni dondurduktan sonra 1D CNN ve LSTM, bu veri setinde MLP'den yüksek sonuç verdi; telefondaki performans ise ölçülmedi.” Ardından soruları davet edin.",
      ],
      tips: [
        "Hazır cevaplar rehberin sonunda. En olası sorular: neden test'e baktınız, GRU neden “geçti” sayılmıyor, telefon testi neden yok.",
        "Bilmediğiniz bir soruda “bunu ölçmedik” demek doğru ve yeterli bir cevaptır.",
      ],
    },
  },
});
