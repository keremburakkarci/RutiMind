// Main Screen - Entry point with Parent/Student/Education options

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { useSkillsStore } from '../store/skillsStore';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../../hooks/useAuth';

const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { t } = useTranslation();
  const { selectedSkills } = useSkillsStore();
  const { user, setPINVerified } = useAuthStore();
  const { logout } = useAuth();

  const confirmSignOut = async () => {
    try {
      let shouldSignOut = false;
      if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && typeof (globalThis as any).confirm === 'function') {
        shouldSignOut = (globalThis as any).confirm('Oturumu kapatmak istediğinizden emin misiniz?');
      } else {
        shouldSignOut = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Çıkış Yap',
            'Oturumu kapatmak istediğinizden emin misiniz?',
            [
              { text: 'İptal', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Çıkış Yap', style: 'destructive', onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        });
      }

      if (!shouldSignOut) return;

      await logout();
    } catch (e) {
      console.error('Sign-out failed', e);
    }
  };

  const handleParentPress = () => {
    // Reset PIN verification flag when navigating to Auth from Main
    // This ensures user must enter PIN every time they access Parent Panel
    console.debug('[MainScreen] Resetting PIN verification flag, navigating to Auth');
    setPINVerified(false);
    navigation.navigate('Auth');
  };

  const handleStudentPress = () => {
    if (selectedSkills.length === 0) {
      // TODO: Show alert
      return;
    }
    navigation.navigate('StudentFlow');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        {/* User card - top right */}
        {user?.email && (
          <View style={styles.userCard}>
            {user.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.userPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user.email?.charAt(0).toUpperCase() || '👤'}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.emailText} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <TouchableOpacity
              onPress={confirmSignOut}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.logoGradient}
            >
              <Text style={styles.logo}>🧠</Text>
            </LinearGradient>
          </View>
          <Text style={styles.title}>{t('mainMenu.title')}</Text>
          <Text style={styles.subtitle}>{t('mainMenu.subtitle')}</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.buttonWrapper}
            onPress={handleParentPress}
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
                  <Text style={styles.buttonIcon}>👨‍👩‍👧‍👦</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>{t('mainMenu.parentPanel')}</Text>
                  <Text style={styles.buttonDescription}>{t('mainMenu.parentPanelDesc')}</Text>
                </View>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.buttonWrapper}
            onPress={handleStudentPress}
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
                  <Text style={styles.buttonIcon}>👨‍🎓</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>{t('mainMenu.studentMode')}</Text>
                  <Text style={styles.buttonDescription}>{t('mainMenu.studentModeDesc')}</Text>
                </View>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.buttonWrapper}
            onPress={() => navigation.navigate('Education')}
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
                  <Text style={styles.buttonIcon}>📚</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>{t('mainMenu.education')}</Text>
                  <Text style={styles.buttonDescription}>{t('mainMenu.educationDesc')}</Text>
                </View>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('mainMenu.version')}</Text>
        </View>
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
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    letterSpacing: 0.5,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
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
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#666666',
    letterSpacing: 1,
  },
  userCard: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'web' ? 16 : 12,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  userPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  userInfo: {
    maxWidth: 140,
  },
  emailText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  signOutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#ff3b30',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  signOutIcon: {
    fontSize: 16,
  },
});

export default MainScreen;
