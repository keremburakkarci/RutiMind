// Beceri Kategorileri ve Alt Beceriler
export const skillCategories = [
  {
    id: 'classroom',
    title: 'Sınıf İçi Beceriler',
    icon: '🏫',
    color: '#e74c3c', // Kırmızı
    skills: [
      'Dersi dinlerken göz teması kurma',
      'Öğretmenin yönergelerini beklemeden uygulamama',
      'Derse başlamadan gerekli materyalleri hazırlama',
      'El kaldırmadan konuşmama',
      'Sandalyede uygun şekilde oturma',
      'Derste dikkat dağıtıcı davranışları fark edip durdurma',
      '"Sıra bende mi?" gibi öz kontrol cümleleri kullanma',
      'Token ya da puan sistemiyle kendi davranışını izlemesi',
      'Dersin sonunda materyalleri toplama',
      'Dersten ayrılmadan önce öğretmenden izin isteme'
    ]
  },
  {
    id: 'academic',
    title: 'Akademik ve Ödev Yönetimi Becerileri',
    icon: '🧠',
    color: '#3498db', // Mavi
    skills: [
      'Günlük ödev listesini takip etme',
      'Ödevleri zamanında başlatma',
      'Çalışma süresini timer ile yönetme',
      'Bitirdiği ödevleri kontrol etme',
      'Yardım gerektiğinde öğretmene uygun şekilde sorma',
      'Görev bitince kendi kendine "bitti" diyerek işaretleme',
      'Çalışma alanını düzenli tutma',
      'Çalışma sırasında molaları planlama',
      'Hatırlatıcı görselleri (checklist, planlayıcı) kullanma'
    ]
  },
  {
    id: 'daily_life',
    title: 'Toplum ve Günlük Yaşam Becerileri',
    icon: '🛍',
    color: '#f39c12', // Turuncu
    skills: [
      'Market alışverişi listesi hazırlama',
      'Ürün seçerken fiyat karşılaştırma',
      'Kasada sıraya girip bekleme',
      'Parayı doğru şekilde ödeme',
      'Satıcıyla kısa sosyal etkileşim kurma',
      'Aldığı eşyayı çantasına yerleştirme',
      'Ulaşım aracına uygun şekilde binme/iniş',
      'Günlük temizlik (elleri yıkama, diş fırçalama) rutinini bağımsız yürütme',
      'Kendi kıyafetlerini seçip giyinme',
      'Günlük görevleri (sofra kurma, odasını toplama) tamamladıktan sonra işaretleme'
    ]
  },
  {
    id: 'social_emotional',
    title: 'Sosyal ve Duygusal Yönetim Becerileri',
    icon: '💬',
    color: '#9b59b6', // Mor
    skills: [
      'Kızgın veya üzgün hissettiğinde bunu ifade etme',
      'Sakinleşme köşesi/teknikleri kullanma',
      'Duygularını uygun sözcüklerle anlatma',
      'Arkadaşına selam verme ve vedalaşma',
      'Grup etkinliğinde sırayla konuşma',
      'Başkasının duygularını tahmin etme',
      'Aşırı tepki vermeden hayır yanıtını kabul etme',
      'Sosyal hata yaptığında özür dileme',
      'Kendi sakinleştirme kartlarını kullanma'
    ]
  },
  {
    id: 'time_routine',
    title: 'Zaman ve Günlük Rutin Yönetimi',
    icon: '🕒',
    color: '#27ae60', // Yeşil
    skills: [
      'Günlük planını sabah gözden geçirme',
      'Etkinlik geçişlerini zamanlayıcıyla takip etme',
      'Zamanında derse başlama',
      'Günlük görev listesini tamamladığında işaretleme',
      'Molalardan sonra göreve geri dönme',
      'Görsel zaman çizelgesine uygun hareket etme',
      'Uyku, yemek ve temizlik rutinlerini sürdürme',
      '"5 dakika kaldı" gibi hatırlatmaları fark edip hazırlık yapma'
    ]
  }
];

// Seçili beceriler için maksimum sayı
export const MAX_SELECTED_SKILLS = 10;
