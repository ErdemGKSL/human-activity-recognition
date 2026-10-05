import { defineDirections } from "../types";

/**
 * Anlatıcı rehberi: 1. Sunum: Project Proposal (hedef ~8 dk).
 * Henüz deney yapılmadı: hiçbir sonuç kesinmiş gibi anlatılmaz.
 */
export const proposal = defineDirections({
  deckId: "proposal",
  duration: "5–10 dakika (hedef ~8 dk)",
  date: "19.10.2026 (sunum PDF'i teslimi: 18.10.2026 23:55)",
  summary:
    "Bu projede, akıllı telefonların accelerometer ve gyroscope sensörlerinden elde edilen time-series verileriyle yürüme, oturma, ayakta durma, uzanma, merdiven çıkma ve merdiven inme gibi insan aktivitelerinin yapay sinir ağlarıyla sınıflandırılması amaçlanmaktadır. Veri kaynağı, UCI Machine Learning Repository'deki “Smartphone-Based Recognition of Human Activities and Postural Transitions” veri setidir. MLP, 1D CNN, LSTM ve GRU mimarileri aynı katılımcı bazlı veri ayrımıyla eğitilecek ve Accuracy, Precision, Recall, F1-score ve Confusion Matrix ile karşılaştırılacaktır. MLP veri setindeki hazır feature'larla, diğer üç model ham sinyal window'larıyla beslenecektir. Son aşamada kendi telefonumuzdan toplanacak sensör verileriyle, modellerin daha önce görülmemiş gerçek bir kullanıcıya ne kadar genellenebildiği değerlendirilecektir.",
  opening: {
    duration: "~30 saniye",
    text: "Hepimizin cebinde, her saniye onlarca kez hareketimizi ölçen iki sensör var: accelerometer ve gyroscope. Telefonunuz şu anda oturduğunuzu biliyor mu? Bu bilgi sinyalde var; onu çıkarmak için uygun bir model gerekiyor. Bu projede dört nöral ağ mimarisini, MLP, 1D CNN, LSTM ve GRU'yu, aynı veri ayrımı ve aynı metriklerle karşılaştırmayı planlıyoruz. Son adımda modelleri kendi telefonumuzdan topladığımız verilerle sınayacağız.",
  },
  overview: [
    "Teslim: yalnızca sunum PDF'i, 18.10.2026 23:55. PDF'te animasyon yok.",
    "İstenen başlıklar: problem ve önemi (slayt 2), veri seti (4), ANN modelleri (5–6), sonuç beklentileri (8).",
    "Dinleyici: yüksek lisans sınıfı ve hoca. Temel kavramları anlatmayın; problem, veri ve karşılaştırma koşullarına odaklanın.",
    "Henüz sonuç yok: “bekliyoruz, planlıyoruz” deyin, kesin sonuç cümlesi kurmayın.",
    "Maddeleri okumayın, kendi cümlenizle açın. İngilizce terimler sondaki sözlükte.",
  ],
  glossary: [
    {
      term: "Accelerometer",
      meaning:
        "Telefonun x, y ve z eksenlerindeki doğrusal ivmeyi ölçen sensör (birimi g). Yerçekimini de ölçer; telefon masada dururken bile yaklaşık 1 g gösterir.",
    },
    {
      term: "Gyroscope",
      meaning:
        "Telefonun üç eksen etrafındaki dönme hızını (açısal hız) ölçen sensör (birimi rad/s).",
    },
    {
      term: "Time-series",
      meaning:
        "Zamana göre sıralı ölçümler. Bu projede her sensör ekseni saniyede 50 ölçümlük bir time-series üretir.",
    },
    {
      term: "Hz (örnekleme frekansı)",
      meaning: "Saniyedeki ölçüm sayısı. 50 Hz, her 20 milisaniyede bir ölçüm demektir.",
    },
    {
      term: "Window / windowing",
      meaning:
        "Sürekli sinyali sabit uzunlukta parçalara bölme işlemi ve bu parçaların her biri. Burada bir window 2,56 saniye, yani 128 ölçümdür; model her window için bir aktivite tahmini yapar.",
    },
    {
      term: "Overlap",
      meaning:
        "Ardışık window'ların ortak kısmı. %50 overlap'te her window, bir öncekinin ikinci yarısıyla başlar (64 ölçüm ortaktır).",
    },
    {
      term: "Raw window (128 × 6)",
      meaning:
        "Feature hesaplanmamış ham sinyal parçası: 128 zaman adımı × 6 kanal (3 accelerometer + 3 gyroscope ekseni). 1D CNN, LSTM ve GRU'nun girdisi.",
    },
    {
      term: "Feature",
      meaning:
        "Bir window'dan hesaplanan özet sayı; örneğin ortalama, standart sapma, enerji veya bir frekans bileşeni. Veri setinde her window için 561 feature hazır gelir.",
    },
    {
      term: "Feature vector",
      meaning:
        "Bir window'un bütün feature'larını sırayla tutan vektör. Burada 561 boyutludur ve MLP'nin girdisidir.",
    },
    {
      term: "Feature engineering",
      meaning:
        "Feature'ları alan bilgisine dayanarak elle tasarlayıp hesaplama. 1D CNN, LSTM ve GRU bu adımı atlar ve feature'ları ham sinyalden kendileri öğrenir.",
    },
    {
      term: "Flatten",
      meaning:
        "Çok boyutlu veriyi tek bir vektöre açma. 128 × 6'lık bir window flatten edilince 768 sayılık bir vektör olur.",
    },
    {
      term: "ANN",
      meaning:
        "Artificial Neural Network (yapay sinir ağı). MLP, 1D CNN, LSTM ve GRU'nun hepsi ANN türüdür.",
    },
    {
      term: "MLP",
      meaning:
        "Multilayer Perceptron. Her katmandaki nöronların bir sonraki katmanın bütün nöronlarına bağlı olduğu (fully connected) ağ. Girdinin zaman sırasını dikkate almaz; bu projede baseline.",
    },
    {
      term: "Baseline",
      meaning:
        "Diğer modellerin karşılaştırıldığı referans model. Bu projede 561 feature ile beslenen MLP.",
    },
    {
      term: "Convolutional",
      meaning:
        "Aynı küçük filtreyi (aynı ağırlıkları) girdinin üzerinde kaydırarak uygulayan katman türü. Yerel pattern'leri, girdinin neresinde olurlarsa olsunlar yakalar.",
    },
    {
      term: "1D CNN",
      meaning:
        "Tek boyutlu convolutional neural network. Filtreler zaman ekseni boyunca kayar; adım ritmi gibi kısa, yerel pattern'leri öğrenir.",
    },
    {
      term: "Recurrent",
      meaning:
        "Girdiyi zaman adımı zaman adımı işleyen ve her adımın bilgisini bir sonraki adıma taşıyan ağ türü.",
    },
    {
      term: "LSTM",
      meaning:
        "Long Short-Term Memory. Gate'ler ve cell state sayesinde uzun aralıklardaki bilgiyi taşıyabilen recurrent ağ (Hochreiter ve Schmidhuber, 1997).",
    },
    {
      term: "GRU",
      meaning:
        "Gated Recurrent Unit. LSTM'e benzer ama iki gate'i (update, reset) vardır ve ayrı bir cell state tutmaz; aynı hidden size'da daha az parametreye sahiptir (Cho ve arkadaşları, 2014).",
    },
    {
      term: "Gate",
      meaning:
        "LSTM ve GRU'da bilginin ne kadarının tutulacağına, unutulacağına ya da aktarılacağına karar veren, 0 ile 1 arasında değer üreten öğrenilebilir birim.",
    },
    {
      term: "Cell state",
      meaning:
        "LSTM'in adımlar boyunca taşıdığı uzun süreli hafıza vektörü. Gate'ler bu vektöre ne ekleneceğini ve ne silineceğini belirler.",
    },
    {
      term: "Hidden size",
      meaning:
        "Recurrent katmanın her adımda tuttuğu gizli vektörün boyutu. Büyüdükçe modelin kapasitesi ve parametre sayısı artar.",
    },
    {
      term: "Pattern",
      meaning: "Sinyalde tekrar eden şekil; örneğin yürürken her adımda görülen ivme dalgası.",
    },
    {
      term: "Temporal dependency",
      meaning:
        "Bir andaki değerin önceki anlardaki değerlere bağlı olması. LSTM ve GRU bu bağımlılıkları öğrenmek için tasarlanmıştır.",
    },
    {
      term: "Representation",
      meaning:
        "Modelin girdiyi içeride ifade ettiği sayısal biçim. Ham sinyalden öğrenilen feature'lar bir representation'dır; MLP ise hazır feature'ları kullanır.",
    },
    {
      term: "Postural transition",
      meaning:
        "İki duruş arasındaki kısa geçiş hareketi: otur-kalk, kalk-otur, otur-uzan, uzan-otur, kalk-uzan, uzan-kalk. Veri setinde 6 tür vardır ve az örneklidir.",
    },
    {
      term: "Low-pass filter",
      meaning:
        "Yavaş değişen (düşük frekanslı) bileşenleri geçirip hızlı değişenleri bastıran filtre. Veri setinde yerçekimi bileşenini vücut hareketinden ayırmak için kullanılmıştır.",
    },
    {
      term: "Validation set",
      meaning:
        "Eğitim verisinden ayrılan ve hiperparametre seçiminde kullanılan küme. Test kümesine bu aşamada hiç bakılmaz.",
    },
    {
      term: "Data leakage",
      meaning:
        "Test kümesine ait bilginin eğitime sızması; sonuçların gerçekte olduğundan iyi görünmesine yol açar. Burada risk, aynı kişinin overlap'li window'larının hem eğitime hem teste düşmesidir; katılımcı bazlı ayrım bunu önler.",
    },
    {
      term: "Loss",
      meaning: "Modelin tahmin hatasını ölçen ve eğitim sırasında küçültülen fonksiyon.",
    },
    {
      term: "Class-weighted loss",
      meaning:
        "Az örnekli sınıfların hatalarına daha büyük ağırlık veren loss. Sınıflar dengesiz olduğunda modelin küçük sınıfları görmezden gelmesini önler.",
    },
    {
      term: "Softmax",
      meaning:
        "Modelin son katmanında sınıf skorlarını, toplamı 1 olan olasılıklara çeviren fonksiyon. Tahmin edilen aktivite, olasılığı en yüksek olan sınıftır.",
    },
    {
      term: "Accuracy",
      meaning:
        "Doğru sınıflandırılan window'ların tüm window'lara oranı. Sınıflar dengesizse küçük sınıflardaki hataları gizleyebilir.",
    },
    {
      term: "Precision",
      meaning:
        "Model bir sınıfı tahmin ettiğinde ne kadar sıklıkla haklı olduğu. Örneğin “yürüme” tahminlerinin kaçı gerçekten yürüme.",
    },
    {
      term: "Recall",
      meaning:
        "Bir sınıfın gerçek örneklerinin ne kadarının yakalandığı. Örneğin gerçek yürüme window'larının kaçının “yürüme” diye tahmin edildiği.",
    },
    {
      term: "F1-score",
      meaning:
        "Precision ve Recall'un harmonik ortalaması. İkisinden biri düşükse F1 de düşük çıkar.",
    },
    {
      term: "Macro F1-score",
      meaning:
        "F1-score'un her sınıf için ayrı hesaplanıp ağırlıksız ortalaması. Küçük sınıflara büyükler kadar ağırlık verdiği için dengesiz veride Accuracy'den daha dengeli bir özettir.",
    },
    {
      term: "Confusion Matrix",
      meaning:
        "Satırları gerçek sınıf, sütunları tahmin edilen sınıf olan tablo. Köşegen dışındaki hücreler hangi aktivitelerin birbirine karıştığını gösterir.",
    },
    {
      term: "UCI ML Repository",
      meaning:
        "University of California, Irvine'ın makine öğrenmesi araştırmalarında kullanılan açık veri seti arşivi. Projenin veri seti buradan alınıyor.",
    },
  ],
  questions: [
    {
      question:
        "MLP'yi neden ham sinyal yerine 561 feature ile besliyorsunuz? Bu adil bir karşılaştırma mı?",
      answer:
        "MLP, komşu zaman adımları arasındaki ilişkiyi mimarisinde kodlamaz; flatten edilmiş bir ham window'da her adımı ayrı bir girdi olarak görür. Bu yüzden MLP'yi veri setindeki, zaman ve frekans alanında hesaplanmış 561 feature ile baseline model olarak kullanmayı planlıyoruz. Böylece elle tasarlanmış feature'lar ile 1D CNN, LSTM ve GRU'nun ham sinyalden öğrendiği representation'lar de karşılaştırılacak. Bu tasarımda MLP ile diğer modeller arasındaki farkın bir kısmı input representation'ından gelecek; bunu sonuçlarda açıkça belirteceğiz. Zaman kalırsa MLP'yi flatten edilmiş ham window'larla de eğiterek girdi türünün etkisini ayrıca raporlayabiliriz.",
    },
    {
      question: "Eğitim ve test ayrımını nasıl yapacaksınız, data leakage'ı nasıl önleyeceksiniz?",
      answer:
        "Ayrım window bazında değil, katılımcı bazında yapılacak: veri setinin kendi ayrımında gönüllülerin %70'i eğitim, %30'u test kümesinde. Window'lar %50 overlap'li olduğu için rastgele bölünürse aynı kişinin neredeyse aynı window'ları iki tarafa düşer ve sonuçlar gerçekçi olmayacak kadar iyimser çıkar. Hiperparametre seçimi için validation set de eğitim katılımcılarından, yine kişi bazlı ayrılacak; test kümesine yalnızca son değerlendirmede bakılacak.",
    },
    {
      question:
        "Sınıflar dengesiz, özellikle postural transition'lar çok az. Bunu nasıl ele alacaksınız?",
      answer:
        "Geçişler birkaç saniye süren ve az örneği olan sınıflar. Bu yüzden yalnızca Accuracy'ye bakmayacağız; macro F1-score, sınıf bazında Recall ve Confusion Matrix raporlanacak. Gerekirse class-weighted loss kullanılacak. Temel deneyler 6 aktivite üzerinde planlanıyor; geçiş sınıflarının dahil edilmesi ayrı bir deney olarak değerlendirilecek.",
    },
    {
      question:
        "Kendi telefonunuzdan topladığınız veri, veri setindeki kayıtlardan farklı olacak. Bu farkı nasıl yöneteceksiniz?",
      answer:
        "Farkı azaltmak için veriyi 50 Hz'e yeniden örnekleyip aynı birimlere (accelerometer için g, gyroscope için rad/s) çevireceğiz. Telefonu veri setindeki gibi bel bölgesine yerleştireceğiz. Aynı windowing'i ve eğitim kümesinden hesaplanan aynı normalizasyon değerlerini kullanacağız. Yine de cihaz, konum ve kişi farkı nedeniyle performansın düşmesi beklenir; bu düşüşün ne kadar olduğu ve hangi sınıflarda yoğunlaştığı zaten bu ek deneyin cevaplamak istediği sorudur.",
    },
    {
      question: "LSTM ile GRU arasındaki fark nedir, ikisini birden denemek neden gerekli?",
      answer:
        "LSTM'de input, forget ve output gate'leri ile ayrı bir cell state vardır. GRU ise update ve reset gate'leriyle çalışır, ayrı cell state yoktur; bu yüzden aynı hidden size'da daha az parametreye sahiptir ve genellikle daha hızlı eğitilir. 128 adımlık kısa window'larda ikisinin benzer başarı göstermesi olası; karşılaştırma, başarı ile hesaplama maliyeti arasındaki dengeyi göstermek için yapılacak.",
    },
  ],
  slides: {
    cover: {
      time: "30 sn",
      goal: "Dinleyici projenin ne hakkında olduğunu ilk cümlede anlamalı.",
      script: [
        "Açılış konuşmasını (bkz. “Açılış Konuşması” bölümü) bu slayt açıkken yapın. Ardından kendinizi kısaca tanıtın: Erdem Göksel, 261402103.",
        "Bugünkü sunumun bir proje önerisi olduğunu, yani sonuç değil plan sunduğunuzu açıkça söyleyin: “Bugün problemi ve önemini, kullanacağımız veri setini, ANN modellerini ve sonuç beklentilerimizi anlatacağız.”",
      ],
      tips: [
        "Başlığı okumayın; uzun bir başlık, dinleyici zaten okuyor.",
        "İsterseniz telefonunuzu elinize alıp gösterin: “Bu cihazın içindeki iki sensörden bahsedeceğiz.”",
        "Kapağın sol altında adınız ve öğrenci numaranızın altında öğretim üyesinin adı (Cem CANTEKİN) yazıyor; bu satırı okumanıza gerek yok.",
      ],
      funFacts: [
        "Veri setindeki kayıtlar bele takılı bir Samsung Galaxy S II ile toplanmış; deneyler videoya alınmış ve etiketler bu videolardan elle çıkarılmıştır.",
      ],
      transition: "Önce problemi ve neden önemli olduğunu anlatalım.",
    },
    problem: {
      time: "1,5 dk",
      goal: "Sensör sinyalinden aktiviteyi çıkarmak zor, ama çözüldüğünde sağlıktan spora birçok uygulamaya girdi sağlıyor.",
      script: [
        "Veri setinde telefon saniyede 50 kez üç eksende ivme ve üç eksende açısal hız ölçüyor. Elimizde 6 kanallı bir time-series var, ama bu sayılar kendiliğinden “yürüyor” ya da “oturuyor” demiyor. Problem, bu sinyalden altı aktiviteyi sınıflandırmak.",
        "Yürüme ve merdiven çıkma gibi hareketli aktiviteler sinyalde belirgin ritimler oluşturur. Oturma ve ayakta durma ise neredeyse hareketsizdir; aralarındaki fark çoğunlukla telefonun yerçekimine göre duruşundan gelir. Bu yüzden bu iki sınıfın birbirine karışması bekleniyor. Üstelik herkes farklı yürür: modelin bir kişiyi ezberlemesi değil, yeni kişilere genellenmesi gerekiyor.",
        "Son madde önemini söylüyor: hasta ve yaşlı takibi, spor ve egzersiz uygulamaları ve bağlama göre davranan cihazlar, kişinin o an ne yaptığını bilmeye ihtiyaç duyar.",
      ],
      data: [
        {
          label: "6 kanal",
          meaning: "Accelerometer ve gyroscope'un x, y, z eksenleri: 3 + 3 = 6 sinyal.",
        },
        {
          label: "6 aktivite",
          meaning: "Yürüme, merdiven çıkma, merdiven inme, oturma, ayakta durma, uzanma.",
        },
        {
          label: "Son madde (önemi)",
          meaning:
            "Uygulama alanlarıdır; her birine bir örnek yeter (ör. hareketsizlik süresinin takibi, adım ve egzersiz sayımı, telefonun yürürken bildirimleri ertelemesi).",
        },
      ],
      funFacts: [
        "Accelerometer masada hareketsiz dururken bile yaklaşık 1 g ölçer: bu, yerçekimidir. Veri setinde bu bileşen low-pass filter ile vücut hareketinden ayrılmıştır. Durağan aktivitelerde telefonun duruş açısı bu bileşenden okunur.",
      ],
      visuals: [
        "Yürüme ile oturma için aynı eksende 2–3 saniyelik accelerometer sinyali grafiği: biri dalgalı, diğeri neredeyse düz. Veri indirildikten sonra eklenebilir.",
      ],
      tips: [
        "Önce problemi, sonra önemini anlatın; maddeleri okumak yerine kendi cümlelerinizle söyleyin.",
        "“Oturma ile ayakta durma” maddesinde durun; sonuç beklentilerindeki karışıklık tahminine buradan zemin hazırlıyorsunuz.",
      ],
      transition: "Bu problemi hangi amaçla ve hangi sorularla ele alacağımıza bakalım.",
    },
    goal: {
      time: "45 sn",
      goal: "Projenin çıktısı tek bir model değil, dört mimarinin kontrollü bir karşılaştırması.",
      script: [
        "Amacımız dört nöral ağ mimarisini, MLP, 1D CNN, LSTM ve GRU'yu, aynı veri ayrımıyla eğitip aynı metriklerle karşılaştırmak.",
        "Üç sorumuz var. Birincisi, ham sinyali doğrudan işleyen 1D CNN, LSTM ve GRU'nun hazır feature'larla çalışan MLP baseline'ını geçip geçemeyeceği. İkincisi, hangi aktivitelerin birbirine karıştığı. Üçüncüsü, eğitimde hiç olmayan bir kişide, kendi telefonumuzla kaydettiğimiz veride, başarının ne kadar düştüğü.",
      ],
      data: [
        {
          label: "Araştırma soruları",
          meaning:
            "Sonuç beklentileri slaytındaki maddeler bu sorulara verilen ön cevaplardır; sonraki raporlar da bu sorulara göre düzenlenecek.",
        },
      ],
      tips: [
        "Soruları okumak yerine her birini bir cümleyle özetleyin.",
        "Üçüncü soruyu (gerçek kullanıcı) vurgulayın; projenin hazır veri setinin dışına çıktığı kısım bu.",
      ],
      transition: "Bu soruları cevaplamak için kullanacağımız veri setine geçelim.",
    },
    dataset: {
      time: "1 dk",
      goal: "Veri seti açık erişimli, belgelenmiş ve kişi bazlı ayrılmış.",
      script: [
        "Veri seti, UCI Machine Learning Repository'deki “Smartphone-Based Recognition of Human Activities and Postural Transitions”. 19 ile 48 yaş arasındaki 30 gönüllü, bellerine takılı bir telefonla belirlenen aktiviteleri yapmış.",
        "Sinyaller 50 Hz'de, yani saniyede 50 kez örneklenmiş ve 2,56 saniyelik, yüzde 50 overlap'li window'lara bölünmüş; her window 128 ölçüm içeriyor. Veri setinde her window için hesaplanmış 561 feature de hazır olarak bulunuyor.",
        "Etiketlerde 6 temel aktivitenin yanında oturmadan kalkma gibi 6 postural transition var. Temel hedefimiz 6 aktivite; geçiş sınıflarının kullanımını ayrıca değerlendireceğiz.",
        "Eğitim ve test ayrımı kişi bazlı: test kümesindeki gönüllüler eğitimde hiç görülmüyor. Bu yüzden test sonuçları yeni kullanıcılara genellemeyi ölçecek.",
      ],
      data: [
        {
          label: "30 katılımcı",
          meaning:
            "Veri 30 farklı kişiden geliyor; kişi bazlı ayrımda %70'i (21 kişi) eğitim, %30'u (9 kişi) test.",
        },
        {
          label: "12 etiket",
          meaning: "6 temel aktivite + 6 postural transition (ör. otur-kalk, uzan-otur).",
        },
        {
          label: "10.929 örnek",
          meaning:
            "UCI sayfasında belirtilen toplam window sayısı; her biri 561 boyutlu bir feature vector'üyle temsil ediliyor.",
        },
        {
          label: "128 ölçüm",
          meaning: "50 Hz × 2,56 s = 128: bir window, 6 kanal için 128'er ölçümdür (128 × 6).",
        },
      ],
      funFacts: [
        "Bir window 2,56 saniyelik bir hareketi 128 × 6 = 768 sayıyla anlatıyor. Bir yürüme adımı yaklaşık yarım saniye sürdüğü için her window'a birkaç adım sığıyor.",
        "Bu veri seti, 2012'de yayımlanan UCI HAR veri setinin genişletilmiş sürümüdür; yeni eklenen kısım postural transition'lardır.",
      ],
      visuals: [
        "Sınıf başına örnek sayısını gösteren çubuk grafik (veri indirildikten sonra); geçiş sınıflarının azlığı tek bakışta görünür.",
        "Tek bir window'un 6 kanalını üst üste gösteren küçük bir çizgi grafiği.",
      ],
      tips: [
        "“Kişi bazlı ayrım” maddesinde durun; hocanın data leakage sorusuna (bkz. soru 2) zemin hazırlar.",
      ],
      transition: "Peki bu veriyle ne yapacağız? Önerdiğimiz yöntemin akışına bakalım.",
    },
    method: {
      time: "1,5 dk",
      goal: "Dört model aynı veri ayrımı ve aynı metriklerle değerlendirilecek.",
      script: [
        "Soldan sağa, numaralı beş kartı takip edelim. Birinci adımda UCI veri setinden accelerometer ve gyroscope sinyallerini alıyoruz.",
        "Ön işleme adımında sinyaller filtrelenecek, sabit uzunlukta window'lara bölünecek ve eğitim kümesinden hesaplanan değerlerle normalize edilecek.",
        "Modelleme adımında dört mimari eğitilecek. MLP veri setindeki feature vector'leriyle, 1D CNN, LSTM ve GRU ise ham sinyal window'larıyla beslenecek. Bu yüzden MLP ile diğer modeller arasındaki farkın bir kısmı input representation'ından gelecek; bu, sonuçlarda ayrıca belirtilecek.",
        "Değerlendirme adımında modeller aynı test kümesinde metriklerle ve hata analiziyle karşılaştırılacak. Beşinci kart turuncu çerçeveli, çünkü ek deney: kendi telefonumuzdan topladığımız verilerle modelleri gerçek bir kullanıcıda sınayacağız.",
      ],
      data: [
        {
          label: "1–5 numaralı kartlar",
          meaning:
            "Akışın sırası: veri, ön işleme, modelleme, değerlendirme, gerçek veri. Her kartın altındaki satırlar o adımın içeriği.",
        },
        {
          label: "Turuncu çerçeveli 5. kart",
          meaning: "Ek deney: veri setinin dışında, gerçek kullanıcı verisiyle genelleme testi.",
        },
        {
          label: "Ortak akış",
          meaning:
            "Aynı katılımcı ayrımı ve aynı metrikler; üç time-series modeli için ayrıca aynı ön işleme.",
        },
      ],
      tips: [
        "Kartlar PowerPoint'te birer birer, bağlantı çizgileriyle birlikte otomatik belirir; her kartta bir iki cümle yeterli. PDF'te animasyon yok, hepsi baştan görünür.",
        "Turuncu çerçeveli 5. karta gelince kısa bir duraklama yapın; bu adım veri setinin dışında yapılacak tek deney.",
      ],
      transition: "3 numaralı modelleme kartındaki dört mimariye biraz daha yakından bakalım.",
    },
    architectures: {
      time: "1 dk",
      goal: "Her mimari sinyalin farklı bir özelliğini yakalamak için seçildi.",
      script: [
        "MLP sinyalin zaman sırasını görmez; bu yüzden hazır feature'larla baseline model olacak. Diğer modeller bu baseline'ı ne kadar geçebiliyor, ona bakacağız.",
        "1D CNN, zaman ekseni boyunca kayan filtrelerle adım ritmi gibi kısa ve yerel pattern'leri yakalar. Zaman adımlarını paralel işlediği için recurrent ağlardan genellikle daha kısa sürede eğitilir.",
        "LSTM ve GRU recurrent ağlardır; window boyunca bilgiyi taşıyarak temporal dependency'leri öğrenir. GRU, LSTM'e benzer bir yapıyı daha az parametreyle kurar; bu yüzden aralarındaki başarı ve maliyet dengesini de karşılaştıracağız.",
      ],
      data: [
        {
          label: "561 feature",
          meaning:
            "Veri setinde hazır gelen, zaman ve frekans alanında hesaplanmış istatistikler (ortalama, standart sapma, enerji vb.).",
        },
        {
          label: "Ham sinyal",
          meaning:
            "128 × 6 boyutlu window: 128 zaman adımı × 6 sensör kanalı; model feature'ları kendisi öğrenir.",
        },
      ],
      funFacts: [
        "LSTM 1997'de Hochreiter ve Schmidhuber tarafından, GRU ise 2014'te Cho ve arkadaşları tarafından önerildi: aynı “uzun süreli hafıza” problemine 17 yıl arayla iki farklı gate tasarımı.",
      ],
      visuals: [
        "Dört modelin katmanlarını gösteren basit bir şema (girdi, gizli katmanlar, softmax); mimari kesinleşince eklenebilir.",
      ],
      transition: "Bu modelleri hangi ölçütlerle karşılaştıracağımıza geçelim.",
    },
    evaluation: {
      time: "45 sn",
      goal: "Tek bir sayıya değil, sınıf bazında ve hata türüne göre bakılacak.",
      script: [
        "Accuracy genel tabloyu verir ama sınıf bazındaki hataları göstermez; az örnekli postural transition'lar dahil edilirse yanıltıcı olabilir. Bu yüzden sınıf bazında Precision, Recall ve F1-score da raporlanacak.",
        "Confusion Matrix, ikinci araştırma sorusunun cevabını verecek: hangi aktivite hangisiyle karışıyor.",
        "Tüm metrikler, eğitimde hiç görülmemiş katılımcılardan oluşan test kümesinde hesaplanacak.",
      ],
      data: [
        {
          label: "Precision",
          meaning: "Model “yürüme” dediğinde ne sıklıkla haklı? Yanlış alarmları ölçer.",
        },
        {
          label: "Recall",
          meaning: "Gerçek yürüme örneklerinin ne kadarını yakaladı? Kaçırılanları ölçer.",
        },
        {
          label: "F1-score",
          meaning:
            "Precision ve Recall'un harmonik ortalaması; sınıflar üzerinden ortalaması (macro F1) her sınıfa eşit ağırlık verir; az örnekli sınıflar sonucu gizlenmeden etkiler.",
        },
      ],
      tips: [
        "Metrik tanımlarında uzun durmayın; sınıf bilgiyle dolu. Vurgu “neden yalnızca Accuracy değil” sorusunda olsun.",
      ],
      transition: "Bu değerlendirmenin sonunda ne elde etmeyi beklediğimizi özetleyelim.",
    },
    outcomes: {
      time: "1 dk",
      goal: "Beklentiler açık ve sınanabilir; hiçbiri sonuç gibi sunulmuyor.",
      script: [
        "Henüz deney yapmadık; bu slayttaki maddeler deneylerle sınanacak beklentiler ve araştırma sorularına verdiğimiz ön cevaplar.",
        "Birincisi, time-series'i doğrudan işleyen 1D CNN, LSTM ve GRU'nun, elle tasarlanmış feature kullanmadan MLP baseline'ına yakın sonuç vermesini bekliyoruz. MLP'nin 561 hazır feature'ı güçlü bir baseline olduğu için “daha iyi” değil “yakın” diyoruz.",
        "İkincisi, en çok karışıklığın oturma ile ayakta durma arasında çıkmasını bekliyoruz; iki aktivite de durağan ve sinyalleri benzer. Üçüncüsü, LSTM ile GRU'nun benzer başarı göstermesini, GRU'nun daha az parametresi nedeniyle daha kısa sürede eğitilmesini bekliyoruz. Dördüncüsü, kendi telefonumuzdan topladığımız veride cihaz, konum ve kişi farkı nedeniyle başarının düşmesini bekliyoruz; bu düşüşün büyüklüğü ek deneyin cevaplayacağı soru.",
      ],
      data: [
        {
          label: "“MLP baseline'ına yakın”",
          meaning:
            "Karşılaştırma aynı test kümesinde macro F1-score ile yapılacak; “yakın” bilerek seçilmiş, temkinli bir beklenti.",
        },
      ],
      tips: [
        "Beklentileri “bekliyoruz” diliyle anlatın; hiçbir sayı vermeyin, çünkü henüz sonuç yok.",
        "Hoca bir beklentiye itiraz ederse bunu final sunumunda sınayacağınızı söylemek yeterli ve doğru bir cevaptır.",
      ],
      transition: "Dinlediğiniz için teşekkürler.",
    },
    closing: {
      time: "15 sn + sorular",
      goal: "Sorulara açık, kısa ve net bir kapanış.",
      script: [
        "Tek cümlelik bir özetle kapatın: “Özetle: dört nöral ağ mimarisini aynı veri ayrımı ve metriklerle karşılaştıracak, ardından modelleri gerçek bir telefon verisinde sınayacağız.” Ardından soruları davet edin.",
      ],
      tips: [
        "Olası sorular ve cevapları rehberin sonunda. Bilmediğiniz bir soruda “bunu literatür taramasında inceleyeceğiz” demek dürüst ve kabul edilebilir bir cevaptır.",
      ],
    },
  },
});
