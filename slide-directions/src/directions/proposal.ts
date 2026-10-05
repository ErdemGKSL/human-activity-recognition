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
    "Bu projede, akıllı telefonların accelerometer ve gyroscope sensörlerinden elde edilen time-series verileriyle yürüme, oturma, ayakta durma, uzanma, merdiven çıkma ve merdiven inme gibi insan aktivitelerinin yapay sinir ağlarıyla sınıflandırılması amaçlanmaktadır. Veri kaynağı, UCI Machine Learning Repository'deki “Smartphone-Based Recognition of Human Activities and Postural Transitions” veri setidir. MLP, 1D CNN, LSTM ve GRU mimarileri aynı katılımcı bazlı veri ayrımıyla eğitilecek ve Accuracy, Precision, Recall, F1-score ve Confusion Matrix ile karşılaştırılacaktır. MLP veri setindeki hazır özniteliklerle, diğer üç model ham sinyal pencereleriyle beslenecektir. Son aşamada kendi telefonumuzdan toplanacak sensör verileriyle, modellerin daha önce görülmemiş gerçek bir kullanıcıya ne kadar genellenebildiği değerlendirilecektir.",
  opening: {
    duration: "~30 saniye",
    text: "Hepimizin cebinde, her saniye onlarca kez hareketimizi ölçen iki sensör var: accelerometer ve gyroscope. Telefonunuz şu anda oturduğunuzu biliyor mu? Bu bilgi sinyalde var; onu çıkarmak için uygun bir model gerekiyor. Bu projede dört nöral ağ mimarisini, MLP, 1D CNN, LSTM ve GRU'yu, aynı veri ayrımı ve aynı metriklerle karşılaştırmayı planlıyoruz. Son adımda modelleri kendi telefonumuzdan topladığımız verilerle sınayacağız.",
  },
  overview: [
    "Teslim edilen tek dosya sunumun PDF'idir (18.10.2026 23:55; dosya: slides/output/proposal.pdf). PDF'te animasyon yoktur; her slayt son hâliyle görünür, bu yüzden slaytlar animasyon olmadan da okunur olmalı. İstenen dört başlık: problemin tarifi ve önemi (slayt 2), veri seti (slayt 4), ANN modelleri (slayt 5–6) ve sonuç beklentileri (slayt 8).",
    "Dinleyici, nöral ağları bilen bir yüksek lisans sınıfı ve dersin hocası. Temel kavramları (katman, geri yayılım) anlatmaya gerek yok; vurgu problemde, veride ve karşılaştırmanın hangi koşullarda yapılacağında olmalı.",
    "Ana hikâye tek cümle: “Aynı veri ayrımı, aynı metrikler, dört mimari: hangisi aktiviteyi daha iyi tanıyor ve bu başarı gerçek bir telefona taşınabiliyor mu?”",
    "Dil proje önerisi dilidir: “amaçlanmaktadır, planlanmaktadır, karşılaştırılacaktır”. Henüz hiçbir sonuç yok; “GRU daha iyi” gibi kesin ifadelerden kaçının, en fazla “beklenmektedir” deyin.",
    "Slaytlarda az metin var; maddeleri okumayın, her maddeyi kendi cümlenizle bir iki cümlede açın. Süreyi tutturmak için her slaytın yanında hedef süre yazıyor.",
  ],
  questions: [
    {
      question:
        "MLP'yi neden ham sinyal yerine 561 öznitelikle besliyorsunuz? Bu adil bir karşılaştırma mı?",
      answer:
        "MLP, komşu zaman adımları arasındaki ilişkiyi mimarisinde kodlamaz; düzleştirilmiş bir ham pencerede her adımı ayrı bir girdi olarak görür. Bu yüzden MLP'yi veri setindeki, zaman ve frekans alanında hesaplanmış 561 öznitelikle referans model olarak kullanmayı planlıyoruz. Böylece elle tasarlanmış öznitelikler ile 1D CNN, LSTM ve GRU'nun ham sinyalden öğrendiği temsiller de karşılaştırılacak. Bu tasarımda MLP ile diğer modeller arasındaki farkın bir kısmı girdi temsilinden gelecek; bunu sonuçlarda açıkça belirteceğiz. Zaman kalırsa MLP'yi düzleştirilmiş ham pencerelerle de eğiterek girdi türünün etkisini ayrıca raporlayabiliriz.",
    },
    {
      question:
        "Eğitim ve test ayrımını nasıl yapacaksınız, veri sızıntısını nasıl önleyeceksiniz?",
      answer:
        "Ayrım pencere bazında değil, katılımcı bazında yapılacak: veri setinin kendi ayrımında gönüllülerin %70'i eğitim, %30'u test kümesinde. Pencereler %50 örtüştüğü için rastgele bölünürse aynı kişinin neredeyse aynı pencereleri iki tarafa düşer ve sonuçlar gerçekçi olmayacak kadar iyimser çıkar. Hiperparametre seçimi için doğrulama kümesi de eğitim katılımcılarından, yine kişi bazlı ayrılacak; test kümesine yalnızca son değerlendirmede bakılacak.",
    },
    {
      question: "Sınıflar dengesiz, özellikle duruş geçişleri çok az. Bunu nasıl ele alacaksınız?",
      answer:
        "Geçişler birkaç saniye süren ve az örneği olan sınıflar. Bu yüzden yalnızca Accuracy'ye bakmayacağız; sınıf ortalamalı (macro) F1-score, sınıf bazında Recall ve Confusion Matrix raporlanacak. Gerekirse sınıf ağırlıklı kayıp fonksiyonu kullanılacak. Temel deneyler 6 aktivite üzerinde planlanıyor; geçiş sınıflarının dahil edilmesi ayrı bir deney olarak değerlendirilecek.",
    },
    {
      question:
        "Kendi telefonunuzdan topladığınız veri, veri setindeki kayıtlardan farklı olacak. Bu farkı nasıl yöneteceksiniz?",
      answer:
        "Farkı azaltmak için veriyi 50 Hz'e yeniden örnekleyip aynı birimlere (accelerometer için g, gyroscope için rad/s) çevireceğiz. Telefonu veri setindeki gibi bel bölgesine yerleştireceğiz. Aynı pencerelemeyi ve eğitim kümesinden hesaplanan aynı normalizasyon değerlerini kullanacağız. Yine de cihaz, konum ve kişi farkı nedeniyle performansın düşmesi beklenir; bu düşüşün ne kadar olduğu ve hangi sınıflarda yoğunlaştığı zaten bu ek deneyin cevaplamak istediği sorudur.",
    },
    {
      question: "LSTM ile GRU arasındaki fark nedir, ikisini birden denemek neden gerekli?",
      answer:
        "LSTM'de giriş, unutma ve çıkış kapıları ile ayrı bir hücre durumu vardır. GRU ise güncelleme ve sıfırlama kapılarıyla çalışır, ayrı hücre durumu yoktur; bu yüzden aynı gizli boyutta daha az parametreye sahiptir ve genellikle daha hızlı eğitilir. 128 adımlık kısa pencerelerde ikisinin benzer başarı göstermesi olası; karşılaştırma, başarı ile hesaplama maliyeti arasındaki dengeyi göstermek için yapılacak.",
    },
  ],
  slides: {
    cover: {
      time: "30 sn",
      goal: "Dinleyici projenin ne hakkında olduğunu ilk cümlede anlamalı.",
      script: [
        "Açılış konuşmasını (bkz. “Açılış Konuşması” bölümü) bu slayt açıkken yapın. Ardından kendinizi kısaca tanıtın: Erdem Göksel, 261402103.",
        "Bugünkü sunumun bir proje önerisi olduğunu, yani sonuç değil plan sunduğunuzu açıkça söyleyin: “Bugün problemi, veri setini ve yöntemimizi anlatacağız.”",
      ],
      tips: [
        "Başlığı okumayın; uzun bir başlık, dinleyici zaten okuyor.",
        "İsterseniz telefonunuzu elinize alıp gösterin: “Bu cihazın içindeki iki sensörden bahsedeceğiz.”",
      ],
      funFacts: [
        "Veri setindeki kayıtlar bele takılı bir Samsung Galaxy S II ile toplanmış; deneyler videoya alınmış ve etiketler bu videolardan elle çıkarılmıştır.",
      ],
      transition: "Önce çözmeye çalıştığımız problemin neden zor olduğuna bakalım.",
    },
    problem: {
      time: "1,5 dk",
      goal: "Sensör sinyalinden aktiviteyi çıkarmak zor, ama çözüldüğünde sağlıktan spora birçok uygulamaya girdi sağlıyor.",
      script: [
        "Veri setinde telefon saniyede 50 kez üç eksende ivme ve üç eksende açısal hız ölçüyor. Elimizde 6 kanallı bir time-series var, ama bu sayılar kendiliğinden “yürüyor” ya da “oturuyor” demiyor. Problem, bu sinyalden altı aktiviteyi sınıflandırmak.",
        "Yürüme ve merdiven çıkma gibi hareketli aktiviteler sinyalde belirgin ritimler oluşturur. Oturma ve ayakta durma ise neredeyse hareketsizdir; aralarındaki fark çoğunlukla telefonun yerçekimine göre duruşundan gelir. Bu yüzden bu iki sınıfın birbirine karışması bekleniyor. Üstelik herkes farklı yürür: modelin bir kişiyi ezberlemesi değil, yeni kişilere genellenmesi gerekiyor.",
        "Önemi: aktivite tanıma; hasta ve yaşlı takibi, spor ve egzersiz uygulamaları ve bağlama göre davranan akıllı cihazlar için girdi sağlar. Sağdaki üç kart bu uygulama alanlarını gösteriyor.",
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
          label: "Önemi kartları",
          meaning:
            "Uygulama alanlarıdır; her birine bir örnek yeter (ör. hareketsizlik süresinin takibi, adım ve egzersiz sayımı, telefonun yürürken bildirimleri ertelemesi).",
        },
      ],
      funFacts: [
        "Accelerometer masada hareketsiz dururken bile yaklaşık 1 g ölçer: bu, yerçekimidir. Veri setinde bu bileşen düşük geçiren bir filtreyle vücut hareketinden ayrılmıştır. Durağan aktivitelerde telefonun duruş açısı bu bileşenden okunur.",
      ],
      visuals: [
        "Yürüme ile oturma için aynı eksende 2–3 saniyelik accelerometer sinyali grafiği: biri dalgalı, diğeri neredeyse düz. Veri indirildikten sonra eklenebilir.",
      ],
      tips: [
        "Önce problemi, sonra önemini anlatın; kartları tek tek okumayın.",
        "“Oturma ile ayakta durma” maddesinde durun; sonuç beklentilerindeki karışıklık tahminine buradan zemin hazırlıyorsunuz.",
      ],
      transition: "Bu problemi hangi amaçla ve hangi sorularla ele alacağımıza bakalım.",
    },
    goal: {
      time: "45 sn",
      goal: "Projenin çıktısı tek bir model değil, dört mimarinin kontrollü bir karşılaştırması.",
      script: [
        "Amacımız dört nöral ağ mimarisini, MLP, 1D CNN, LSTM ve GRU'yu, aynı veri ayrımıyla eğitip aynı metriklerle karşılaştırmak.",
        "Karşılaştırma dört araştırma sorusuna göre yapılacak. Birincisi, dört mimarinin aynı test kümesindeki performansı. İkincisi, zaman serisini doğrudan işleyen modellerin MLP referans modelinden farkı. Üçüncüsü, modellerin hiç görmedikleri gerçek bir kullanıcıya genellenip genellenemeyeceği. Dördüncüsü, hangi aktivitelerin birbirine karıştığı.",
      ],
      data: [
        {
          label: "Araştırma soruları",
          meaning:
            "Sonuç beklentileri slaytındaki dört madde bu sorulara verilen ön cevaplardır; sonraki raporlar da bu sorulara göre düzenlenecek.",
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
        "Sinyaller 50 Hz'de, yani saniyede 50 kez örneklenmiş ve 2,56 saniyelik, yüzde 50 örtüşen pencerelere bölünmüş; her pencere 128 ölçüm içeriyor. Veri setinde her pencere için hesaplanmış 561 öznitelik de hazır olarak bulunuyor.",
        "Etiketlerde 6 temel aktivitenin yanında oturmadan kalkma gibi 6 duruş geçişi var. Temel hedefimiz 6 aktivite; geçiş sınıflarının kullanımını ayrıca değerlendireceğiz.",
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
          meaning: "6 temel aktivite + 6 duruş geçişi (ör. otur-kalk, uzan-otur).",
        },
        {
          label: "10.929 örnek",
          meaning:
            "UCI sayfasında belirtilen toplam pencere sayısı; her biri 561 boyutlu bir öznitelik vektörüyle temsil ediliyor.",
        },
        {
          label: "128 ölçüm",
          meaning: "50 Hz × 2,56 s = 128: bir pencere, 6 kanal için 128'er ölçümdür (128 × 6).",
        },
      ],
      funFacts: [
        "Bir pencere 2,56 saniyelik bir hareketi 128 × 6 = 768 sayıyla anlatıyor. Bir yürüme adımı yaklaşık yarım saniye sürdüğü için her pencereye birkaç adım sığıyor.",
        "Bu veri seti, 2012'de yayımlanan UCI HAR veri setinin genişletilmiş sürümüdür; yeni eklenen kısım duruş geçişleridir.",
      ],
      visuals: [
        "Sınıf başına örnek sayısını gösteren çubuk grafik (veri indirildikten sonra); geçiş sınıflarının azlığı tek bakışta görünür.",
        "Tek bir pencerenin 6 kanalını üst üste gösteren küçük bir çizgi grafiği.",
      ],
      tips: [
        "“Kişi bazlı ayrım” maddesinde durun; hocanın veri sızıntısı sorusuna (bkz. soru 2) zemin hazırlar.",
      ],
      transition: "Peki bu veriyle ne yapacağız? Önerdiğimiz yöntemin akışına bakalım.",
    },
    method: {
      time: "1,5 dk",
      goal: "Dört model aynı veri ayrımı ve aynı metriklerle değerlendirilecek.",
      script: [
        "Soldan sağa gidelim. İlk adımda UCI veri setinden accelerometer ve gyroscope sinyallerini alıyoruz.",
        "Ön işleme adımında sinyaller filtrelenecek, sabit uzunlukta pencerelere bölünecek ve eğitim kümesinden hesaplanan değerlerle normalize edilecek.",
        "Modelleme adımında dört mimari eğitilecek. MLP veri setindeki öznitelik vektörleriyle, 1D CNN, LSTM ve GRU ise ham sinyal pencereleriyle beslenecek. Bu yüzden MLP ile diğer modeller arasındaki farkın bir kısmı girdi temsilinden gelecek; bu, sonuçlarda ayrıca belirtilecek.",
        "Değerlendirme adımında modeller aynı test kümesinde metriklerle ve hata analiziyle karşılaştırılacak. Son adım turuncu, çünkü ek deney: kendi telefonumuzdan topladığımız verilerle modelleri gerçek bir kullanıcıda sınayacağız.",
      ],
      data: [
        {
          label: "Turuncu kutu",
          meaning: "Ek deney: veri setinin dışında, gerçek kullanıcı verisiyle genelleme testi.",
        },
        {
          label: "Ortak akış",
          meaning:
            "Aynı katılımcı ayrımı ve aynı metrikler; üç zamansal model için ayrıca aynı ön işleme.",
        },
      ],
      tips: [
        "Diyagramı parmakla ya da imleçle soldan sağa takip edin; her kutuda bir iki cümle yeterli.",
        "Gerçek veri kutusuna gelince kısa bir duraklama yapın; bu adım veri setinin dışında yapılacak tek deney.",
      ],
      transition: "Modelleme kutusundaki dört mimariye biraz daha yakından bakalım.",
    },
    architectures: {
      time: "1 dk",
      goal: "Her mimari sinyalin farklı bir özelliğini yakalamak için seçildi.",
      script: [
        "MLP sinyalin zaman sırasını görmez; bu yüzden hazır özniteliklerle referans model olacak. Diğer modeller bu referansı ne kadar geçebiliyor, ona bakacağız.",
        "1D CNN, zaman ekseni boyunca kayan filtrelerle adım ritmi gibi kısa ve yerel örüntüleri yakalar. Zaman adımlarını paralel işlediği için tekrarlayan ağlardan genellikle daha kısa sürede eğitilir.",
        "LSTM ve GRU tekrarlayan ağlardır; pencere boyunca bilgiyi taşıyarak zamansal bağımlılıkları öğrenir. GRU, LSTM'e benzer bir yapıyı daha az parametreyle kurar; bu yüzden aralarındaki başarı ve maliyet dengesini de karşılaştıracağız.",
      ],
      data: [
        {
          label: "561 öznitelik vektörü",
          meaning:
            "Veri setinde hazır gelen, zaman ve frekans alanında hesaplanmış istatistikler (ortalama, standart sapma, enerji vb.).",
        },
        {
          label: "Ham pencere (128 × 6)",
          meaning: "128 zaman adımı × 6 sensör kanalı; model öznitelikleri kendisi öğrenir.",
        },
      ],
      funFacts: [
        "LSTM 1997'de Hochreiter ve Schmidhuber tarafından, GRU ise 2014'te Cho ve arkadaşları tarafından önerildi: aynı “uzun süreli hafıza” problemine 17 yıl arayla iki farklı kapı tasarımı.",
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
        "Accuracy genel tabloyu verir ama sınıf bazındaki hataları göstermez; az örnekli duruş geçişleri dahil edilirse yanıltıcı olabilir. Bu yüzden sınıf bazında Precision, Recall ve F1-score da raporlanacak.",
        "Confusion Matrix, dördüncü araştırma sorusunun cevabını verecek: hangi aktivite hangisiyle karışıyor.",
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
        "Henüz deney yapmadık; bu slayttaki maddeler deneylerle sınanacak beklentiler. Her biri bir araştırma sorusuna karşılık geliyor.",
        "Birincisi, zaman serisini doğrudan işleyen 1D CNN, LSTM ve GRU'nun, elle tasarlanmış öznitelik kullanmadan MLP referansına yakın sonuç vermesini bekliyoruz. MLP'nin 561 hazır özniteliği güçlü bir referans olduğu için “daha iyi” değil “yakın” diyoruz.",
        "İkincisi, en çok karışıklığın oturma ile ayakta durma arasında çıkmasını bekliyoruz; iki aktivite de durağan ve sinyalleri benzer. Üçüncüsü, LSTM ile GRU'nun benzer başarı göstermesini, GRU'nun daha az parametresi nedeniyle daha kısa sürede eğitilmesini bekliyoruz. Dördüncüsü, kendi telefonumuzdan topladığımız veride cihaz, konum ve kişi farkı nedeniyle başarının düşmesini bekliyoruz; bu düşüşün büyüklüğü ek deneyin cevaplayacağı soru.",
        "Sağdaki kartlar projenin somut çıktılarını özetliyor: dört model, beş değerlendirme ölçütü ve iki veri kaynağı.",
      ],
      data: [
        {
          label: "“MLP referansına yakın”",
          meaning:
            "Karşılaştırma aynı test kümesinde macro F1-score ile yapılacak; “yakın” bilerek seçilmiş, temkinli bir beklenti.",
        },
        {
          label: "4 · 5 · 2",
          meaning:
            "4 model, 5 değerlendirme ölçütü, 2 veri kaynağı (UCI veri seti ve kendi telefonumuz).",
        },
      ],
      tips: [
        "Beklentileri “bekliyoruz” diliyle anlatın; hiçbir sayı vermeyin, çünkü henüz sonuç yok.",
        "Hoca bir beklentiye itiraz ederse bunu final sunumunda sınayacağınızı söylemek yeterli ve doğru bir cevaptır.",
      ],
      transition: "Son olarak bu işi hangi takvimle yapacağımızı gösterelim.",
    },
    plan: {
      time: "30 sn",
      goal: "Takvim gerçekçi ve teslim tarihleriyle uyumlu.",
      script: [
        "Proje önerisinin PDF'ini 18 Ekim'de teslim ettik, bugün sunuyoruz. Kasım başında literatür taraması raporunu teslim edip ikinci sunumu yapacağız.",
        "Kasım boyunca ön işleme, model eğitimi ve gerçek telefon verisiyle ek deney yapılacak; final raporu ve sunumu Kasım sonu ile Aralık başında tamamlanacak. Mümkün olursa final sunumunda canlı demo göstermeyi planlıyoruz.",
      ],
      data: [
        {
          label: "18.10 (PDF) · 19.10.2026",
          meaning: "Sunum PDF'inin teslimi 18.10.2026 23:55; sunumun kendisi 19.10.2026.",
        },
        {
          label: "01.11 – 09.11.2026",
          meaning: "Literatür raporu teslimi 01.11; ikinci sunum 02.11 veya 09.11.",
        },
        {
          label: "29.11 – 07.12.2026",
          meaning: "Final raporu teslimi 29.11; final sunumu 30.11 veya 07.12.",
        },
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
