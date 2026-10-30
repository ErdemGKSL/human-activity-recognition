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
    "Bu tarama, akıllı telefon sensörleriyle insan aktivitesi tanıma (HAR) alanındaki 11 çalışmayı inceler. Çalışmalar üç gruba ayrılır: klasik feature tabanlı yaklaşımlar ve veri setleri, sinir ağı modelleri (CNN, LSTM, GRU ve hibritleri) ve değerlendirme pratiği (window boyutu, overlap, cross validation). Tarama anlatı biçimindedir; sistematik review değildir. Kaynaklar projeye uygunluğuna göre seçilmiştir. Amaç, önerdiğimiz dört modelin (MLP, 1D CNN, LSTM, GRU) literatürdeki yerini göstermek ve aynı veri ayrımıyla karşılaştırma yapmanın neden gerekli olduğunu açıklamaktır. Projenin kendi sonuçları henüz yoktur; bu sunumda yalnızca planlar anlatılır.",
  opening: {
    duration: "~30 saniye",
    text: "Geçen sunumda dört sinir ağını karşılaştırmayı önerdik. Bu sunumda bir adım geri gidiyoruz: bu soruya daha önce kimler, hangi veriyle ve hangi modellerle yaklaştı? On bir çalışmaya bakacağız. Önce telefon sensörlerinden aktivite tanımanın nasıl başladığını, sonra sinir ağlarının bu alana nasıl girdiğini, en sonda da sonuçların neden kolay karşılaştırılamadığını göstereceğim.",
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
    "Kaynak 4: Ronao, Cho (2016). Human activity recognition with smartphone sensors using deep learning neural networks. Expert Systems with Applications. DOI 10.1016/j.eswa.2016.04.032.",
    "Kaynak 5: Ordóñez, Roggen (2016). Deep convolutional and LSTM recurrent neural networks for multimodal wearable activity recognition. Sensors. DOI 10.3390/s16010115.",
    "Kaynak 6: Hammerla, Halloran, Plötz (2016). Deep, convolutional, and recurrent models for human activity recognition using wearables. IJCAI 2016. https://www.ijcai.org/Abstract/16/220.",
    "Kaynak 7: Ignatov (2018). Real-time human activity recognition from accelerometer data using convolutional neural networks. Applied Soft Computing. DOI 10.1016/j.asoc.2017.09.027.",
    "Kaynak 8: Xia, Huang, Wang (2020). LSTM-CNN architecture for human activity recognition. IEEE Access. DOI 10.1109/ACCESS.2020.2982225.",
    "Kaynak 9: Dua, Singh, Semwal (2021). Multi-input CNN-GRU based human activity recognition using wearable sensors. Computing. DOI 10.1007/s00607-021-00928-8.",
    "Kaynak 10: Banos, Galvez, Damas, Pomares, Rojas (2014). Window size impact in human activity recognition. Sensors. DOI 10.3390/s140406474.",
    "Kaynak 11: Dehghani, Sarbishei, Glatard, Shihab (2019). A quantitative comparison of overlapping and non-overlapping sliding windows for human activity recognition using inertial sensors. Sensors. DOI 10.3390/s19225026.",
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
        "Support Vector Machine. Sınıfları ayıran en geniş marjlı sınırı bulan klasik sınıflandırıcı. Anguita ve Reyes-Ortiz çalışmalarında kullanıldı.",
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
      question: "Neden yalnızca 11 çalışma? Bu bir sistematik tarama mı?",
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
        "Window'lar %50 overlap'liyse komşu window'lar aynı sinyalin yarısını paylaşır. Rastgele bölünürse aynı kişinin komşu window'ları hem eğitime hem teste düşebilir. Dehghani ve arkadaşları overlap'in etkisini subject-dependent ve subject-independent cross validation ile incelemiştir. Projede katılımcı bazlı ayrım planlanmaktadır.",
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
        "Sorumuz basit: telefon sensörleriyle aktivite tanımada sinir ağları hangi noktada? Bu soruya 11 çalışmayla bakacağız. Hepsi dergi ya da konferans makalesi; veri setleri için de bir UCI sayfasına başvurduk.",
        "Odak sinir ağları, çünkü ders ve proje bu konuda. İki klasik çalışmayı (Kwapisz ve Anguita) yalnızca bağlam için aldık: sinir ağlarının neyin yerine geçtiğini görmek için.",
        "Bu bir anlatı taraması. Sistematik review değil; yani alanın tamamını taradığımızı iddia etmiyoruz. Kaynakları projeye uygunluğuna göre seçtik. Yayın bilgilerini DOI üzerinden kontrol ettik.",
      ],
      data: [
        {
          label: "11 çalışma",
          meaning:
            "Kwapisz, Anguita, Reyes-Ortiz, Ronao, Ordóñez, Hammerla, Ignatov, Xia, Dua, Banos, Dehghani. Tam başlıklar genel bakış bölümündeki kaynak satırlarında.",
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
        "Sağdaki turuncu kart farklı türde: modelden çok, sonuçların nasıl ölçüldüğüyle ilgili. Window boyutu ve overlap gibi seçimlerin sonucu etkilediğini gösteren iki çalışma var.",
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
        "Kwapisz ve arkadaşları 2011'de telefon accelerometer'ıyla aktivite tanımayı anlatıyor. Özetlerine göre veriyi yirmi dokuz kullanıcıdan topladılar. Bu, telefonun tek başına yeterli bir sensör olduğunu gösteren erken çalışmalardan biri.",
        "Anguita ve arkadaşları 2013'te UCI HAR veri setini yayımladı. Veri, belinde telefon taşıyan 30 gönüllüden geliyor. Her window'dan 561 feature çıkarılmış ve sonuçlar çok sınıflı bir SVM ile verilmiş. Projemizdeki MLP'nin 561 feature girdisi bu veri setinden geliyor.",
        "Reyes-Ortiz ve arkadaşları 2016'da transition-aware bir sistem önerdi. Özetlerine göre SVM'in olasılık çıktısını bir heuristic filtreyle birleştiriyorlar ve aktiviteler arası geçişleri ayrıca ele alıyorlar. Bu çalışmayla veri setinin postural transition'lı sürümü oluştu; projemizin veri seti bu.",
        "Bu yaklaşımın bedeli: feature'ları bir uzman tasarlamak zorunda. Sinir ağı çalışmaları bu adımı ortadan kaldırmayı hedefliyor.",
      ],
      data: [
        {
          label: "29 kullanıcı (Kwapisz)",
          meaning: "Makalenin özetinde belirtilen kullanıcı sayısı.",
        },
        {
          label: "30 kişi, 561 feature (Anguita)",
          meaning:
            "Makalede: 30 gönüllü, belde Samsung Galaxy S II, 50 Hz, 2,56 saniyelik window'lar, %50 overlap, her window için 561 feature, SVM.",
        },
        {
          label: "Postural transition (Reyes-Ortiz)",
          meaning:
            "Geçişleri ya doğrudan öğrenen ya da bilinmeyen aktivite sayan iki uygulama önerilmiş.",
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
            "Makale özetindeki kullanıcı sayısı. Xia vd. aynı veri kümesini WISDM adıyla anar; bu adı Kwapisz'in kendi metninde doğrulamadık.",
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
        "Ronao ve Cho 2016'da telefon sensörleriyle deep learning kullanan bir çalışma yayımladı. Başlığı, yöntemi derin sinir ağı olarak tanımlıyor ve verinin telefon sensörlerinden geldiğini belirtiyor. Hangi veri seti ve hangi mimariyi kullandığı gibi ayrıntıları bu sunumda söylemeyeceğiz; makalenin tamamını okuyunca eklenebilir.",
        "Ignatov 2018'de yalnızca accelerometer verisiyle çalışan bir CNN önerdi ve çalışmanın başlığı gerçek zamanlı tanıma vurguluyor.",
        "CNN'in proje ile ilişkisi şu: proje planında 1D CNN, UCI verisindeki ham window'larla (128 × 6) beslenecek.",
      ],
      data: [
        {
          label: "Slayttaki kartlar",
          meaning:
            "İki kartta da yalnızca makale başlığından ve yayın bilgisinden doğrulanan şeyler var; hiçbir sayı yok.",
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
        "Dua ve arkadaşları 2021'de CNN-GRU tabanlı, çok girdili bir model yayımladı. Bu çalışma GRU'yu ele aldığı için projemizdeki GRU ile ilgili.",
        "LSTM ile GRU'yu karşılaştırmak projede bir araştırma sorusu. Bu çalışmalar ikisini aynı koşulda bizim veri setimizde karşılaştırmıyor; bu bir boşluk olarak sonda tekrar gelecek.",
      ],
      data: [
        {
          label: "Üç veri seti (Hammerla)",
          meaning: "Makale özetinde belirtilen veri seti sayısı.",
        },
        {
          label: "Çok girdili (Dua)",
          meaning:
            "Başlıktaki “multi-input” ifadesi. Girdilerin tam olarak neyi temsil ettiğini özetten doğrulamadım.",
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
        "Dua ve arkadaşları da bir CNN-GRU hibriti. İki çalışmanın ortak fikri: convolutional katman yerel pattern'leri çıkarır, recurrent katman bunların sırasını modeller.",
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
        "Xia ve arkadaşlarının modelinde sıra, başlığın da söylediği gibi LSTM önce, convolutional katmanlar sonra gelir.",
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
        "Dehghani ve arkadaşları overlap'li ve overlap'siz kayan window'ları karşılaştırdı. Özetlerine göre bunu subject-dependent ve subject-independent cross validation ile yaptılar. Alanda overlap'in performansı artırdığı yönünde yaygın bir kanı var; bu çalışma bu kanıyı değerlendiriyor. Sonucun yönünü özetin tamamını okumadan söylemeyeceğim.",
        "Projeyle bağlantı: UCI HAR %50 overlap kullanıyor. Biz katılımcı bazlı bir ayrım planlıyoruz; test katılımcıları eğitimde hiç görülmeyecek. Metrik olarak macro F1-score, sınıf bazında Recall ve Confusion Matrix planlıyoruz; çünkü Accuracy tek başına küçük sınıflardaki hataları gizleyebilir.",
      ],
      data: [
        {
          label: "Window boyutu (Banos 2014)",
          meaning: "Window boyutunun tanıma sürecine etkisini ölçen çalışma.",
        },
        {
          label: "Overlap ve cross validation (Dehghani 2019)",
          meaning: "Overlap'in etkisi iki farklı cross validation türüyle incelenmiştir.",
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
        "Üstteki iki satır SVM kullanan klasik çalışmalar. Sonra sinir ağı çalışmaları: Ronao, Ordóñez, Hammerla ve Ignatov. Alttaki iki satır hibrit modeller: Xia ve Dua.",
        "Sütunlara bakınca hemen görülen şey: veri seti sütunu hiç bir yerde aynı değil. Bazıları telefon, bazıları giyilebilir sensör kullanıyor. Bu yüzden hangi modelin daha iyi olduğunu bu tablodan çıkaramayız.",
        "Örnek: Xia ve arkadaşlarının özetinde UCI, WISDM ve OPPORTUNITY için ayrı doğruluk değerleri veriliyor. Bu üç değer bile birbirine eşit koşullarda ölçülmüş sayılar olarak okunamaz.",
      ],
      data: [
        {
          label: "Veri seti sütunu",
          meaning:
            "Ronao, Ordóñez, Ignatov ve Dua satırlarında veri seti bilgisi yalnızca başlıktan gelen genel ifadedir. Tam veri seti adları doğrulanmadığı için yazılmadı.",
        },
        {
          label: "Not sütunu",
          meaning:
            "Makalenin kendi ifadesine dayanan kısa not: Anguita'da hazır feature'lar, Reyes-Ortiz'de geçişler, Ordóñez'de elle feature tasarımı gerekmemesi, Hammerla'da hiperparametre analizi, Ignatov'da gerçek zamanlı tanıma, Xia'da az parametre, Dua'da çok girdili yapı.",
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
        "Bu bir boşluk iddiası değil, bir tarama sınırı: biz 11 çalışmaya baktık. Başkalarının bu karşılaştırmayı yapmadığını söyleyemeyiz; yalnızca taradığımız çalışmalarda aynı koşulda dört modelin yer almadığını görüyoruz.",
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
