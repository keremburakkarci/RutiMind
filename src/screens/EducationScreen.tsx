import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalTopActions from '../components/GlobalTopActions';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';

const EducationScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <View style={styles.container}>
      {/* Global top actions with back button */}
      <GlobalTopActions title="Eğitim İçerikleri" showBack />
      
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        {/* Spacer to avoid overlapping with absolute top bar */}
        <View style={styles.headerSpacer} />
        
        <View style={styles.header}>
          <Text style={styles.subtitle}>Kendini yönetme stratejileri ve uygulamanın kullanımına yönelik eğitici videolar aşağıdadır</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => navigation.navigate('SelfManagement' as any)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#2D6A96', '#4facfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconWrapper}>
                  <Text style={styles.buttonIcon}>📚</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Kendini Yönetme Stratejileri Eğitimleri</Text>
                  <Text style={styles.buttonDescription}>Kendini yönetme stratejileri eğitim videolarına ulaşmak için tıklayın.</Text>
                </View>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() =>
              navigation.navigate('VideoSequence' as any, {
                screenTitle: 'Uygulama Eğitimi',
                steps: [
                  { title: 'Uygulamaya giriş', videoUrl: null },
                  { title: 'Veli Paneline Giriş', videoUrl: null },
                  { title: 'Becerileri Belirleme', videoUrl: null },
                  { title: 'Pekişireçleri Belirleme', videoUrl: null },
                  { title: 'Gelişim Grafiğini Görüntüleme', videoUrl: null },
                  { title: 'Öğrenci moduna giriş', videoUrl: null },
                  { title: 'Örnek Video', videoUrl: null },
                ],
              })
            }
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#8B5CF6', '#a78bfa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconWrapper}>
                  <Text style={styles.buttonIcon}>📱</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Uygulama Eğitimi</Text>
                  <Text style={styles.buttonDescription}>Uygulama eğitimi videolarına ulaşmak için tıklayın.</Text>
                </View>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    flex: 1,
  },
  headerSpacer: { 
    height: 96 
  },
  header: { 
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  subtitle: { 
    fontSize: 14,
    color: '#999999',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 24,
    gap: 16,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 28,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  buttonDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  buttonArrow: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default EducationScreen;
