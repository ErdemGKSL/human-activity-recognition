import { defineDirections } from "../types";

/**
 * Anlatıcı rehberi: 2. Sunum: Literatür Taraması (hedef ~15 dk).
 * Makale başlıkları yayımlandığı gibi İngilizce bırakılmıştır.
 * Henüz kendi deneyimiz yok: projeyle ilgili hiçbir şey sonuç gibi anlatılmaz.
 */
export const literatureReview = defineDirections({
  deckId: "literature-review",
  duration: "15–20 dakika (hedef ~15 dk)",
  date: "01.11.2026",
  summary:
    "Bu tarama, akıllı telefon sensörleriyle insan aktivitesi tanıma (HAR) alanındaki 8 çalışmayı inceler. Çalışmalar üç gruba ayrılır: klasik feature tabanlı yaklaşımlar ve veri setleri, sinir ağı modelleri (CNN, LSTM, GRU ve hibritleri) ve değerlendirme pratiği (window boyutu, overlap, cross validation). Tarama anlatı biçimindedir; sistematik review değildir. Kaynaklar projeye uygunluğuna göre seçilmiştir. Amaç, önerdiğimiz dört modelin (MLP, 1D CNN, LSTM, GRU) literatürdeki yerini göstermek ve aynı veri ayrımıyla karşılaştırma yapmanın neden gerekli olduğunu açıklamaktır. Projenin kendi sonuçları henüz yoktur; bu sunumda yalnızca planlar anlatılır.",
  opening: {
    duration: "~30 saniye",
    text: "Geçen sunumda dört sinir ağını karşılaştırmayı önerdik. Bu sunumda bir adım geri gidiyoruz: bu soruya daha önce kimler, hangi veriyle ve hangi modellerle yaklaştı? Sekiz çalışmaya bakacağız. Önce telefon sensörlerinden aktivite tanımanın nasıl başladığını, sonra sinir ağlarının bu alana nasıl girdiğini, en sonda da sonuçların neden kolay karşılaştırılamadığını göstereceğim.",
  },
  overview: [
    "Dinleyici: yüksek lisans sınıfı ve hoca. Temel kavramları anlatmayın; kaynakların neyi yaptığına ve projeyle ilişkisine odaklanın.",
    "Slaytlarda yalnızca isimler, yıllar ve kısa ifadeler var. Hiçbir slaytta accuracy ya da F1 değeri yok. Bu bilinçli bir tercih: protokoller farklı olduğu için sayılar yan yana konunca yanıltır.",
    "Makalelerde yalnızca özetlerinde okunup doğrulanan bilgiler söylenir. Emin olmadığınız ayrıntıyı (hangi veri seti, hangi bölme) uydurmayın; “makalenin özetinde bu belirtilmiyor” demek yeterlidir.",
    "Makale başlıkları yayımlandığı gibi İngilizce okunur. Tam başlıklar ve yayın bilgileri bu rehberin kaynak listesinde (genel bakış bölümündeki “Kaynak” satırları) verilmiştir.",
    "Kendi projemiz hakkında “planlanmaktadır, karşılaştıracağız” deyin. Hiçbir sonuç yok.",
    "Kaynak 1: Kwapisz, Weiss, Moore (2011). Activity recognition using cell phone accelerometers. ACM SIGKDD Explorations Newsletter. DOI 10.1145/1964897.1964918.",
    "Kaynak 2: Anguita, Ghio, Oneto, Parra, Reyes-Ortiz (2013). A public domain dataset for human activity recognition using smartphones. ESANN 2013, s. 437–442.",
    "Kaynak 3: Reyes-Ortiz, Oneto, Samà, Parra, Anguita (2016). Transition-aware human activity recognition using smartphones. Neurocomputing. DOI 10.1016/j.neucom.2015.07.085.",
    "Kaynak 4: Ordóñez, Roggen (2016). Deep convolutional and LSTM recurrent neural networks for multimodal wearable activity recognition. Sensors. DOI 10.3390/s16010115.",
    "Kaynak 5: Hammerla, Halloran, Plötz (2016). Deep, convolutional, and recurrent models for human activity recognition using wearables. IJCAI 2016. https://www.ijcai.org/Abstract/16/220.",
    "Kaynak 6: Xia, Huang, Wang (2020). LSTM-CNN architecture for human activity recognition. IEEE Access. DOI 10.1109/ACCESS.2020.2982225.",
    "Kaynak 7: Banos, Galvez, Damas, Pomares, Rojas (2014). Window size impact in human activity recognition. Sensors. DOI 10.3390/s140406474.",
    "Kaynak 8: Dehghani, Sarbishei, Glatard, Shihab (2019). A quantitative comparison of overlapping and non-overlapping sliding windows for human activity recognition using inertial sensors. Sensors. DOI 10.3390/s19225026.",
    "Veri seti: Reyes-Ortiz vd., UCI Machine Learning Repository, dataset 341, https://archive.ics.uci.edu/dataset/341.",
    "Süre planı: kapak 30 sn, kapsam 1 dk, harita 1 dk, klasik 1,5 dk, veri setleri 1,5 dk, CNN 1 dk, LSTM ve GRU 1,5 dk, hibrit 1 dk, değerlendirme 2 dk, karşılaştırma 2 dk, boşluklar 1,5 dk, kapanış 30 sn. Toplam yaklaşık 15 dk.",
  ],
  glossary: [
    {
      term: "HAR",
      meaning:
        "Human Activity Recognition. Sensör sinyallerinden kişinin yaptığı aktiviteyi (yürüme, oturma vb.) belirleme problemi.",
    },
    {
      term: "Feature tabanlı yaklaşım",
      meaning:
        "Sinyalden ortalama, standart sapma, enerji gibi feature'ların elle hesaplandığı ve bir sınıflandırıcıya verildiği yaklaşım.",
    },
    {
      term: "SVM",
      meaning:
        "Support Vector Machine. Sınıfları ayıran en geniş marjlı sınırı bulan klasik sınıflandırıcı. Anguita ve arkadaşlarının çalışmasında kullanıldı.",
    },
    {
      term: "CNN",
      meaning:
        "Convolutional Neural Network. Aynı filtreyi girdi üzerinde kaydırarak yerel pattern'leri öğrenen ağ. HAR'da filtreler zaman ekseni boyunca kayar.",
    },
    {
      term: "LSTM",
      meaning:
        "Long Short-Term Memory. Gate'ler ve cell state ile uzun aralıklardaki bilgiyi taşıyan recurrent ağ.",
    },
    {
      term: "GRU",
      meaning: "Gated Recurrent Unit. LSTM'e benzer, iki gate'i vardır ve ayrı cell state tutmaz.",
    },
    {
      term: "Hibrit model",
      meaning:
        "Convolutional ve recurrent katmanları aynı ağda birleştiren model (ör. CNN-LSTM, CNN-GRU).",
    },
    {
      term: "Window / overlap",
      meaning:
        "Sürekli sinyali sabit uzunlukta parçalara bölme ve ardışık parçaların ortak kısmı. UCI HAR'da window 2,56 saniye, overlap %50'dir.",
    },
    {
      term: "Subject-dependent / subject-independent cross validation",
      meaning:
        "Subject-dependent'te aynı kişinin window'ları hem eğitimde hem testte olabilir. Subject-independent'te test kişileri eğitimde hiç görülmez. Dehghani ve arkadaşları iki türü de incelemiştir.",
    },
    {
      term: "Postural transition",
      meaning:
        "İki duruş arasındaki kısa geçiş (ör. otur-kalk). UCI HAR + Transitions veri setinde ayrı etiketlerdir.",
    },
    {
      term: "Accelerometer / gyroscope",
      meaning: "Doğrusal ivmeyi ve açısal hızı ölçen telefon sensörleri.",
    },
    {
      term: "Macro F1-score",
      meaning:
        "F1-score'un her sınıf için ayrı hesaplanıp ağırlıksız ortalaması. Dengesiz sınıflarda Accuracy'den daha dengeli bir özettir.",
    },
    {
      term: "Confusion Matrix",
      meaning:
        "Gerçek ve tahmin edilen sınıfları karşılaştıran tablo; hangi aktivitelerin karıştığını gösterir.",
    },
    {
      term: "Hiperparametre",
      meaning:
        "Eğitimden önce seçilen ayar (katman sayısı, öğrenme oranı, hidden size gibi). Hammerla ve arkadaşları bunların etkisini analiz etmiştir.",
    },
  ],
  questions: [
    {
      question: "Neden yalnızca 8 çalışma? Bu bir sistematik tarama mı?",
      answer:
        "Hayır, anlatı taramasıdır. Kaynakları projeye uygunluğuna göre seçtik: telefon sensörleri, UCI veri seti, sinir ağı modelleri ve değerlendirme pratiği. Klasik çalışmaları yalnızca bağlam için aldık. Alanda çok daha fazla makale var; bu tarama onların hepsini kapsamıyor. Bunu slaytta da belirttik.",
    },
    {
      question: "Hangi model en iyisi?",
      answer:
        "Bu taramadan bunu söyleyemeyiz. Çalışmalar farklı veri setleri, farklı window ve overlap ayarları ve farklı bölme yöntemleri kullanıyor. Bu yüzden raporlanan sayıları slayta koymadık. Projenin amacı tam olarak bu eksiği kapatmak: dört modeli aynı koşulda karşılaştırmak.",
    },
    {
      question: "Neden hibrit modeller projede yok?",
      answer:
        "Kapsamı kontrol altında tutmak için. Önce MLP, 1D CNN, LSTM ve GRU'yu aynı koşulda karşılaştırmayı planlıyoruz. Hibrit modeller zaman kalırsa sonraki bir adım olabilir; şu an bir taahhüt değil.",
    },
    {
      question: "Overlap'li window'lar neden bir sorun olabilir?",
      answer:
        "Window'lar %50 overlap'liyse komşu window'lar aynı sinyalin yarısını paylaşır. Rastgele bölünürse aynı kişinin komşu window'ları hem eğitime hem teste düşebilir. Dehghani ve arkadaşları overlap'in etkisini subject-dependent ve subject-independent cross validation ile incelemiştir: overlap'in görünen kazancı subject-dependent bölmede ortaya çıkıyor, subject-independent bölmede etkisi küçük ya da ihmal edilebilir. Projede katılımcı bazlı ayrım planlanmaktadır.",
    },
  ],
  papers: [
    {
      citation:
        "Kwapisz, Weiss, Moore (2011). Activity recognition using cell phone accelerometers. ACM SIGKDD Explorations Newsletter 12(2), 74-82. DOI 10.1145/1964897.1964918.",
      status:
        "Okuma durumu: tam metin, ancak WISDM çalıştayı sürümünden (SensorKDD 2010). ACM sürümü erişilemedi.",
      points: [
        "29 gönüllü, Android telefonu ön pantolon cebinde taşıdı.",
        "Altı aktivite: yürüme, koşma, merdiven çıkma, merdiven inme, oturma, ayakta durma.",
        "Yalnızca accelerometer, 50 ms aralıkla (saniyede 20 örnek). Gyroscope kullanılmadı.",
        "Veri 10 saniyelik parçalara ayrıldı (her biri 200 okuma); her örnek için 43 feature hesaplandı, toplam 4526 örnek.",
        "Sınıflandırıcılar WEKA J48, lojistik regresyon ve çok katmanlı algılayıcı (MLP); 10 katlı cross validation.",
        "Makalede en yüksek genel doğruluk MLP ile %91,7 (J48 %85,1, lojistik regresyon %78,1). Bu değerler slayta konmadı.",
        "Makale telefonun tek başına her koşulda yeterli olduğunu iddia etmiyor; yalnızca bu altı aktivite ve bu koşul için sonuç veriyor.",
      ],
    },
    {
      citation:
        "Anguita, Ghio, Oneto, Parra, Reyes-Ortiz (2013). A public domain dataset for human activity recognition using smartphones. ESANN 2013, pp. 437-442.",
      status: "Okuma durumu: tam metin (PDF).",
      points: [
        "30 gönüllü, 19-48 yaş arası. Altı temel aktivite: ayakta, oturma, yatma, yürüme, merdiven inme, merdiven çıkma.",
        "Samsung Galaxy S II belde taşındı; accelerometer ve gyroscope 50 Hz ile ölçüldü. Sinyaller median ve 20 Hz düşük geçiren filtreden geçirildi.",
        "Pencereler 2,56 saniye (128 örnek), %50 overlap. Pencere başına 561 feature.",
        "Veri rastgele %70 eğitim, %30 test olarak bölündü; katılımcı bazlı bir bölme değil.",
        "Sınıflandırıcı çok sınıflı SVM (Gaussian kernel, one-vs-all). Test setinde 2947 örnek üzerinde %96 doğruluk; en düşük recall oturma sınıfında (%88), oturma ayakta durmayla karıştı.",
      ],
    },
    {
      citation:
        "Reyes-Ortiz, Oneto, Samà, Parra, Anguita (2016). Transition-aware human activity recognition using smartphones. Neurocomputing 171, 754-767. DOI 10.1016/j.neucom.2015.07.085.",
      status:
        "Okuma durumu: makalenin tam metni alınamadı (Elsevier engelledi). Yalnızca UCI veri seti sayfası okundu; yöntem anlatılmıyor.",
      points: [
        "Bu makale, UCI veri seti 341'i (UCI HAR + Transitions) tanıtıyor; projemizin veri seti bu.",
        "30 gönüllü, belde Samsung Galaxy S II; accelerometer ve gyroscope 50 Hz.",
        "Altı temel aktivite ve altı postural transition (ör. otur-kalk, yat-otur), toplam 12 etiket. Etiketler videodan elle çıkarıldı.",
        "Pencereler 2,56 saniye, %50 overlap; 561 feature. Ham sinyaller de yayımlandı.",
        "Sınıflandırıcı ve geçiş ele alma yöntemi bu özet kapsamında okunmadı; rehberde yöntem iddiası yok.",
      ],
    },
    {
      citation:
        "Ordóñez, Roggen (2016). Deep convolutional and LSTM recurrent neural networks for multimodal wearable activity recognition. Sensors 16(1), 115. DOI 10.3390/s16010115.",
      status: "Okuma durumu: tam metin (PMC).",
      points: [
        "DeepConvLSTM: dört convolutional katman (yalnızca zaman ekseninde), ardından iki LSTM katmanı ve softmax çıkışı.",
        "Elle tasarlanmış feature kullanılmıyor; ham sensör verisi minimum ön işlemeyle giriyor.",
        "İki veri seti: OPPORTUNITY (vücuda takılı IMU ve accelerometer, 113 kanal, 30 Hz) ve Skoda (sağ kola takılı 10 accelerometer, 10 hareket).",
        "Pencereler 500 ms, adım 250 ms. Model, vücut sensörleri; telefon verisi kullanılmadı.",
        "Sensör füzyonu: yalnızca accelerometer ile F1 0,69; gyroscope eklenince ortalama %15, manyetometre eklenince %20 iyileşme.",
        "OPPORTUNITY üzerinde, derin ama recurrent olmayan bir baseline'a göre ortalama %4 daha iyi (makalenin raporladığı değer).",
      ],
    },
    {
      citation:
        "Hammerla, Halloran, Plötz (2016). Deep, convolutional, and recurrent models for human activity recognition using wearables. IJCAI 2016, pp. 1533-1540. arXiv:1604.08880.",
      status: "Okuma durumu: tam metin (arXiv v1).",
      points: [
        "Karşılaştırılan modeller: DNN (en fazla beş gizli katman), CNN ve üç LSTM varyantı (LSTM-F, LSTM-S, çift yönlü b-LSTM-S).",
        "Üç veri seti, hepsi vücuda takılı sensörler: Opportunity (4 denek), PAMAP2 (9 denek, 12 aktivite), Daphnet Gait (10 hasta, iki sınıf).",
        "4000'den fazla deney, rastgele seçilmiş hiperparametrelerle; hiperparametrelerin önemi fANOVA ile analiz edildi.",
        "Opportunity'de b-LSTM-S en iyi (makro F1 0,745), PAMAP2'de CNN en iyi (0,937), Daphnet Gait'te LSTM-S en iyi (0,760).",
        "Sonuç: kısa ve sıralı aktiviteler için recurrent modeller, uzun ve tekrarlı aktiviteler için CNN. Öğrenme oranı en önemli ayar.",
        "Çalışmanın veri setleri telefon değil; bu ayrım slayta ve sunuma yansıdı.",
      ],
    },
    {
      citation:
        "Xia, Huang, Wang (2020). LSTM-CNN architecture for human activity recognition. IEEE Access 8, 56855-56866. DOI 10.1109/ACCESS.2020.2982225.",
      status: "Okuma durumu: tam metin (PDF, IEEE Access açık erişim).",
      points: [
        "Katman sırası: önce iki katmanlı LSTM (zamansal feature), sonra convolutional katmanlar (uzamsal feature), global average pooling, batch normalization, tam bağlantılı katman ve softmax.",
        "Global average pooling, tam bağlantılı katmanın yerine geçiyor; UCI-HAR deneyinde parametre sayısı yaklaşık %94 azaldı (502 bin civarından 27 bine).",
        "Veri setleri: UCI-HAR (30 denek), WISDM (36 denek), OPPORTUNITY (challenge alt kümesi).",
        "Özette raporlanan değerler: UCI-HAR %95,78, WISDM %95,85, OPPORTUNITY %92,63. Makale bu değerlere bazen doğruluk, bazen F1 diyor; slayta konmadı.",
        "Recurrent kısım LSTM olduğu için eğitim, paralelleştirilemediğinden CNN'e göre daha yavaş.",
      ],
    },
    {
      citation:
        "Banos, Galvez, Damas, Pomares, Rojas (2014). Window size impact in human activity recognition. Sensors 14(4), 6474-6499. DOI 10.3390/s140406474.",
      status: "Okuma durumu: tam metin (PMC).",
      points: [
        "Veri seti: 17 gönüllü, 33 fitness aktivitesi, 9 eylemsizlik sensörü; yalnızca ivmelenme kullanıldı. Vücuda takılı sensörler, telefon değil.",
        "Pencere boyutu 0,25 s ile 7 s arasında, 0,25 s adımlarla; pencereler üst üste binmiyor.",
        "Üç özellik seti, dört sınıflandırıcı: C4.5 karar ağacı, kNN (k=3), naive Bayes ve nearest centroid. Değerlendirme 10 katlı CV, 100 kez tekrarlandı, F1 ile ölçüldü.",
        "Naive Bayes ve nearest centroid, 0,25 s ile 1 s arasında %30'a varan iyileşme gösterdi. kNN en iyisiydi (0,25-0,5 s'de F1 0,95'in üzerinde).",
        "Makalenin sonucu: 1-2 saniye, hız ve doğruluk arasında en iyi dengeyi veriyor; büyük pencereler her zaman daha iyi değil.",
      ],
    },
    {
      citation:
        "Dehghani, Sarbishei, Glatard, Shihab (2019). A quantitative comparison of overlapping and non-overlapping sliding windows for human activity recognition using inertial sensors. Sensors 19(22), 5026. DOI 10.3390/s19225026.",
      status: "Okuma durumu: tam metin (PMC).",
      points: [
        "Üst üste binen ve binmeyen kayan pencereler karşılaştırıldı; pencere 0,25-7 s arası, üst üste binenlerde kayma 200 ms.",
        "İki değerlendirme türü: subject-dependent (rastgele k katlı) ve subject-independent (katılımcıya göre bölme).",
        "Subject-dependent'te overlap sonucu iyileştiriyor; yazarlar bunu eğitim ve test katlarındaki korelasyona bağlıyor.",
        "Subject-independent'te overlap'in etkisi küçük ya da ihmal edilebilir; binmeyen pencereler aynı performansa ulaşıyor.",
        "Veri setleri: 17 denek, 33 aktivite, 9 Xsens IMU; 94 denek, 74 aktivite, ön kola takılı bileklik (accelerometer ve gyroscope). Telefon değil.",
        "Üst üste binen pencereler daha fazla enerji, zaman ve bellek gerektiriyor.",
      ],
    },
  ],
  slides: {
    cover: {
      time: "30 sn",
      goal: "Dinleyici bu sunumun bir literatür taraması olduğunu ve projeyle ilişkisini ilk cümlede anlamalı.",
      script: [
        "Açılış konuşmasını (bkz. “Açılış Konuşması” bölümü) bu slayt açıkken yapın. Ardından kendinizi tanıtın: Erdem Göksel, 261402103.",
        "Bugünün sunumunun bir literatür taraması olduğunu söyleyin: önerdiğimiz projenin daha önce yapılanlar içinde nerede durduğunu göstereceksiniz.",
      ],
      tips: [
        "Başlığı okumayın; dinleyici zaten okuyor.",
        "Sol alttaki öğretim üyesi satırını okumanıza gerek yok.",
      ],
      transition: "Önce taramanın kapsamına ve nasıl yapıldığına bakalım.",
    },
    scope: {
      time: "1 dk",
      goal: "Taramanın sınırları baştan açık: kısa, sinir ağı odaklı ve sistematik değil.",
      script: [
        "Sorumuz basit: telefon sensörleriyle aktivite tanımada sinir ağları hangi noktada? Bu soruya 8 çalışmayla bakacağız. Hepsi dergi ya da konferans makalesi; veri setleri için de bir UCI sayfasına başvurduk.",
        "Odak sinir ağları, çünkü ders ve proje bu konuda. İki klasik çalışmayı (Kwapisz ve Anguita) yalnızca bağlam için aldık: sinir ağlarının neyin yerine geçtiğini görmek için.",
        "Bu bir anlatı taraması. Sistematik review değil; yani alanın tamamını taradığımızı iddia etmiyoruz. Kaynakları projeye uygunluğuna göre seçtik. Yayın bilgilerini DOI üzerinden kontrol ettik.",
      ],
      data: [
        {
          label: "8 çalışma",
          meaning:
            "Kwapisz, Anguita, Reyes-Ortiz, Ordóñez, Hammerla, Xia, Banos, Dehghani. Tam başlıklar genel bakış bölümündeki kaynak satırlarında.",
        },
        {
          label: "Anlatı taraması",
          meaning:
            "Arama sorguları ve dışlama ölçütleriyle belgelenmiş bir PRISMA süreci yürütülmedi; sınırlama budur ve açıkça söylenmelidir.",
        },
      ],
      tips: ["Sınırlamayı kendiniz söyleyin; hoca sormadan söylemek güven verir."],
      transition: "Önce alanın genel haritasına bakalım.",
    },
    map: {
      time: "1 dk",
      goal: "Alan, elle tasarlanan feature'lardan modelin kendi öğrendiği representation'lara doğru ilerliyor; bu tarama o sırayı izliyor.",
      script: [
        "Dört kart sunumun dört bölümü. Soldan sağa: feature tabanlı yaklaşım, deep learning, hibrit modeller ve değerlendirme.",
        "Feature tabanlı çalışmalarda feature'lar elle hesaplanır ve SVM gibi bir sınıflandırıcıya verilir. Deep learning çalışmalarında model feature'ları ham sinyalden öğrenir. Hibrit modeller convolutional ve recurrent katmanları birleştirir.",
        "Sağdaki turuncu kart farklı türde: modelden çok, sonuçların nasıl ölçüldüğüyle ilgili. Window boyutu ve overlap gibi seçimlerin sonucu nasıl etkilediğini inceleyen iki çalışma var.",
      ],
      data: [
        {
          label: "Kartlardaki isim ve yıllar",
          meaning:
            "Her isim ilgili bölümde ayrıntılı anlatılacak. Yıllar kronolojik bir sıra olduğunu gösterir; “kim kimden önce” iddiası değildir.",
        },
        {
          label: "Turuncu kart",
          meaning: "Değerlendirme pratiği: modelden bağımsız, protokolle ilgili bölüm.",
        },
      ],
      tips: ["Kartları okumayın; her kartın bir sonraki slayttaki karşılığını söyleyin."],
      transition: "Başlangıçtan başlayalım: feature tabanlı çalışmalar.",
    },
    classical: {
      time: "1,5 dk",
      goal: "Telefon sensörleriyle aktivite tanıma, sinir ağlarından önce de çalışıyordu; sinir ağlarının getirdiği şey elle feature tasarımından kurtulmaktır.",
      script: [
        "Kwapisz ve arkadaşları 2011'de telefon accelerometer'ıyla aktivite tanımayı anlatıyor. Özetlerine göre veriyi yirmi dokuz kullanıcıdan topladılar. Telefon ön cepte taşınıyor, yalnızca accelerometer kullanılıyor ve altı aktivite ayırt ediliyor. Çalışma, tek bir telefondaki accelerometer verisiyle bu koşullarda aktivite tanımanın mümkün olduğunu gösteren erken örneklerden biridir; telefonun her durumda yeterli bir sensör olduğunu göstermez.",
        "Anguita ve arkadaşları 2013'te UCI HAR veri setini yayımladı. Veri, belinde telefon taşıyan 30 gönüllüden geliyor. Her window'dan 561 feature çıkarılmış ve sonuçlar çok sınıflı bir SVM ile verilmiş. Projemizdeki MLP'nin 561 feature girdisi bu veri setinden geliyor. Makalede veri rastgele %70 eğitim, %30 test olarak bölünmüş; makale bu bölmenin katılımcı bazlı olduğunu belirtmiyor. Biz katılımcı bazlı ayrım planlıyoruz; bu makaledeki bir hata değil, planımızın ondan farkı.",
        "Reyes-Ortiz ve arkadaşlarının 2016 çalışmasıyla veri setinin postural transition'lı sürümü oluştu; projemizin veri seti bu. UCI sayfasına göre altı temel aktiviteye altı postural transition etiketi eklenmiş ve ham sensör sinyalleri de yayımlanmış. Makalenin tam metnine erişemediğimiz için yöntem ayrıntılarını (sınıflandırıcı, geçişlerin nasıl ele alındığı) anlatmıyoruz.",
        "Bu yaklaşımın bedeli: feature'ları bir uzman tasarlamak zorunda. Sinir ağı çalışmaları bu adımı ortadan kaldırmayı hedefliyor.",
      ],
      data: [
        {
          label: "29 kullanıcı (Kwapisz)",
          meaning:
            "Makalede belirtilen kullanıcı sayısı. Telefon ön cepte, yalnızca accelerometer, altı aktivite (yürüme, koşma, merdiven çıkma ve inme, oturma, ayakta durma).",
        },
        {
          label: "30 kişi, 561 feature (Anguita)",
          meaning:
            "Makalede: 30 gönüllü, belde Samsung Galaxy S II, 50 Hz, 2,56 saniyelik window'lar, %50 overlap, her window için 561 feature, SVM. Veri rastgele %70 eğitim, %30 test olarak bölünmüş; projede ise katılımcı bazlı ayrım planlanmaktadır.",
        },
        {
          label: "Postural transition (Reyes-Ortiz)",
          meaning:
            "UCI sayfasındaki bilgiler: 30 gönüllü, belde Samsung Galaxy S II, 50 Hz, altı temel aktivite ve altı postural transition (ör. otur-kalk, yat-otur). Etiketler videodan elle çıkarılmış. Yöntem bilgisi tam metin okunmadığı için verilmez.",
        },
      ],
      funFacts: [
        "Anguita ve arkadaşlarının makalesi ESANN 2013'te, yani bir yapay sinir ağları sempozyumunda yayımlandı; ama makaledeki sınıflandırıcı SVM.",
      ],
      tips: [
        "Burada hiçbir accuracy değeri söylemeyin; slaytta da yok.",
        "Anguita'nın veri setini söylerken “projemizin MLP girdisi buradan geliyor” bağlantısını kurun.",
      ],
      transition: "Bu çalışmalarda hangi veri setlerinin kullanıldığına bakalım.",
    },
    datasets: {
      time: "1,5 dk",
      goal: "UCI HAR ailesi telefon tabanlı HAR için ortak bir referans; farklı çalışmalar farklı veri setleri kullanıyor.",
      script: [
        "Tabloda üç veri seti var. UCI HAR ve onun postural transition'lı genişletmesi, ikisi de 30 katılımcıdan, telefon accelerometer'ı ve gyroscope'uyla toplanmış. Kwapisz vd. veri seti ise 29 kullanıcıyla, yalnızca accelerometer.",
        "Projemizin veri seti ikincisi, UCI HAR + Transitions. Bu tabloda önemli olan şu: ilk iki veri seti aynı ekipten ve benzer protokolle toplanmış, bu yüzden bu ailedeki sonuçlar birbirine daha yakın okunabilir. Kwapisz vd. veri seti ise farklı bir sensör kümesi kullandığından doğrudan kıyaslanamaz.",
        "Ayrıca tek bir cihazdan toplanmış: belde taşınan bir Samsung Galaxy S II. Bu, kendi telefonumuzla yapacağımız testin neden zor olduğunu açıklıyor: cihaz ve yerleşim farklı olacak.",
      ],
      data: [
        {
          label: "30 katılımcı",
          meaning:
            "Anguita ve arkadaşlarının makalesinde 19–48 yaş arası 30 gönüllü. Transitions sürümü için de UCI sayfası aynı sayıyı verir.",
        },
        {
          label: "29 kullanıcı (Kwapisz)",
          meaning:
            "Makaledeki kullanıcı sayısı. Kwapisz'in metni WISDM'i proje adı olarak anar (Wireless Sensor Data Mining) ve veriyi ileride yayımlamayı planladığını yazar; veri setine bu adı vermez. Xia vd.'nin WISDM adıyla kullandığı veri setinde 36 katılımcı var; bu yüzden ikisini aynı veri kümesi saymayın.",
        },
        {
          label: "Sensör sütunu",
          meaning:
            "UCI HAR ailesinde telefonun accelerometer ve gyroscope'u; Kwapisz vd. veri setinde yalnızca accelerometer.",
        },
      ],
      tips: [
        "Tabloyu satır satır okumayın; üç veri setinin farkını tek cümleyle söyleyin.",
        "Hocanın “neden bu veri seti” sorusuna cevap burada: açık erişimli, belgelenmiş, kullanıcı bazlı ayrım yapılabilir.",
      ],
      transition: "Şimdi sinir ağlarına geçelim; önce CNN.",
    },
    cnn: {
      time: "1 dk",
      goal: "CNN, feature tasarımını modelin içine taşır; ham sinyalden feature'ları kendisi öğrenir.",
      script: [
        "Ordóñez ve Roggen 2016'da convolutional ve LSTM katmanlarından oluşan bir çerçeve önerdi. Özetlerine göre çerçeve, uzman bilgisiyle feature tasarlamayı gerektirmiyor; yani feature'lar ham sinyalden öğreniliyor.",
        "Hammerla ve arkadaşları aynı yıl deep feed-forward, convolutional ve recurrent modelleri inceledi. Bu iki çalışmayı bir sonraki slaytta recurrent katmanlar açısından yeniden ele alacağız.",
        "CNN'in proje ile ilişkisi şu: proje planında 1D CNN, UCI verisindeki ham window'larla (128 × 6) beslenecek.",
      ],
      data: [
        {
          label: "Slayttaki kartlar",
          meaning:
            "İki kartta da yalnızca makale özetinde okunup doğrulanan şeyler var; hiçbir sayı yok.",
        },
      ],
      tips: [
        "Bu slaytta bilmediğiniz ayrıntıyı söylemeyin; “bu ayrıntıya makalenin tamamını okuyunca bakacağız” demek yeterli.",
      ],
      transition:
        "CNN yerel pattern'leri yakalar. Zaman sırasını modellemek için recurrent ağlara bakalım.",
    },
    rnn: {
      time: "1,5 dk",
      goal: "Recurrent katmanlar zaman boyunca bilgi taşır; bu, projedeki LSTM ve GRU'nun gerekçesidir.",
      script: [
        "Ordóñez ve Roggen 2016'da convolutional ve LSTM katmanlarından oluşan genel bir çerçeve önerdi. Özetlerine göre bu çerçeve, giyilebilir sensörlerle çalışıyor, uzman bilgisiyle feature tasarlamayı gerektirmiyor ve feature aktivasyonlarının zamansal dinamiğini açıkça modelliyor.",
        "Hammerla ve arkadaşları 2016'da deep feed-forward, convolutional ve recurrent ağları üç veri setinde sistematik biçimde inceledi. Binlerce deney çalıştırdılar ve hiperparametrelerin etkisini analiz ettiler. Özetlerine göre recurrent modelleri bir benchmark üzerinde önceki en iyi sonuçların üzerine çıkardılar. Bu benchmark telefon verisi değil; o yüzden bunu bizim sonucumuz gibi okumayın.",
        "LSTM ile GRU'yu karşılaştırmak projede bir araştırma sorusu. Bu çalışmalar ikisini aynı koşulda bizim veri setimizde karşılaştırmıyor; bu bir boşluk olarak sonda tekrar gelecek.",
      ],
      data: [
        {
          label: "Üç veri seti (Hammerla)",
          meaning:
            "Opportunity, PAMAP2 ve Daphnet Gait; üçü de vücuda takılan sensör verisi, telefon değil. Makalede en iyi model veri setine göre değişiyor; recurrent modeller her veri setinde önde değil.",
        },
      ],
      tips: [
        "Hammerla'nın sonucunu söylerken “wearable sensör, telefon değil” ayrımını yapın.",
        "LSTM ve GRU'nun üstünlüğü hakkında bir iddiada bulunmayın.",
      ],
      transition: "Convolutional ve recurrent katmanları birleştiren hibrit modellere bakalım.",
    },
    hybrid: {
      time: "1 dk",
      goal: "Hibrit modeller yaygın, ama projede kapsam dışı; bilerek dışarıda bırakıldı.",
      script: [
        "Xia ve arkadaşları 2020'de iki katmanlı LSTM ve ardından convolutional katmanlar kullanan bir model önerdi. Makalenin özetinde modelin UCI, WISDM ve OPPORTUNITY veri setlerinde değerlendirildiği ve parametre sayısını azaltmak için global average pooling kullanıldığı yazıyor.",
        "Ordóñez ve Roggen de convolutional ve LSTM katmanlarını birleştiriyor. İki çalışmanın ortak fikri convolutional ve recurrent katmanları birleştirmek, ama katmanların sırası farklı. Ordóñez ve Roggen'de convolutional katmanlar önce, LSTM katmanları sonra gelir. Xia'da sıra tersidir: önce LSTM zamansal feature'ları çıkarır, ardından convolutional katmanlar uzamsal feature'ları çıkarır.",
        "Projede hibrit model planlamıyoruz. Dört saf modeli (MLP, 1D CNN, LSTM, GRU) aynı koşulda karşılaştıracağız. Hibrit bir model, saf modellerin ne kadar katkı verdiğini görmeyi zorlaştırır. Zaman kalırsa sonraki bir adım olabilir.",
      ],
      data: [
        {
          label: "UCI, WISDM, OPPORTUNITY (Xia)",
          meaning:
            "Makale özetinde sıralanan üç veri seti. Özette doğruluk değerleri de var; ama farklı protokoller yüzünden bunları slayta koymadık.",
        },
      ],
      funFacts: [
        "Xia ve arkadaşlarının modelinde sıra, makalenin özetine göre, LSTM önce, convolutional katmanlar sonra gelir.",
      ],
      tips: ["Üçüncü maddeyi vurgulayın: kapsam kararı bilinçli."],
      transition:
        "Sayılar bu kadar farklı protokolle üretildiyse, nasıl karşılaştırılırlar? Değerlendirmeye bakalım.",
    },
    evaluation: {
      time: "2 dk",
      goal: "Sonuçların karşılaştırılabilir olması için window, overlap ve bölme yönteminin aynı olması gerekir.",
      script: [
        "Banos ve arkadaşları window boyutunun etkisini inceledi. Özetlerine göre windowing, aktivite tanıma sürecinin önemli bir aşaması, ama hangi window boyutunun seçileceği konusunda net bir görüş birliği yok; çoğu çalışma önceki çalışmalardaki değerleri kullanıyor. Kendi çalışmaları bunu sistematik olarak ölçüyor.",
        "Dehghani ve arkadaşları overlap'li ve overlap'siz kayan window'ları karşılaştırdı. Özetlerine göre bunu subject-dependent ve subject-independent cross validation ile yaptılar. Alanda overlap'in performansı artırdığı yönünde yaygın bir kanı var; bu çalışma bu kanıyı sınıyor. Subject-dependent cross validation'da overlap'li window'lar daha iyi sonuç veriyor, ama yazarlar bunu eğitim ve test fold'ları arasındaki korelasyona bağlıyor. Subject-independent cross validation'da overlap'in etkisi küçük ya da ihmal edilebilir düzeyde. Yani overlap seçiminin sonucu her durumda değiştirdiğini söyleyemeyiz; etkisi bölme yöntemine bağlı.",
        "Projeyle bağlantı: UCI HAR %50 overlap kullanıyor. Biz katılımcı bazlı bir ayrım planlıyoruz; test katılımcıları eğitimde hiç görülmeyecek. Metrik olarak macro F1-score, sınıf bazında Recall ve Confusion Matrix planlıyoruz; çünkü Accuracy tek başına küçük sınıflardaki hataları gizleyebilir.",
      ],
      data: [
        {
          label: "Window boyutu (Banos 2014)",
          meaning: "Window boyutunun tanıma sürecine etkisini ölçen çalışma.",
        },
        {
          label: "Overlap ve cross validation (Dehghani 2019)",
          meaning:
            "Overlap'in etkisi iki cross validation türüyle incelenmiştir. Subject-dependent'te overlap sonucu iyileştiriyor görünür; subject-independent'te etkisi küçük ya da ihmal edilebilir. Veri setleri giyilebilir sensör verisidir, telefon değil.",
        },
      ],
      tips: [
        "Bu slayt sunumun kilit noktası; tabloya geçmeden önce “sayıları neden yan yana koymadık” sorusunun cevabını burada verin.",
      ],
      transition: "Şimdi çalışmaları bir tabloda yan yana görelim; ama sayı olmadan.",
    },
    comparison: {
      time: "2 dk",
      goal: "Çalışmalar farklı veri, model ve protokol kullanıyor; tablo bunu açıkça gösteriyor, sıralama yapmıyor.",
      script: [
        "Tabloda her satır bir çalışma. Sütunlar: hangi veri seti, hangi model ve kısa bir not. Bilerek sayısal sütun yok.",
        "Üstteki iki satır klasik, feature tabanlı çalışmalar: Anguita SVM kullanıyor, Reyes-Ortiz satırında yalnızca veri seti bilgisi var. Sonra sinir ağı çalışmaları: Ordóñez ve Hammerla. Alttaki satır hibrit bir model: Xia.",
        "Sütunlara bakınca hemen görülen şey: veri seti sütunu hiç bir yerde aynı değil. Bazıları telefon, bazıları giyilebilir sensör kullanıyor. Bu yüzden hangi modelin daha iyi olduğunu bu tablodan çıkaramayız.",
        "Örnek: Xia ve arkadaşlarının özetinde UCI, WISDM ve OPPORTUNITY için ayrı doğruluk değerleri veriliyor. Bu üç değer bile birbirine eşit koşullarda ölçülmüş sayılar olarak okunamaz.",
      ],
      data: [
        {
          label: "Veri seti sütunu",
          meaning:
            "Ordóñez satırındaki “İki veri seti” ifadesi makalenin özetinden gelir. Makalede bunlar OPPORTUNITY ve Skoda'dır; ikisi de giyilebilir sensör verisidir, telefon verisi değildir. Slayt kısa kalsın diye adlar yazılmadı.",
        },
        {
          label: "Not sütunu",
          meaning:
            "Makalenin kendi ifadesine dayanan kısa not: Anguita'da hazır feature'lar, Reyes-Ortiz'de geçişler, Ordóñez'de elle feature tasarımı gerekmemesi, Hammerla'da hiperparametre analizi, Xia'da az parametre.",
        },
      ],
      tips: [
        "Tabloyu sıralama olarak sunmayın; “hangisi daha iyi” sorusu gelirse değerlendirme slaytındaki cevaba dönün.",
      ],
      transition: "Bu tablodan projemiz için ne çıkıyor? Boşluklara bakalım.",
    },
    gaps: {
      time: "1,5 dk",
      goal: "Projenin katkısı, taranan çalışmalarda eksik görünen karşılaştırma koşulunu sağlamaktır; sonuç değil plan.",
      script: [
        "Taradığımız çalışmalar farklı veri setleri, farklı modeller ve farklı protokoller kullanıyor. Bu, birbirleriyle doğrudan kıyaslanmalarını zorlaştırıyor.",
        "Projede dört modeli (MLP, 1D CNN, LSTM, GRU) aynı veri ayrımı ve aynı metriklerle karşılaştırmayı planlıyoruz. Karışan aktiviteleri Confusion Matrix ile inceleyeceğiz.",
        "Son olarak kendi telefonumuzdan veri toplayıp modelleri sınamayı planlıyoruz. UCI verisi tek bir cihazdan ve belde toplanmış; bizim telefonumuz farklı olacak. Bu testin sonucu henüz bilinmiyor; deney yapıldığında raporlanacak.",
        "Bu bir boşluk iddiası değil, bir tarama sınırı: biz 8 çalışmaya baktık. Başkalarının bu karşılaştırmayı yapmadığını söyleyemeyiz; yalnızca taradığımız çalışmalarda aynı koşulda dört modelin yer almadığını görüyoruz.",
      ],
      data: [
        {
          label: "Projede planlanan",
          meaning: "Üç madde de proposal sunumundaki planla aynıdır; hiçbirinde sonuç yoktur.",
        },
      ],
      tips: [
        "Fiil zamanı: “planlıyoruz”, “karşılaştırılacaktır”. “Gösterdik” ya da “bulduk” demeyin.",
        "Boşluk cümlesini temkinli kurun: taradığımız çalışmalar için geçerli, tüm alan için değil.",
      ],
      transition: "Dinlediğiniz için teşekkürler.",
    },
    closing: {
      time: "30 sn + sorular",
      goal: "Sorulara açık, kısa ve net bir kapanış.",
      script: [
        "Tek cümleyle kapatın: “Özetle: telefon tabanlı HAR'da feature tabanlı yöntemlerden sinir ağlarına geçiş var, ama sonuçlar farklı protokollerle üretilmiş; biz dört modeli aynı koşulda karşılaştırmayı planlıyoruz.” Ardından soruları davet edin.",
      ],
      tips: [
        "Olası sorular rehberin başındaki soru bölümünde. Bilmediğiniz bir ayrıntıda “makalenin tamamını okuyarak kontrol edeceğim” demek dürüst ve kabul edilebilir bir cevaptır.",
      ],
    },
  },
});
