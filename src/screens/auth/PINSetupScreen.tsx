// PIN Setup Screen - First-time PIN creation (4-6 digits)

import React, { useState } from 'react';
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
import type { PINSetupScreenNavigationProp } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import { setupPIN } from '../../utils/pinAuth';
import { useAuthStore } from '../../store/authStore';
import { auth } from '../../../firebaseConfig';

const PINSetupScreen: React.FC = () => {
  const navigation = useNavigation<PINSetupScreenNavigationProp>();
  const { t } = useTranslation();
  const { setPINVerified } = useAuthStore();
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [loading, setLoading] = useState(false);

  const handlePinChange = (text: string) => {
    // Only allow digits
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length <= 6) {
      if (step === 'enter') {
        setPin(digits);
      } else {
        setConfirmPin(digits);
      }
    }
  };

  const handleContinue = async () => {
    if (step === 'enter') {
      if (pin.length < 4) {
        Alert.alert(t('common.error'), t('auth.pinTooShort'));
        return;
      }
      setStep('confirm');
    } else {
      // Confirm step
        // Normalize and compare (trim just in case) and log masked values to help debug
        const normalizedPin = (pin || '').trim();
        const normalizedConfirm = (confirmPin || '').trim();

        if (normalizedPin !== normalizedConfirm) {
          // Log masked values (do not print full PIN in production logs)
          const mask = (s: string) => '*'.repeat(Math.min(4, s.length)) + (s.length > 4 ? `(+${s.length - 4})` : '');
          console.debug('PIN mismatch during setup', { pinMask: mask(normalizedPin), confirmMask: mask(normalizedConfirm) });

          Alert.alert(
            t('common.error'),
            `${t('auth.pinMismatch')}\n(${normalizedConfirm.length}/${normalizedPin.length} hane girildi)`
          );
          setConfirmPin('');
          return;
        }

      try {
        setLoading(true);
        await setupPIN(pin);
        // Ensure auth store has current firebase user (may be set elsewhere but ensure consistency)
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
          }
        } catch (e) {
          // ignore
        }

        setPINVerified(true);

        // Log then navigate to parent dashboard
        try {
          console.debug('[PINSetupScreen] PIN setup complete, currentUser=', auth.currentUser ? auth.currentUser.uid : null);
        } catch (e) {
          console.debug('[PINSetupScreen] PIN setup complete (no auth.currentUser available)');
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'ParentDashboard' as never }],
        });
      } catch (error) {
        console.error('PIN Setup Error:', error);
        Alert.alert(t('common.error'), t('errors.generic'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
    } else {
      navigation.goBack();
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;
  const canContinue = step === 'enter' ? pin.length >= 4 : confirmPin.length >= 4;

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
          <Text style={styles.icon}>🔐</Text>
        </View>
        
        <Text style={styles.title}>
          {step === 'enter' ? t('auth.pinSetupTitle') : t('auth.pinEntryTitle')}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'enter' ? t('auth.pinSetupSubtitle') : t('auth.pinMismatch')}
        </Text>

        <View style={styles.pinContainer}>
          <TextInput
            style={styles.pinInput}
            value={currentPin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            autoFocus
            placeholder="••••••"
            placeholderTextColor="#64b5f6"
          />
          
          <View style={styles.pinDots}>
            {[...Array(6)].map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.dot,
                  index < currentPin.length && styles.dotFilled
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.continueButton, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue || loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? t('common.loading') : t('common.next')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {t('auth.pinTooShort')}
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
    marginBottom: 48,
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
  continueButton: {
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
  continueButtonText: {
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

export default PINSetupScreen;
