// PIN Entry Screen - Verify PIN with lockout policy

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { PINEntryScreenNavigationProp } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import { verifyPIN, checkLockout, getLockoutTimeRemaining, getFailedAttempts, clearPIN } from '../../utils/pinAuth';
import { deleteRemotePIN } from '../../utils/firestorePinService';
import { useAuthStore } from '../../store/authStore';
import { auth } from '../../../firebaseConfig';
import { signOut } from 'firebase/auth';

const PINEntryScreen: React.FC = () => {
  const navigation = useNavigation<PINEntryScreenNavigationProp>();
  const { t } = useTranslation();
  const { setPINVerified } = useAuthStore();
  
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{isLockedOut ? '🔒' : '🔐'}</Text>
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
          <Text style={styles.forgotButtonText}>
            PIN'inizi mi unuttunuz?
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
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
    backgroundColor: 'rgba(251, 188, 4, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 188, 4, 0.3)',
  },
  warningText: {
    fontSize: 14,
    color: '#FBBC04',
    textAlign: 'center',
    fontWeight: '600',
  },
  attemptsText: {
    // Match warningText so all lines use the same font/weight/color
    fontSize: 14,
    color: '#FBBC04',
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
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
    marginBottom: 24,
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
    backgroundColor: '#3D3D3D',
    borderWidth: 2,
    borderColor: '#4D4D4D',
  },
  dotFilled: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  verifyButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#4285F4',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  forgotButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotButtonText: {
    fontSize: 14,
    color: '#64b5f6',
    textDecorationLine: 'underline',
  },
  hint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default PINEntryScreen;
