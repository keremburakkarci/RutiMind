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
import { verifyPIN, checkLockout, getLockoutTimeRemaining, getFailedAttempts } from '../../utils/pinAuth';
import { useAuthStore } from '../../store/authStore';
import { auth } from '../../../firebaseConfig';

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

  const handleBack = () => {
    navigation.goBack();
  };

  const canVerify = pin.length >= 4 && !isLockedOut;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBack}
      >
        <Text style={styles.backIcon}>←</Text>
        <Text style={styles.backText}>{t('common.back')}</Text>
      </TouchableOpacity>

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
              ⚠️ {5 - failedAttempts} deneme hakkınız kaldı
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

        <Text style={styles.hint}>
          PIN kodunuzu girin (4-6 haneli)
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
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
  hint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default PINEntryScreen;
