// Turkish translations

export default {
  common: {
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    add: 'Ekle',
    back: 'Geri',
    next: 'İleri',
    done: 'Tamam',
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    confirm: 'Onayla',
    yes: 'Evet',
    no: 'Hayır',
    mainMenu: 'Ana Menü',
  },
  
  // Main Menu
  mainMenu: {
    title: 'RutiMind',
    subtitle: 'Kendini yönetmenin akıllı yolu',
    parentPanel: 'Veli Paneli',
    parentPanelDesc: 'Becerileri yönet ve takip et',
    studentMode: 'Öğrenci Modu',
    studentModeDesc: 'Becerileri tamamla',
    education: 'Eğitim İçerikleri',
    educationDesc: 'Öğren ve keşfet',
    version: 'RutiMind v2.0',
  },
  
  // Authentication
  auth: {
    welcomeTitle: 'Veli Paneline Hoş Geldiniz!',
    welcomeSubtitle: 'Çocuğunuzun gelişimini takip etmek için lütfen giriş yapın.',
    signInWithGoogle: 'Google ile Giriş Yap',
    securityInfo: 'Güvenli giriş ve veri koruması',
    pinSetupTitle: 'Lütfen 6 haneli bir PIN oluşturun.',
    pinSetupSubtitle: 'Uygulamaya girmek için 6 haneli bir PIN belirleyin.',
    pinEntryTitle: 'PIN Kodu',
    pinEntrySubtitle: 'Devam etmek için lütfen daha önceden belirlediğiniz PIN kodunuzu giriniz.',
    pinMismatch: 'PIN kodları eşleşmiyor',
    pinTooShort: 'PIN en az 4 haneli olmalıdır',
    pinTooLong: 'PIN en fazla 6 haneli olmalıdır',
    pinIncorrect: 'Yanlış PIN kodu',
    pinLockout: 'Çok fazla hatalı deneme. Lütfen {{minutes}} dakika bekleyin.',
    signOut: 'Çıkış Yap',
  },
  
  // Skills
  skills: {
    title: 'Beceri Listesi',
    subtitle: 'Becerileri düzenle ve yönet',
    categories: 'Beceri Kategorileri',
    selected: 'Seçili Beceriler',
    selectedSkills: 'Seçili Beceriler',
    addSkill: 'Beceri Ekle',
    removeSkill: 'Beceriyi Kaldır',
    maxSkillsReached: 'Maksimum {{max}} beceri seçebilirsiniz',
    alreadySelected: 'Bu beceri zaten seçili',
    uploadImage: 'Fotoğraf Yükle',
    duration: 'Süre',
    minutes: 'dakika',
    totalDuration: 'Toplam Süre',
    maxDuration: 'Toplam süre en fazla 2 saat olabilir',
    noImageSelected: 'Lütfen her beceri için fotoğraf yükleyin',
    noDurationSet: 'Lütfen her beceri için süre belirleyin',
    saveSuccess: 'Beceriler başarıyla kaydedildi',
    saved: 'Beceriler kaydedildi!',
    waitTime: 'Bekleme Süresi',
    fixedRow: 'Sabit Satır',
    emptyState: 'Sol taraftan becerileri seçin',
    noSkillsSelected: 'Henüz beceri seçilmedi',
    search: 'Beceri ara...',
    save: 'Kaydet',
    errors: {
      missingImages: 'Lütfen tüm beceriler için fotoğraf yükleyin',
      totalDurationExceeded: 'Toplam süre 2 saati geçemez',
    },
  },
  
  // Reinforcers
  reinforcers: {
    title: 'Pekiştireçler',
    subtitle: 'Pekiştireçleri düzenle ve yönet',
    list: 'Pekiştireç Listesi',
    selected: 'Seçili Pekiştireçler',
    addReinforcer: 'Pekiştireç Ekle',
    name: 'İsim',
    slot: 'Slot',
    slotDescription: 'Bu pekiştireç kaç olumlu davranış sonrası gösterilsin?',
    saveSuccess: 'Pekiştireçler başarıyla kaydedildi',
    emptyState: 'Henüz pekiştireç eklenmemiş',
  },
  
  // Progress
  progress: {
    title: 'Gelişim Grafiği',
    subtitle: 'İlerlemeyi takip et',
    dailyProgress: 'Günlük İlerleme',
    totalSkills: 'Toplam Beceri',
    completedSkills: 'Tamamlanan',
    successRate: 'Başarı Oranı',
    yesResponses: 'Evet Yanıtları',
    noResponses: 'Hayır Yanıtları',
    noResponse: 'Yanıtsız',
    selectDate: 'Tarih Seçin',
    noDataAvailable: 'Bu tarih için veri bulunmuyor',
    sessionDetails: 'Oturum Detayları',
  },
  
  // Student Flow
  student: {
    readyTitle: 'HAZIR MISIN?',
    readySubtitle: 'Becerilerini tamamlamaya başlamak için hazır olduğunda "Evet" butonuna tıkla!',
    readyYes: 'Evet, Başlayalım!',
    readyNo: 'Hayır, Ana Menüye Dön',
    waitingTitle: 'Bekleniyor...',
    waitingSubtitle: '{{seconds}} saniye sonra başlayacak',
    skillQuestion: 'Bunu yaptın mı?',
    respond: 'Yanıtla',
    timeRemaining: '{{seconds}} saniye kaldı',
    sessionComplete: 'Oturum Tamamlandı!',
    sessionCompleteMessage: 'Tebrikler! Tüm becerileri tamamladın.',
    backToMenu: 'Ana Menüye Dön',
    noSkillsConfigured: 'Beceri listesi boş. Lütfen önce veli panelinden beceri ekleyin.',
  },
  
  // Dashboard
  dashboard: {
    welcome: 'Hoş Geldiniz! 👋',
    currentStats: 'Güncel istatistikleriniz',
    activeSkills: 'Aktif Beceri',
    completed: 'Tamamlanan',
    quickActions: 'Hızlı İşlemler',
    skillsList: 'Beceri Listesi',
    skillsListDesc: 'Becerileri yönet ve düzenle',
    timeSettings: 'Zaman Ayarları',
    timeSettingsDesc: 'Süreleri özelleştir',
    progressReport: 'Gelişim Raporu',
    progressReportDesc: 'Gelişimi takip et',
    photoGallery: 'Fotoğraf Galerisi',
    photoGalleryDesc: 'Anıları sakla',
  },
  
  // Education
  education: {
    title: 'Eğitim İçerikleri',
    subtitle: 'Öğren ve keşfet',
    selfManagement: 'Kendi Kendini Yönetme',
    appUsage: 'Uygulama Kullanımı',
    comingSoon: 'Eğitim videoları yakında!',
    
    // Self-management topics
    selfCues: 'Kendine İpucu Verme',
    selfInstruction: 'Kendine Talimat Verme',
    selfMonitoring: 'Kendi Kendini İzleme',
    selfEvaluation: 'Kendi Kendini Değerlendirme',
    selfReinforcement: 'Kendini Pekiştirme',
    
    // App usage topics
    parentMode: 'Veli Modu Kullanımı',
    studentMode: 'Öğrenci Modu Kullanımı',
  },
  
  // Validation
  validation: {
    required: 'Bu alan zorunludur',
    minLength: 'En az {{min}} karakter olmalıdır',
    maxLength: 'En fazla {{max}} karakter olabilir',
    invalidEmail: 'Geçerli bir e-posta adresi girin',
    invalidNumber: 'Geçerli bir sayı girin',
    minValue: 'En az {{min}} olmalıdır',
    maxValue: 'En fazla {{max}} olabilir',
  },
  
  // Errors
  errors: {
    generic: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    network: 'İnternet bağlantısı hatası',
    authentication: 'Giriş hatası. Lütfen tekrar deneyin.',
    permission: 'Bu işlem için izin gerekli',
    notFound: 'İçerik bulunamadı',
    serverError: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  },
};
