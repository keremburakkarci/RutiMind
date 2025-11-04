// Default reinforcers data - categorized reinforcers with Turkish names

export interface ReinforcerCategory {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  items: ReinforcerItem[];
}

export interface ReinforcerItem {
  id: string;
  name: string;
  nameEn: string;
  categoryId: string;
  icon?: string;
}

export const reinforcerCategories: ReinforcerCategory[] = [
  // Yiyecek ve İçecek Pekiştireçleri
  {
    id: 'food-drink',
    name: 'Yiyecek ve İçecek Pekiştireçleri',
    nameEn: 'Food and Drink Reinforcers',
    color: '#e74c3c',
    items: [
      { id: 'food-1', name: 'Şeker', nameEn: 'Candy', categoryId: 'food-drink', icon: '🍬' },
      { id: 'food-2', name: 'Çikolata', nameEn: 'Chocolate', categoryId: 'food-drink', icon: '🍫' },
      { id: 'food-3', name: 'Pasta', nameEn: 'Cake', categoryId: 'food-drink', icon: '🍰' },
      { id: 'food-4', name: 'Sakız', nameEn: 'Gum', categoryId: 'food-drink', icon: '🫧' },
      { id: 'food-5', name: 'Meyve', nameEn: 'Fruit', categoryId: 'food-drink', icon: '🍎' },
      { id: 'food-6', name: 'Dondurma', nameEn: 'Ice Cream', categoryId: 'food-drink', icon: '🍦' },
      { id: 'food-7', name: 'Kraker', nameEn: 'Cracker', categoryId: 'food-drink', icon: '🍘' },
      { id: 'food-8', name: 'Cips', nameEn: 'Chips', categoryId: 'food-drink', icon: '🥔' },
      { id: 'food-9', name: 'Kek', nameEn: 'Cupcake', categoryId: 'food-drink', icon: '🧁' },
      { id: 'food-10', name: 'Jelibon', nameEn: 'Gummy Candy', categoryId: 'food-drink', icon: '🍭' },
      { id: 'food-11', name: 'Bonibon', nameEn: 'Hard Candy', categoryId: 'food-drink', icon: '🍬' },
      { id: 'food-12', name: 'Çerez', nameEn: 'Snack', categoryId: 'food-drink', icon: '🥜' },
      { id: 'food-13', name: 'Çay', nameEn: 'Tea', categoryId: 'food-drink', icon: '🍵' },
      { id: 'food-14', name: 'Meyve suyu', nameEn: 'Fruit Juice', categoryId: 'food-drink', icon: '🧃' },
      { id: 'food-15', name: 'Süt', nameEn: 'Milk', categoryId: 'food-drink', icon: '🥛' },
      { id: 'food-16', name: 'Kola', nameEn: 'Cola', categoryId: 'food-drink', icon: '🥤' },
    ],
  },

  // Nesne Pekiştireçleri
  {
    id: 'object',
    name: 'Nesne Pekiştireçleri',
    nameEn: 'Object Reinforcers',
    color: '#3498db',
    items: [
      { id: 'object-1', name: 'Top', nameEn: 'Ball', categoryId: 'object', icon: '⚽' },
      { id: 'object-2', name: 'Oyuncak bebek', nameEn: 'Toy Doll', categoryId: 'object', icon: '🧸' },
      { id: 'object-3', name: 'Kalem', nameEn: 'Pen', categoryId: 'object', icon: '✏️' },
      { id: 'object-4', name: 'Silgi', nameEn: 'Eraser', categoryId: 'object', icon: '🧽' },
      { id: 'object-5', name: 'Kalemtıraş', nameEn: 'Sharpener', categoryId: 'object', icon: '✂️' },
      { id: 'object-6', name: 'Sticker', nameEn: 'Sticker', categoryId: 'object', icon: '⭐' },
      { id: 'object-7', name: 'Boyama Kitabı', nameEn: 'Coloring Book', categoryId: 'object', icon: '📖' },
      { id: 'object-8', name: 'Oyun Kartları', nameEn: 'Game Cards', categoryId: 'object', icon: '🃏' },
      { id: 'object-9', name: 'Balon', nameEn: 'Balloon', categoryId: 'object', icon: '🎈' },
      { id: 'object-10', name: 'Oyuncak araba', nameEn: 'Toy Car', categoryId: 'object', icon: '🚗' },
      { id: 'object-11', name: 'Oyun CD\'si', nameEn: 'Game CD', categoryId: 'object', icon: '💿' },
      { id: 'object-12', name: 'Müzik CD\'si', nameEn: 'Music CD', categoryId: 'object', icon: '💽' },
      { id: 'object-13', name: 'Ünlülerin Posterleri', nameEn: 'Celebrity Posters', categoryId: 'object', icon: '🖼️' },
    ],
  },

  // Sosyal Pekiştireçler
  {
    id: 'social',
    name: 'Sosyal Pekiştireçler',
    nameEn: 'Social Reinforcers',
    color: '#f39c12',
    items: [
      { id: 'social-1', name: 'Aferin Deme', nameEn: 'Say "Well Done"', categoryId: 'social', icon: '👍' },
      { id: 'social-2', name: 'Bravo Deme', nameEn: 'Say "Bravo"', categoryId: 'social', icon: '👏' },
      { id: 'social-3', name: 'Çok Güzel Deme', nameEn: 'Say "Very Nice"', categoryId: 'social', icon: '😊' },
      { id: 'social-4', name: 'Harika Deme', nameEn: 'Say "Wonderful"', categoryId: 'social', icon: '🌟' },
      { id: 'social-5', name: 'Bu gün çok iyisin Deme', nameEn: 'Say "You\'re Great Today"', categoryId: 'social', icon: '💫' },
      { id: 'social-6', name: 'Süper Deme', nameEn: 'Say "Super"', categoryId: 'social', icon: '🎉' },
      { id: 'social-7', name: 'Dokunma', nameEn: 'Touch', categoryId: 'social', icon: '🤝' },
      { id: 'social-8', name: 'Kucaklama', nameEn: 'Hug', categoryId: 'social', icon: '🤗' },
      { id: 'social-9', name: 'Alkışlama', nameEn: 'Clap', categoryId: 'social', icon: '👏' },
      { id: 'social-10', name: 'Diğer öğrencilere alkışlatma', nameEn: 'Have Others Clap', categoryId: 'social', icon: '👥' },
      { id: 'social-11', name: 'Saçını Okşama', nameEn: 'Pat Hair', categoryId: 'social', icon: '💆' },
      { id: 'social-12', name: 'Sırtını Sıvazlama', nameEn: 'Pat Back', categoryId: 'social', icon: '🤚' },
      { id: 'social-13', name: 'Sarılma', nameEn: 'Embrace', categoryId: 'social', icon: '🫂' },
      { id: 'social-14', name: 'Çak yapma', nameEn: 'High Five', categoryId: 'social', icon: '✋' },
      { id: 'social-15', name: 'Gülümseme', nameEn: 'Smile', categoryId: 'social', icon: '😃' },
      { id: 'social-16', name: 'Baş ile onaylama', nameEn: 'Nod Approval', categoryId: 'social', icon: '👌' },
      { id: 'social-17', name: 'Öpme', nameEn: 'Kiss', categoryId: 'social', icon: '😘' },
      { id: 'social-18', name: 'Göz Kırpma', nameEn: 'Wink', categoryId: 'social', icon: '😉' },
      { id: 'social-19', name: 'Makas alma', nameEn: 'Scissors (Victory)', categoryId: 'social', icon: '✌️' },
    ],
  },

  // Etkinlik Pekiştireçleri
  {
    id: 'activity',
    name: 'Etkinlik Pekiştireçleri',
    nameEn: 'Activity Reinforcers',
    color: '#9b59b6',
    items: [
      { id: 'activity-1', name: 'Müzik Dinleme', nameEn: 'Listen to Music', categoryId: 'activity', icon: '🎵' },
      { id: 'activity-2', name: 'Bilgisayar Oynama', nameEn: 'Play Computer', categoryId: 'activity', icon: '💻' },
      { id: 'activity-3', name: 'Dans Etme', nameEn: 'Dance', categoryId: 'activity', icon: '💃' },
      { id: 'activity-4', name: 'Çizgi Film Seyretme', nameEn: 'Watch Cartoons', categoryId: 'activity', icon: '📺' },
      { id: 'activity-5', name: 'Top Oynama', nameEn: 'Play Ball', categoryId: 'activity', icon: '⚽' },
      { id: 'activity-6', name: 'Oyun Hamuru İle Oynama', nameEn: 'Play with Play Dough', categoryId: 'activity', icon: '🎨' },
      { id: 'activity-7', name: 'Sınıfı Temizlemede Öğretmene Yardım Etme', nameEn: 'Help Teacher Clean Classroom', categoryId: 'activity', icon: '🧹' },
      { id: 'activity-8', name: 'Evcilik Oynama', nameEn: 'Play House', categoryId: 'activity', icon: '🏠' },
      { id: 'activity-9', name: 'Resim Yapma ve Boyama', nameEn: 'Draw and Paint', categoryId: 'activity', icon: '🖌️' },
      { id: 'activity-10', name: 'Resimli kartlarla eşleştirme oyunu oynama', nameEn: 'Play Picture Card Matching', categoryId: 'activity', icon: '🃏' },
      { id: 'activity-11', name: 'Dersten Erken Çıkma', nameEn: 'Leave Class Early', categoryId: 'activity', icon: '🚪' },
      { id: 'activity-12', name: 'Oyun Parkına Gitme', nameEn: 'Go to Playground', categoryId: 'activity', icon: '🎪' },
    ],
  },
];

// Flatten all reinforcers into a single array
export const allReinforcers: ReinforcerItem[] = reinforcerCategories.flatMap(
  (category) => category.items
);

// Get reinforcers by category
export const getReinforcersByCategory = (categoryId: string): ReinforcerItem[] => {
  const category = reinforcerCategories.find((cat) => cat.id === categoryId);
  return category ? category.items : [];
};

// Get category by id
export const getCategoryById = (categoryId: string): ReinforcerCategory | undefined => {
  return reinforcerCategories.find((cat) => cat.id === categoryId);
};
