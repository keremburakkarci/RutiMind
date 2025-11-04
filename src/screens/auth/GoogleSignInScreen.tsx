// Google Sign-In Screen - Firebase authentication with Google

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AuthScreenNavigationProp } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../../firebaseConfig';
import { useAuthStore } from '../../store/authStore';
import { hasPIN } from '../../utils/pinAuth';
import Svg, { Path } from 'react-native-svg';
import { MainMenuStyles } from '../../components/SharedHeader';

const GoogleSignInScreen: React.FC = () => {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { t } = useTranslation();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading) return;

    try {
      setLoading(true);
      console.debug('[GoogleSignIn] Starting Google sign-in with popup...');
      
      const result = await signInWithPopup(auth, googleProvider);
      console.debug('[GoogleSignIn] signInWithPopup succeeded, user=', result?.user ? { uid: result.user.uid, email: result.user.email } : null);

      if (result && result.user) {
        // Update auth store with user data
        setUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });

        console.debug('[GoogleSignIn] Checking if user has PIN...');
        const pinExists = await hasPIN();
        console.debug('[GoogleSignIn] PIN exists:', pinExists);

        if (!pinExists) {
          // First time user - navigate to PIN setup
          console.debug('[GoogleSignIn] No PIN found, navigating to PINSetup');
          navigation.navigate('PINSetup');
        } else {
          // Returning user - navigate to PIN entry
          console.debug('[GoogleSignIn] PIN found, navigating to PINEntry');
          navigation.navigate('PINEntry');
        }
      }
    } catch (error: any) {
      console.error('[GoogleSignIn] signInWithPopup error:', error);
      Alert.alert(
        t('auth.googleSignInErrorTitle', 'Giriş Hatası'),
        t('auth.googleSignInErrorMessage', 'Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.') + '\n\n' + (error?.message || ''),
        [{ text: t('common.ok', 'Tamam'), style: 'cancel' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Ana Menü button - top aligned to match GlobalTopActions */}
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityLabel="go-to-main"
          onPress={() => navigation.navigate('Main')}
          style={[MainMenuStyles.mainMenuButton, styles.mainMenuButton]}
        >
          <Text style={MainMenuStyles.mainMenuText}>Ana Menü</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>👨‍👩‍👧‍👦</Text>
        </View>
        
        <Text style={styles.title}>{t('auth.welcomeTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>

        <TouchableOpacity 
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <View style={styles.googleIcon}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </Svg>
          </View>
          <Text style={styles.googleButtonText}>{t('auth.signInWithGoogle')}</Text>
          {loading && <ActivityIndicator color="#FFFFFF" size="small" style={styles.loadingIndicator} />}
        </TouchableOpacity>

        <View style={styles.securityInfo}>
          <View style={styles.securityIcon}>
            <Text style={styles.securityIconText}>🔒</Text>
          </View>
          <Text style={styles.securityText}>{t('auth.securityInfo')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  topBar: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  mainMenuButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainMenuText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#4285F4',
    borderRadius: 12,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  loadingIndicator: {
    marginLeft: 12,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#363636',
    padding: 16,
    borderRadius: 12,
  },
  securityIcon: {
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
  securityText: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
});

export default GoogleSignInScreen;
