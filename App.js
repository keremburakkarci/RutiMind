import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableSkillList from './components/DraggableSkillList';
import { useAuth } from './hooks/useAuth';
import { skillCategories, MAX_SELECTED_SKILLS } from './data/skillsData';
import MainMenuButton from './src/components/MainMenuButton';

// Small helper to produce platform-appropriate shadow styles.
// On web we return a boxShadow string, on native we return the usual shadow* props.
const hexToRgba = (hex = '#000000', alpha = 1) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const webShadow = (color = '#000', offsetY = 2, opacity = 0.12, radius = 6) => {
  if (Platform.OS === 'web') {
    return { boxShadow: `0 ${offsetY}px ${radius}px ${hexToRgba(color, opacity)}` };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [loading, setLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  const { user, signInWithGoogle, logout, loading: authLoading } = useAuth();

  // Debug bilgileri
  console.log('App rendered - currentScreen:', currentScreen);
  console.log('App rendered - user:', user);
  console.log('App rendered - authLoading:', authLoading);

  // Ana menü ekranı
  const MainMenu = () => (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.modernHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.modernLogo}>🧠</Text>
          <Text style={styles.modernTitle}>RutiMind</Text>
          <Text style={styles.modernSubtitle}>Kendini yönetmenin akıllı yolu</Text>
        </View>
      </View>

      <View style={styles.modernMenuContainer}>
        <TouchableOpacity 
          style={[styles.modernCard, styles.parentCard]}
          onPress={() => setCurrentScreen('parent')}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.cardIcon}>👨‍👩‍👧‍👦</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Öğretmen Paneli</Text>
            <Text style={styles.cardDescription}>Becerileri yönet ve takip et</Text>
            <View style={styles.cardAction}>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.smallCardsContainer}>
          <TouchableOpacity 
            style={[styles.modernCard, styles.smallCard, styles.studentCard]}
            onPress={() => {
              if (selectedSkills.length === 0) {
                Alert.alert(
                  'Beceri Listesi Boş',
                  'Öğrenci moduna geçmek için önce öğretmen panelinden beceri listesi oluşturulmalıdır.',
                  [{ text: 'Tamam', style: 'default' }]
                );
                return;
              }
              setCurrentScreen('student');
            }}
          >
            <View style={styles.cardContent}>
              <View style={styles.smallIconContainer}>
                <Text style={styles.cardIcon}>👨‍🎓</Text>
              </View>
              <Text style={styles.smallCardTitle}>Öğrenci Modu</Text>
              <Text style={styles.smallCardDescription}>Becerileri tamamla</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modernCard, styles.smallCard, styles.educationCard]}
            onPress={() => setCurrentScreen('education')}
          >
            <View style={styles.cardContent}>
              <View style={styles.smallIconContainer}>
                <Text style={styles.cardIcon}>📚</Text>
              </View>
              <Text style={styles.smallCardTitle}>Eğitim İçerikleri</Text>
              <Text style={styles.smallCardDescription}>Öğren ve keşfet</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modernFooter}>
        <Text style={styles.footerText}>RutiMind v2.0</Text>
      </View>
    </SafeAreaView>
  );

  // Öğrenci modu ekranı
  const StudentScreen = () => {
    const [isReady, setIsReady] = useState(null);
    // Handler that asks for confirmation twice before returning to main menu
    const handleMainMenuPress = () => {
      Alert.alert(
        'Emin misiniz?',
        'Ana menüye dönmek istediğinize emin misiniz?',
        [
          { text: 'Hayır', style: 'cancel' },
          { text: 'Evet', onPress: () => {
            // Second confirmation
            Alert.alert(
              'Son Onay',
              'Gerçekten çıkmak istediğinize emin misiniz? Bu işlemi onaylamak için tekrar "Evet"e basın.',
              [
                { text: 'Hayır', style: 'cancel' },
                { text: 'Evet', onPress: () => { logout(); setCurrentScreen('main'); } }
              ],
              { cancelable: false }
            );
          } }
        ],
        { cancelable: false }
      );
    };

    if (isReady === null) {
      return (
        <SafeAreaView style={styles.darkContainer}>
          <View style={styles.studentReadyContainer}>
            <View style={styles.readyContent}>
              <Text style={styles.readyEmoji}>🎯</Text>
              <Text style={styles.readyTitle}>HAZIR MISIN?</Text>
              <Text style={styles.readySubtitle}>
                Becerilerini tamamlamaya başlamak için hazır olduğunda "Evet" butonuna tıkla!
              </Text>
              
              <View style={styles.readyButtonsContainer}>
                <TouchableOpacity
                  style={[styles.readyButton, styles.yesButton]}
                  onPress={() => setIsReady(true)}
                >
                  <Text style={styles.readyButtonText}>Evet, Başlayalım!</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.readyButton, styles.noButton]}
                  onPress={() => setCurrentScreen('main')}
                >
                  <Text style={styles.readyButtonText}>Hayır, Ana Menüye Dön</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.darkContainer}>
  {/* Global centered Ana Menü button (shared component) */}
  <MainMenuButton onPress={handleMainMenuPress} />
        <View style={styles.modernStudentHeader}>
          <TouchableOpacity
            style={styles.studentBackButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Text style={styles.studentBackIcon}>←</Text>
            <Text style={styles.studentBackText}>Ana Menü</Text>
          </TouchableOpacity>
          <Text style={styles.studentTitle}>Günlük Becerilerim</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.studentSkillsContainer}>
          {selectedSkills.map((skill, index) => (
            <View key={skill.id} style={styles.studentSkillCard}>
              <View style={styles.skillNumberContainer}>
                <Text style={styles.skillNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.studentSkillContent}>
                <Text style={styles.studentSkillTitle}>{skill.skill}</Text>
                <Text style={styles.studentSkillCategory}>{skill.category.title}</Text>
              </View>
              <View style={styles.skillStatusContainer}>
                <Text style={styles.skillStatusIcon}>⭕</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  };




  // Öğretmen girişi ekranı
  const ParentScreen = () => {
    const [signInLoading, setSignInLoading] = useState(false);
    
    const handleGoogleSignIn = async () => {
      if (signInLoading) return;
      
      try {
        setSignInLoading(true);
        await signInWithGoogle();
        setCurrentScreen('parentDashboard');
      } catch (error) {
        console.error('Google Sign-In Error:', error);
        Alert.alert(
          'Giriş Hatası',
          'Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
          [{ text: 'Tamam', style: 'cancel' }]
        );
      } finally {
        setSignInLoading(false);
      }
    };

    return (
      <SafeAreaView style={styles.darkContainer}>
        {/* Üst Bar */}
        <View style={styles.parentTopBar}>
          {/* Centered Ana Menü button (shared) */}
          <MainMenuButton onPress={() => setCurrentScreen('main')} />
        </View>
        
        <ScrollView style={styles.parentScrollView} contentContainerStyle={styles.parentScrollContent}>
          {/* Başlık Bölümü */}
          <View style={styles.parentHeaderSection}>
            <View style={styles.parentLogoContainer}>
              <Text style={styles.parentLogoText}>👨‍👩‍👧‍👦</Text>
            </View>
            <Text style={styles.parentTitle}>Öğretmen Paneline Hoş Geldiniz!</Text>
            <Text style={styles.parentSubtitle}>
              Çocuğunuzun gelişimini takip etmek için lütfen giriş yapın.
            </Text>
          </View>

          {/* Giriş Kartı */}
          <View style={styles.parentLoginCard}>
            <TouchableOpacity 
              style={[styles.googleSignInButton, signInLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={signInLoading}
            >
              <View style={styles.googleIconContainer}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </Svg>
              </View>
              <Text style={styles.googleButtonTitle}>Google ile Giriş Yap</Text>
              {signInLoading && <ActivityIndicator color="#FFFFFF" size="small" style={styles.loadingIndicator} />}
            </TouchableOpacity>

            <View style={styles.securityInfoContainer}>
              <View style={styles.securityIconBox}>
                <Text style={styles.securityIconText}>🔒</Text>
              </View>
              <Text style={styles.securityInfoText}>
                Güvenli giriş ve veri koruması
              </Text>
            </View>
          </View>
            
            <View style={styles.featuresGrid}>
              <View style={[styles.featureBox, { backgroundColor: 'rgba(66, 133, 244, 0.1)' }]}>
                <Text style={styles.featureEmoji}>📈</Text>
                <Text style={styles.featureBoxTitle}>Gelişim Takibi</Text>
                <Text style={styles.featureBoxDesc}>Detaylı ilerleme raporları</Text>
              </View>

              <View style={[styles.featureBox, { backgroundColor: 'rgba(52, 168, 83, 0.1)' }]}>
                <Text style={styles.featureEmoji}>⚡</Text>
                <Text style={styles.featureBoxTitle}>Kolay Kullanım</Text>
                <Text style={styles.featureBoxDesc}>Sezgisel arayüz</Text>
              </View>

              <View style={[styles.featureBox, { backgroundColor: 'rgba(251, 188, 4, 0.1)' }]}>
                <Text style={styles.featureEmoji}>📱</Text>
                <Text style={styles.featureBoxTitle}>Her Yerden Erişim</Text>
                <Text style={styles.featureBoxDesc}>Mobil uyumlu</Text>
              </View>

              <View style={[styles.featureBox, { backgroundColor: 'rgba(234, 67, 53, 0.1)' }]}>
                <Text style={styles.featureEmoji}>🔔</Text>
                <Text style={styles.featureBoxTitle}>Anlık Bildirimler</Text>
                <Text style={styles.featureBoxDesc}>Güncel kalın</Text>
              </View>
            </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Eğitim içerikleri ekranı - gösterim: yeni sayfada iki başlık (kartlar) - kullanıcı tıklayınca detay (şimdilik placeholder)
  const EducationScreen = () => {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <View style={styles.darkScreenHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')}>
            <Text style={styles.darkBackButton}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.darkScreenTitle}>Eğitim İçerikleri</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
          <TouchableOpacity style={styles.educationCardLarge} onPress={() => Alert.alert('Kendini Yönetme', 'Bu içeriğe yakında eklenecek eğitimler gösterilecek.') }>
            <Text style={styles.educationCardTitle}>Kendini Yönetme Stratejileri Eğitimleri</Text>
            <Text style={styles.educationCardDesc}>Kendini yönetme, kendi kendine yönergeler ve pekiştirme stratejileri hakkında rehberler.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.educationCardLarge} onPress={() => Alert.alert('Uygulama Eğitimi', 'Uygulama kullanımı ile ilgili rehberler yakında ekleniyor.') }>
            <Text style={styles.educationCardTitle}>Uygulama Eğitimi</Text>
            <Text style={styles.educationCardDesc}>RutiMind uygulamasını kullanma, beceri ekleme ve pekiştireçleri yönetme rehberi.</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Beceri ekleme fonksiyonu
  const addSkill = (skill, category) => {
    if (selectedSkills.length >= MAX_SELECTED_SKILLS) {
      Alert.alert('Maksimum Limit', `En fazla ${MAX_SELECTED_SKILLS} beceri seçebilirsiniz.`);
      return;
    }
    
    if (selectedSkills.some(s => s.skill === skill)) {
      Alert.alert('Zaten Seçili', 'Bu beceri zaten seçili beceriler arasında.');
      return;
    }
    
    setSelectedSkills([...selectedSkills, { skill, category, id: Date.now() }]);
  };

  // Beceri çıkarma fonksiyonu
  const removeSkill = (skillId) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
  };

  // Simple reorder functions
  const moveUp = (index) => {
    if (index > 0) {
      const newSkills = [...selectedSkills];
      [newSkills[index - 1], newSkills[index]] = [newSkills[index], newSkills[index - 1]];
      setSelectedSkills(newSkills);
    }
  };

  const moveDown = (index) => {
    if (index < selectedSkills.length - 1) {
      const newSkills = [...selectedSkills];
      [newSkills[index], newSkills[index + 1]] = [newSkills[index + 1], newSkills[index]];
      setSelectedSkills(newSkills);
    }
  };

  // Render skill item with simple reorder buttons
  const renderSkillItem = ({ item, index }) => (
    <View style={[styles.selectedSkillItem, styles.darkSelectedSkillItem]}>
      {/* Move buttons */}
      <View style={styles.moveButtonContainer}>
        <TouchableOpacity
          style={[styles.moveButton, styles.moveUpButton, index === 0 && styles.disabledButton]}
          onPress={() => moveUp(index)}
          disabled={index === 0}
        >
          <Text style={styles.moveButtonText}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.moveButton, styles.moveDownButton, index === selectedSkills.length - 1 && styles.disabledButton]}
          onPress={() => moveDown(index)}
          disabled={index === selectedSkills.length - 1}
        >
          <Text style={styles.moveButtonText}>↓</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.skillNumber}>
        <Text style={styles.darkSkillNumberText}>
          {index + 1}
        </Text>
      </View>
      <View style={styles.skillContent}>
        <Text style={styles.darkSelectedSkillText}>
          {item.skill}
        </Text>
        <Text style={styles.darkSkillCategory}>
          {item.category.title}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeSkill(item.id)}
      >
        <Text style={styles.removeIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );

  // Beceri Listesi Ekranı
  const SkillsScreen = () => {
  const handleReorder = (fromIndex, toIndex) => {
    const newSkills = [...selectedSkills];
    const [movedSkill] = newSkills.splice(fromIndex, 1);
    newSkills.splice(toIndex, 0, movedSkill);
    setSelectedSkills(newSkills);
  };

  return (
    <SafeAreaView style={styles.darkContainer}>
      {/* Modern Header */}
      <View style={styles.modernSkillsHeader}>
        <TouchableOpacity 
          style={styles.skillsBackButton}
          onPress={() => setCurrentScreen('parentDashboard')}
        >
          <Text style={styles.skillsBackIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.skillsHeaderCenter}>
          <Text style={styles.skillsHeaderTitle}>Beceri Listesi</Text>
          <Text style={styles.skillsHeaderSubtitle}>Becerileri düzenle ve yönet</Text>
        </View>
        
        <View style={styles.skillsCountBadge}>
          <Text style={styles.skillsCountText}>{selectedSkills.length}/{MAX_SELECTED_SKILLS}</Text>
        </View>
      </View>
      
      <View style={styles.skillsContainer}>
        {/* Sol taraf - Beceri kategorileri */}
        <View style={styles.skillsLeftPanel}>
          <View style={styles.modernPanelHeader}>
            <View style={styles.panelIconBox}>
              <Text style={styles.panelHeaderIcon}>📚</Text>
            </View>
            <Text style={styles.modernPanelTitle}>Beceri Kategorileri</Text>
          </View>
          <ScrollView style={styles.categoriesScrollView}>
            {skillCategories.map((category) => (
              <View key={category.id} style={styles.categoryContainer}>
                <View style={[
                  styles.categoryHeader, 
                  { 
                    borderLeftColor: category.color,
                    backgroundColor: category.color + '20' // 20% opacity
                  }
                ]}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[styles.darkCategoryTitle, { color: category.color }]}>
                    {category.title}
                  </Text>
                </View>
                <View style={styles.skillsList}>
                  {category.skills.map((skill, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.skillItem,
                        styles.darkSkillItem,
                        styles.indentedSkillItem,
                        { borderLeftColor: category.color }
                      ]}
                      onPress={() => addSkill(skill, category)}
                    >
                      <Text style={[styles.addIcon, { color: category.color }]}>⊕</Text>
                      <Text style={styles.darkSkillText}>
                        {skill}
                      </Text>
                      <View style={[styles.addArrow, { backgroundColor: category.color + '15' }]}>
                        <Text style={[styles.addArrowText, { color: category.color }]}>→</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Sağ taraf - Seçili beceriler */}
        <View style={styles.skillsRightPanel}>
          <ScrollView style={styles.selectedSkillsScrollView} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.modernPanelHeader}>
              <View style={styles.panelIconBox}>
                <Text style={styles.panelHeaderIcon}>✅</Text>
              </View>
              <Text style={styles.modernPanelTitle}>Seçili Beceriler</Text>
              <View style={styles.panelCountBadge}>
                <Text style={styles.panelCountText}>{selectedSkills.length}/{MAX_SELECTED_SKILLS}</Text>
              </View>
            </View>
            {selectedSkills.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.darkEmptyStateText}>
                  Sol taraftan becerileri seçin
                </Text>
              </View>
            ) : (
              <GestureHandlerRootView style={{ flex: 1 }}>
                <DraggableSkillList
                  skills={selectedSkills.map(item => item.skill)}
                  onReorder={handleReorder}
                  onRemove={(skillToRemove) => {
                    const skillToRemoveItem = selectedSkills.find(item => item.skill === skillToRemove);
                    if (skillToRemoveItem) {
                      removeSkill(skillToRemoveItem.id);
                    }
                  }}
                />
              </GestureHandlerRootView>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

  // Öğretmen Dashboard ekranı
  const ParentDashboard = () => {
    // Kullanıcı giriş yapmamışsa ana menüye yönlendir
    useEffect(() => {
      if (!authLoading && !user) {
        setCurrentScreen('main');
      }
    }, [user, authLoading]);

    // Yükleniyor durumu
    if (authLoading) {
      return (
        <SafeAreaView style={styles.darkContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285f4" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        </SafeAreaView>
      );
    }

    // Kullanıcı giriş yapmamışsa boş view döndür
    if (!user) {
      return null;
    }

    return (
      <SafeAreaView style={styles.darkContainer}>
        {/* Modern Header */}
        <View style={styles.modernDashboardHeader}>
          <TouchableOpacity 
            style={styles.dashboardBackButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Text style={styles.dashboardBackIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.dashboardHeaderCenter}>
            <Text style={styles.dashboardHeaderTitle}>Öğretmen Paneli</Text>
            <Text style={styles.dashboardHeaderSubtitle}>{user?.email}</Text>
          </View>
          
          {/* right-side placeholder - global main menu placed above as centered button */}
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.modernDashboardContent}>
          {/* Stats Card */}
          <View style={styles.modernStatsCard}>
            <View style={styles.statsCardHeader}>
              <View>
                <Text style={styles.statsGreeting}>Hoş Geldiniz! 👋</Text>
                <Text style={styles.statsSubtitle}>Güncel istatistikleriniz</Text>
              </View>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(66, 133, 244, 0.15)' }]}>
                  <Text style={styles.statEmoji}>📋</Text>
                </View>
                <Text style={styles.statNumber}>{selectedSkills.length}</Text>
                <Text style={styles.statText}>Aktif Beceri</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 168, 83, 0.15)' }]}>
                  <Text style={styles.statEmoji}>✅</Text>
                </View>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statText}>Tamamlanan</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(251, 188, 4, 0.15)' }]}>
                  <Text style={styles.statEmoji}>🎯</Text>
                </View>
                <Text style={styles.statNumber}>0%</Text>
                <Text style={styles.statText}>Başarı Oranı</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Hızlı İşlemler</Text>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={[styles.quickActionCard, { borderLeftColor: '#4285F4' }]}
                onPress={() => setCurrentScreen('skills')}
              >
                <View style={styles.quickActionHeader}>
                  <View style={[styles.quickActionIconBox, { backgroundColor: 'rgba(66, 133, 244, 0.15)' }]}>
                    <Text style={styles.quickActionIcon}>📋</Text>
                  </View>
                </View>
                <Text style={styles.quickActionTitle}>Beceri Listesi</Text>
                <Text style={styles.quickActionDesc}>Becerileri yönet ve düzenle</Text>
                <View style={styles.quickActionFooter}>
                  <Text style={[styles.quickActionArrow, { color: '#4285F4' }]}>→</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickActionCard, { borderLeftColor: '#34A853' }]}>
                <View style={styles.quickActionHeader}>
                  <View style={[styles.quickActionIconBox, { backgroundColor: 'rgba(52, 168, 83, 0.15)' }]}>
                    <Text style={styles.quickActionIcon}>⏰</Text>
                  </View>
                </View>
                <Text style={styles.quickActionTitle}>Zaman Ayarları</Text>
                <Text style={styles.quickActionDesc}>Süreleri özelleştir</Text>
                <View style={styles.quickActionFooter}>
                  <Text style={[styles.quickActionArrow, { color: '#34A853' }]}>→</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickActionCard, { borderLeftColor: '#FBBC04' }]}>
                <View style={styles.quickActionHeader}>
                  <View style={[styles.quickActionIconBox, { backgroundColor: 'rgba(251, 188, 4, 0.15)' }]}>
                    <Text style={styles.quickActionIcon}>📊</Text>
                  </View>
                </View>
                <Text style={styles.quickActionTitle}>Gelişim Raporu</Text>
                <Text style={styles.quickActionDesc}>Gelişimi takip et</Text>
                <View style={styles.quickActionFooter}>
                  <Text style={[styles.quickActionArrow, { color: '#FBBC04' }]}>→</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickActionCard, { borderLeftColor: '#EA4335' }]}>
                <View style={styles.quickActionHeader}>
                  <View style={[styles.quickActionIconBox, { backgroundColor: 'rgba(234, 67, 53, 0.15)' }]}>
                    <Text style={styles.quickActionIcon}>📷</Text>
                  </View>
                </View>
                <Text style={styles.quickActionTitle}>Fotoğraf Galerisi</Text>
                <Text style={styles.quickActionDesc}>Anıları sakla</Text>
                <View style={styles.quickActionFooter}>
                  <Text style={[styles.quickActionArrow, { color: '#EA4335' }]}>→</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Ana render fonksiyonu
  const renderScreen = () => {
    console.log('renderScreen called with currentScreen:', currentScreen);
    switch (currentScreen) {
      case 'student':
        console.log('Rendering StudentScreen');
        return <StudentScreen />;
      case 'parent':
        console.log('Rendering ParentScreen');
        return <ParentScreen />;
      case 'parentDashboard':
        console.log('Rendering ParentDashboard');
        return <ParentDashboard />;
      case 'skills':
        console.log('Rendering SkillsScreen');
        return <SkillsScreen />;
      case 'education':
        console.log('Rendering EducationScreen');
        return <EducationScreen />;
      default:
        console.log('Rendering MainMenu (default)');
        return <MainMenu />;
    }
  };

  return renderScreen();
} // Ana App bileşeninin kapanışı

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  // Hazır mısın? ekranı stilleri
  studentReadyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  readyContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 24,
    padding: 32,
    ...webShadow('#000', 8, 0.3, 16),
    elevation: 8,
  },
  readyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  readyTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  readySubtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  readyButtonsContainer: {
    width: '100%',
    gap: 16,
  },
  readyButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...webShadow('#000', 4, 0.2, 8),
    elevation: 4,
  },
  yesButton: {
    backgroundColor: '#2ecc71',
  },
  noButton: {
    backgroundColor: '#e74c3c',
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Öğrenci modu ana ekran stilleri
  modernStudentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  studentBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#3d3d3d',
  },
  studentBackIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 8,
  },
  studentBackText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  studentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  studentSkillsContainer: {
    flex: 1,
    padding: 16,
  },
  studentSkillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  skillNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  skillNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentSkillContent: {
    flex: 1,
  },
  studentSkillTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  studentSkillCategory: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  skillStatusContainer: {
    marginLeft: 16,
  },
  skillStatusIcon: {
    fontSize: 24,
  },
  // Modern Header Styles
  modernHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#1a1a1a',
  },
  headerContent: {
    alignItems: 'center',
  },
  modernLogo: {
    fontSize: 48,
    marginBottom: 16,
  },
  modernTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  modernSubtitle: {
    fontSize: 16,
    color: '#64b5f6',
    opacity: 0.9,
  },
  // Modern Menu Container
  modernMenuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Modern Card Styles
  modernCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 8,
    ...webShadow('#000', 4, 0.3, 12),
  },
  parentCard: {
    backgroundColor: '#2c3e50',
    padding: 24,
    borderWidth: 1,
    borderColor: '#34495e',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 30,
  },
  featuredTag: {
    backgroundColor: '#64b5f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#bdc3c7',
    marginBottom: 24,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 16,
    color: '#64b5f6',
    fontWeight: '600',
  },
  actionArrow: {
    fontSize: 20,
    color: '#64b5f6',
    fontWeight: 'bold',
  },
  // Small Cards Container
  smallCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  smallCard: {
    flex: 1,
    padding: 20,
  },
  studentCard: {
    backgroundColor: '#2c3e50',
    borderWidth: 1,
    borderColor: '#34495e',
  },
  educationCard: {
    backgroundColor: '#2c3e50',
    ...webShadow('#000', 4, 0.2, 8),
    elevation: 4,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  smallCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  smallCardDescription: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  // Modern Footer
  modernFooter: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64b5f6',
    opacity: 0.7,
  },
  darkHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#1a1a1a',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
    width: '100%',
  },
  menuButton: {
    backgroundColor: '#2c3e50',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#34495e',
    alignItems: 'center',
    width: '100%',
  },
  featuredButton: {
    borderWidth: 2,
    borderColor: '#4285f4',
    shadowColor: '#4285f4',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  featuredBadge: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  studentButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#f39c12',
  },
  parentButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#4285f4',
  },
  educationButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
  },
  menuButtonIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  menuButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  menuButtonDesc: {
    fontSize: 15,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  buttonFooter: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },
  buttonAction: {
    color: '#4285f4',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  // Dark Mode Styles
  darkContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    width: '100%',
    height: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  darkModeToggle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#f1f3f4',
  },
  darkModeToggleActive: {
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
  },
  darkModeIcon: {
    fontSize: 20,
  },
  darkModeIconActive: {
    color: '#ffffff',
  },
  darkTitle: {
    color: '#ffffff',
  },
  darkSubtitle: {
    color: '#bdc3c7',
  },
  darkMenuButton: {
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
  },
  darkMenuButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  darkMenuButtonDesc: {
    color: '#bdc3c7',
    fontSize: 14,
    textAlign: 'center',
  },
  darkButtonAction: {
    color: '#64b5f6',
    fontSize: 14,
    fontWeight: '600',
  },
  darkFeaturedButton: {
    borderColor: '#4285f4',
    shadowColor: '#4285f4',
  },
  darkFeaturedBadge: {
    backgroundColor: '#4285f4',
  },
  darkMenuButtonText: {
    color: '#ffffff',
  },
  darkMenuButtonDesc: {
    color: '#bdc3c7',
  },
  darkButtonAction: {
    color: '#64b5f6',
  },
  darkFooterText: {
    color: '#7f8c8d',
  },
  debugText: {
    color: '#ff6b6b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  // Öğretmen Giriş Ekranı Dark Mode Styles
  darkAuthScreenHeader: {
    backgroundColor: '#2c3e50',
  },
  darkBackButtonContainer: {
    backgroundColor: '#34495e',
  },
  darkBackButton: {
    color: '#ffffff',
  },
  darkAuthScreenTitle: {
    color: '#ffffff',
  },
  darkWelcomeIcon: {
    backgroundColor: '#34495e',
  },
  darkModernAuthTitle: {
    color: '#ffffff',
  },
  darkModernAuthSubtitle: {
    color: '#bdc3c7',
  },
  darkModernGoogleButton: {
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
  },
  darkModernGoogleButtonText: {
    color: '#ffffff',
  },
  darkGoogleSubText: {
    color: '#bdc3c7',
  },
  darkArrowIcon: {
    color: '#64b5f6',
  },
  darkInfoCard: {
    backgroundColor: '#34495e',
    borderColor: '#4a5568',
  },
  darkInfoCardText: {
    color: '#bdc3c7',
  },
  // Genel Ekran Dark Mode Styles
  darkScreenHeader: {
    backgroundColor: '#2c3e50',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkScreenTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  darkComingSoon: {
    color: '#bdc3c7',
  },
  // Education tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#232323',
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'space-around',
    marginTop: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(66,133,244,0.95)',
  },
  tabText: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#bdc3c7',
    lineHeight: 20,
  },
  educationCardLarge: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  educationCardTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 6,
  },
  educationCardDesc: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  // Dashboard Dark Mode Styles
  darkWelcomeSection: {
    backgroundColor: '#2c3e50',
  },
  darkWelcomeText: {
    color: '#ffffff',
  },
  darkUserEmail: {
    color: '#bdc3c7',
  },
  darkDashboardButton: {
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
  },
  darkDashboardButtonText: {
    color: '#ffffff',
  },
  darkDashboardButtonDesc: {
    color: '#bdc3c7',
  },
  darkLogoutButton: {
    color: '#ff6b6b',
  },
  // Beceri Listesi Styles
  skillsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  skillsLeftPanel: {
    flex: 1,
    backgroundColor: '#2c3e50',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#34495e',
  },
  skillsRightPanel: {
    flex: 1,
    backgroundColor: '#2c3e50',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#34495e',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoriesScrollView: {
    flex: 1,
  },
  selectedSkillsScrollView: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#34495e',
    borderRadius: 14,
    borderLeftWidth: 5,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  skillsList: {
    gap: 8,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#34495e',
    borderRadius: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
    minHeight: 56,
  },
  indentedSkillItem: {
    marginLeft: 16,
    borderLeftWidth: 3,
  },
  skillText: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 20,
  },
  addIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  addArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addArrowText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  selectedSkillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#34495e',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#4a5568',
    minHeight: 70,
  },
  skillNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  skillNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 30,
  },
  skillContent: {
    flex: 1,
  },
  selectedSkillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 20,
  },
  skillCategory: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Dashboard Styles - Modern
  modernDashboardHeader: {
    backgroundColor: '#2D2D2D',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  dashboardBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3D3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardBackIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  dashboardHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dashboardHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  dashboardHeaderSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  dashboardHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 14,
    backgroundColor: '#3D3D3D',
    borderRadius: 20,
    gap: 6,
  },
  dashboardHomeIcon: {
    fontSize: 16,
  },
  dashboardHomeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modernDashboardContent: {
    flex: 1,
    padding: 20,
  },
  modernStatsCard: {
    backgroundColor: '#2D2D2D',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  statsCardHeader: {
    marginBottom: 20,
  },
  statsGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#363636',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    borderLeftWidth: 4,
  },
  quickActionHeader: {
    marginBottom: 12,
  },
  quickActionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  quickActionDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 18,
  },
  quickActionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  quickActionArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Skills Screen Modern Header
  modernSkillsHeader: {
    backgroundColor: '#2D2D2D',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  skillsBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3D3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillsBackIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  skillsHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  skillsHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  skillsHeaderSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  skillsCountBadge: {
    backgroundColor: '#4285F4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  skillsCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Beceri Listesi Dark Mode Styles
  darkSkillItem: {
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
  },
  darkSkillText: {
    color: '#ffffff',
  },
  darkCategoryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  darkPanelTitle: {
    color: '#ffffff',
  },
  darkEmptyStateText: {
    color: '#bdc3c7',
  },
  darkSelectedSkillItem: {
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
  },
  darkSelectedSkillText: {
    color: '#ffffff',
  },
  darkSkillCategory: {
    color: '#bdc3c7',
  },
  darkSkillNumberText: {
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 30,
  },
  // Modern Panel Header Styles
  modernPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  panelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...webShadow('#4285F4', 2, 0.4, 4),
    elevation: 3,
  },
  panelHeaderIcon: {
    fontSize: 20,
  },
  modernPanelTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: 0.5,
  },
  panelCountBadge: {
    backgroundColor: '#4285F4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    ...webShadow('#4285F4', 2, 0.3, 4),
    elevation: 3,
  },
  panelCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Move Button Container
  moveButtonContainer: {
    flexDirection: 'column',
    marginRight: 12,
    gap: 4,
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...webShadow('#000', 2, 0.2, 4),
    elevation: 3,
    borderWidth: 1,
  },
  moveUpButton: {
    backgroundColor: '#27ae60',
    borderColor: '#2ecc71',
  },
  moveDownButton: {
    backgroundColor: '#e67e22',
    borderColor: '#f39c12',
  },
  disabledButton: {
    backgroundColor: '#7f8c8d',
    borderColor: '#95a5a6',
    opacity: 0.5,
  },
  moveButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  draggableContent: {
    paddingVertical: 8,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    ...webShadow('#000', 2, 0.1, 4),
    elevation: 3,
  },
  backButton: {
    fontSize: 18,
    color: '#3498db',
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoon: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  // Modern Authentication Styles
  // Öğretmen Panel Stilleri
  parentTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  parentBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    maxWidth: 120,
    ...webShadow('#000', 2, 0.2, 4),
    elevation: 4,
  },
  parentBackIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  parentBackText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  parentMainButton: {
    alignSelf: 'center',
    backgroundColor: '#2D2D2D',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34495e',
  },
  parentMainText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Centered global main menu wrapper for some screens
  globalMainMenuWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'web' ? 36 : 28,
    alignItems: 'center',
    zIndex: 10000,
    pointerEvents: 'box-none',
  },
  globalMainMenuButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  globalMainMenuText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  parentScrollView: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  parentScrollContent: {
    padding: 24,
    justifyContent: 'flex-start',
    paddingTop: 10,
    minHeight: '100%',
  },
  parentHeaderSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  parentLogoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...webShadow('#000', 4, 0.3, 8),
    elevation: 6,
  },
  parentLogoText: {
    fontSize: 40,
  },
  parentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  parentSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  },
  parentLoginCard: {
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    ...webShadow('#000', 4, 0.3, 8),
    elevation: 6,
    marginBottom: 40,
  },
  googleSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    ...webShadow('#000000', 2, 0.15, 4),
    elevation: 3,
  },
  googleIconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingIndicator: {
    marginLeft: 12,
  },
  googleButtonTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'left',
  },
  googleButtonArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  securityInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#363636',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  securityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#404040',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  securityIconText: {
    fontSize: 16,
  },
  securityInfoText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  featuresContainer: {
    marginTop: 60,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureBox: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#2D2D2D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featureEmoji: {
    fontSize: 24,
    marginBottom: 12,
  },
  featureBoxTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  featureBoxDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  placeholder: {
    width: 24,
  },
  securityText: {
    flex: 1,
    color: '#bdc3c7',
    fontSize: 14,
    lineHeight: 20,
  },
  placeholder: {
    width: 40,
  },
  // Dashboard Styles
  logoutButton: {
    fontSize: 16,
    color: '#e74c3c',
  },
  dashboardContainer: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  dashboardMenu: {
    gap: 15,
  },
  dashboardButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardButtonIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  dashboardButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  dashboardButtonDesc: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});
