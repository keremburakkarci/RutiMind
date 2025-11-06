import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalTopActions from '../../components/GlobalTopActions';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

type ParentStackNavProp = any;

const ParentHome: React.FC = () => {
  const navigation = useNavigation<ParentStackNavProp>();
  const { t } = useTranslation();
  

  return (
    <View style={styles.container}>
      {/* Global top actions (title, main menu, user profile) */}
      <GlobalTopActions title={t('parent.homeTitle', 'Veli Paneli')} showBack={false} />
      
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        {/* Spacer to avoid overlapping with absolute top bar */}
        <View style={styles.headerSpacer} />

        <View style={styles.header}>
          <Text style={styles.subtitle}>{t('parent.homeSubtitle', 'Becerileri ve pekiştireçleri yönetin, gelişimi takip edin')}</Text>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => navigation.navigate('ParentTabs' as never, { screen: 'Skills' } as never)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconWrapper}>
                  <Text style={styles.buttonIcon}>📋</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>{t('skills.title', 'Beceri Listesi')}</Text>
                  <Text style={styles.buttonDescription}>{t('parent.goToSkills', 'Becerileri görüntüle ve düzenle')}</Text>
                </View>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => navigation.navigate('ParentTabs' as never, { screen: 'Reinforcers' } as never)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconWrapper}>
                  <Text style={styles.buttonIcon}>🎁</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>{t('reinforcers.title', 'Pekiştireçler')}</Text>
                  <Text style={styles.buttonDescription}>{t('parent.goToReinforcers', 'Pekiştireçleri yönet')}</Text>
                </View>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => navigation.navigate('ParentTabs' as never, { screen: 'Progress' } as never)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconWrapper}>
                  <Text style={styles.buttonIcon}>📈</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>{t('progress.title', 'Gelişim Grafiği')}</Text>
                  <Text style={styles.buttonDescription}>{t('parent.goToProgress', 'Gelişimi görselleştir')}</Text>
                </View>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000' 
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
  menu: { 
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

export default ParentHome;
