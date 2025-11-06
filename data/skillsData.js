// Beceri Kategorileri ve Alt Beceriler
export const skillCategories = [
  {
    id: 'classroom',
    title: 'Sınıf İçi Beceriler',
    icon: '🏫',
    color: '#e74c3c', // Kırmızı
    skills: [
      'Dersi dinlerken göz teması kurdum mu?',
      'Öğretmenin yönergelerini beklemeden uygulamadım mı?',
      'Derse başlamadan gerekli materyalleri hazırladım mı?',
      'El kaldırmadan konuşmadım mı?',
      'Sandalyede uygun şekilde oturdum mu?',
      'Derste dikkat dağıtıcı davranışları fark edip durdurdum mu?',
      '"Sıra bende mi?" gibi öz kontrol cümlelerini kullandım mı?',
      'Token ya da puan sistemiyle kendi davranışımı izledim mi?',
      'Dersin sonunda materyalleri topladım mı?',
      'Dersten ayrılmadan önce öğretmenden izin istedim mi?'
    ]
  },
  {
    id: 'academic',
    title: 'Akademik ve Ödev Yönetimi Becerileri',
    icon: '🧠',
    color: '#3498db', // Mavi
    skills: [
      'Günlük ödev listesini takip ettim mi?',
      'Ödevleri zamanında başlattım mı?',
      'Çalışma süresini timer ile yönettim mi?',
      'Bitirdiğim ödevleri kontrol ettim mi?',
      'Yardım gerektiğinde öğretmene uygun şekilde sordum mu?',
      'Görev bitince kendi kendime "bitti" diyerek işaretledim mi?',
      'Çalışma alanımı düzenli tuttum mu?',
      'Çalışma sırasında molaları planladım mı?',
      'Hatırlatıcı görselleri (checklist, planlayıcı) kullandım mı?'
    ]
  },
  {
    id: 'daily_life',
    title: 'Toplum ve Günlük Yaşam Becerileri',
    icon: '🛍',
    color: '#f39c12', // Turuncu
    skills: [
      'Market alışverişi listesi hazırladım mı?',
      'Ürün seçerken fiyat karşılaştırdım mı?',
      'Kasada sıraya girip bekledim mi?',
      'Parayı doğru şekilde ödedim mi?',
      'Satıcıyla kısa sosyal etkileşim kurdum mu?',
      'Aldığım eşyayı çantama yerleştirdim mi?',
      'Ulaşım aracına uygun şekilde bindim/indim mi?',
      'Günlük temizlik rutinini (elleri yıkama, diş fırçalama) bağımsız sürdürebildim mi?',
      'Kendi kıyafetimi seçip giyindim mi?',
      'Günlük görevleri tamamladıktan sonra işaretledim mi?'
    ]
  },
  {
    id: 'social_emotional',
    title: 'Sosyal ve Duygusal Yönetim Becerileri',
    icon: '💬',
    color: '#9b59b6', // Mor
    skills: [
      'Kızgın veya üzgün hissettiğimde bunu ifade ettim mi?',
      'Sakinleşme köşesi/tekniklerini kullandım mı?',
      'Duygularımı uygun sözcüklerle anlattım mı?',
      'Arkadaşıma selam verip vedalaştım mı?',
      'Grup etkinliğinde sırayla konuştum mu?',
      'Başkasının duygularını tahmin etmeye çalıştım mı?',
      'Aşırı tepki vermeden "hayır" yanıtını kabul ettim mi?',
      'Sosyal bir hata yaptığımda özür diledim mi?',
      'Kendi sakinleştirme kartlarımı kullandım mı?'
    ]
  },
  {
    id: 'time_routine',
    title: 'Zaman ve Günlük Rutin Yönetimi',
    icon: '🕒',
    color: '#27ae60', // Yeşil
    skills: [
      'Günlük planımı sabah gözden geçirdim mi?',
      'Etkinlik geçişlerini zamanlayıcıyla takip ettim mi?',
      'Zamanında derse başladım mı?',
      'Günlük görev listesini tamamladığımda işaretledim mi?',
      'Molalardan sonra göreve geri döndüm mü?',
      'Görsel zaman çizelgesine uygun hareket ettim mi?',
      'Uyku, yemek ve temizlik rutinlerimi sürdürdüm mü?',
      '"5 dakika kaldı" gibi hatırlatmaları fark edip hazırlık yaptım mı?'
    ]
  }
];

// Seçili beceriler için maksimum sayı
export const MAX_SELECTED_SKILLS = 10;
