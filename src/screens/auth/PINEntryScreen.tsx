// PIN Entry Screen - Verify PIN with lockout policy

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { PINEntryScreenNavigationProp } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import { verifyPIN, checkLockout, getLockoutTimeRemaining, getFailedAttempts, clearPIN } from '../../utils/pinAuth';
import { deleteRemotePIN } from '../../utils/firestorePinService';
import { useAuthStore } from '../../store/authStore';
import { auth } from '../../../firebaseConfig';
import { signOut } from 'firebase/auth';
import MainMenuButton from '../../components/MainMenuButton';
import { useAuth } from '../../../hooks/useAuth';

const PINEntryScreen: React.FC = () => {
  const navigation = useNavigation<PINEntryScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, setPINVerified } = useAuthStore();
  const { logout } = useAuth();
  
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

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
      navigation.navigate('Main' as never);
    } catch (e) {
      console.error('Sign-out failed', e);
    }
  };

  useEffect(() => {
    checkLockoutStatus();
  }, []);

  const checkLockoutStatus = async () => {
    const lockedOut = await checkLockout();
    setIsLockedOut(lockedOut);
    
    if (lockedOut) {
      const minutes = await getLockoutTimeRemaining();
      setLockoutMinutes(minutes);
    }

    const attempts = await getFailedAttempts();
    setFailedAttempts(attempts);
  };

  const handlePinChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length <= 6) {
      setPin(digits);
    }
  };

  const handleVerify = async () => {
    if (pin.length < 4) {
      Alert.alert(t('common.error'), t('auth.pinTooShort'));
      return;
    }

    // Check lockout before attempting
    const lockedOut = await checkLockout();
    if (lockedOut) {
      const minutes = await getLockoutTimeRemaining();
      Alert.alert(
        t('common.error'),
        t('auth.pinLockout', { minutes })
      );
      return;
    }

    try {
      setLoading(true);
      console.debug('[PINEntryScreen] Verifying PIN for user:', auth.currentUser?.email);
      const isValid = await verifyPIN(pin);
      
      if (isValid) {
        console.debug('[PINEntryScreen] PIN verified successfully');
        
        // Ensure auth store has current firebase user
        try {
          const current = auth.currentUser;
          if (current) {
            // @ts-ignore
            useAuthStore.getState().setUser({
              uid: current.uid,
              email: current.email,
              displayName: current.displayName,
              photoURL: current.photoURL,
            });
            console.debug('[PINEntryScreen] Auth store updated with user:', current.email);
          }
        } catch (e) {
          console.warn('[PINEntryScreen] Could not update auth store:', e);
        }

        setPINVerified(true);
        console.debug('[PINEntryScreen] PIN verified flag set to true, navigating to ParentDashboard');

        // Navigate to ParentDashboard (ParentStack will show ParentTabs as initial route)
        navigation.reset({
          index: 0,
          routes: [{ name: 'ParentDashboard' as never }],
        });
      } else {
        setPin('');
        await checkLockoutStatus();
        
        const attempts = await getFailedAttempts();
        const remaining = 5 - attempts;
        
        if (remaining > 0) {
          Alert.alert(
            t('common.error'),
            `${t('auth.pinIncorrect')}. ${remaining} deneme hakkınız kaldı.`
          );
        } else {
          const minutes = await getLockoutTimeRemaining();
          Alert.alert(
            t('common.error'),
            t('auth.pinLockout', { minutes })
          );
          setIsLockedOut(true);
          setLockoutMinutes(minutes);
        }
      }
    } catch (error) {
      console.error('PIN Verification Error:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPIN = () => {
    console.debug('[PINEntryScreen] Forgot PIN pressed');

    const proceed = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;

        if (currentUser) {
          // Clear local PIN immediately
          await clearPIN();
          console.debug('[PINEntryScreen] Local PIN cleared');

          // Try to delete remote PIN with timeout (don't block the flow if Firestore is offline)
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            );
            await Promise.race([
              deleteRemotePIN(currentUser.uid),
              timeoutPromise
            ]);
            console.debug('[PINEntryScreen] Remote PIN cleared from Firestore');
          } catch (firestoreError: any) {
            console.warn('[PINEntryScreen] Could not clear remote PIN (timeout or offline):', firestoreError?.message);
            // Continue anyway - local PIN is cleared and user will re-login
          }

          // Sign out and navigate to Google Sign In
          await signOut(auth);
          console.debug('[PINEntryScreen] User signed out');

          // Navigate to Google Sign In (will route to PIN setup after re-login)
          navigation.reset({
            index: 0,
            routes: [{ name: 'GoogleSignIn' as never }],
          });
        }
      } catch (error) {
        console.error('[PINEntryScreen] Error resetting PIN:', error);
        if (Platform.OS === 'web') {
          // Fallback to simple alert on web
          (globalThis as any).alert('PIN sıfırlama sırasında bir hata oluştu');
        } else {
          Alert.alert(t('common.error'), 'PIN sıfırlama sırasında bir hata oluştu');
        }
      } finally {
        setLoading(false);
      }
    };

    // On web Alert.alert doesn't support custom async handlers reliably in some environments.
    if (Platform.OS === 'web') {
      const ok = (globalThis as any).confirm('PIN\'inizi sıfırlamak için Google hesabınızla tekrar giriş yapmanız gerekiyor. Devam etmek istiyor musunuz?');
      if (ok) proceed();
      return;
    }

    Alert.alert(
      'PIN\'i Unuttunuz mu?',
      'PIN\'inizi sıfırlamak için Google hesabınızla tekrar giriş yapmanız gerekiyor. Devam etmek istiyor musunuz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Devam Et',
          onPress: proceed,
        },
      ]
    );
  };

  const canVerify = pin.length >= 4 && !isLockedOut;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        {/* Ana Menü Button */}
        <View style={styles.topBar}>
          <MainMenuButton inline onPress={() => navigation.navigate('Main')} />
        </View>

        {/* User Card */}
        {user?.email && (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.email.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.emailText} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={confirmSignOut}
            >
              <Text style={styles.signOutIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
        )}

        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={isLockedOut ? ['#e74c3c', '#c0392b'] : ['#667eea', '#764ba2']}
              style={styles.iconGradient}
            >
              <Text style={styles.icon}>{isLockedOut ? '🔒' : '🔐'}</Text>
            </LinearGradient>
          </View>
        
        <Text style={styles.title}>{t('auth.pinEntryTitle')}</Text>
        <Text style={styles.subtitle}>
          {isLockedOut 
            ? t('auth.pinLockout', { minutes: lockoutMinutes })
            : t('auth.pinEntrySubtitle')
          }
        </Text>

        {failedAttempts > 0 && !isLockedOut && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Yanlış bir PIN kodu girdiniz. Lütfen tekrar deneyiniz.
            </Text>
            <Text style={styles.attemptsText}>
              ⚠️ {5 - failedAttempts} deneme hakkınız kaldı! ⚠️
            </Text>
          </View>
        )}

        <View style={styles.pinContainer}>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            autoFocus
            editable={!isLockedOut}
            placeholder="••••••"
            placeholderTextColor="#64b5f6"
          />
          
          <View style={styles.pinDots}>
            {[...Array(6)].map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.dot,
                  index < pin.length && styles.dotFilled
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.verifyButton, !canVerify && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={!canVerify || loading}
        >
          <Text style={styles.verifyButtonText}>
            {loading ? t('common.loading') : t('common.confirm')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotButton}
          onPress={handleForgotPIN}
          disabled={loading}
        >
          <LinearGradient
            colors={['rgba(100, 126, 234, 0.2)', 'rgba(100, 126, 234, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.forgotGradient}
          >
            <Text style={styles.forgotButtonText}>
              PIN'inizi mi unuttunuz?
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
  topBar: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
  icon: {
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
    marginBottom: 24,
  },
  warningBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  warningText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    fontWeight: '600',
  },
  attemptsText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  pinContainer: {
    marginBottom: 32,
  },
  pinInput: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(13, 27, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(100, 126, 234, 0.3)',
    marginBottom: 24,
    fontWeight: '700',
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 27, 42, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(100, 126, 234, 0.3)',
  },
  dotFilled: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  verifyButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#667eea',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  forgotButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  forgotGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  forgotButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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

export default PINEntryScreen;
