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
import { syncPINToFirestore } from '../../utils/firestorePinService';
import { useAuthStore } from '../../store/authStore';
import { auth } from '../../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useRef } from 'react';

const PINSetupScreen: React.FC = () => {
  const navigation = useNavigation<PINSetupScreenNavigationProp>();
  const { t } = useTranslation();
  const { setPINVerified } = useAuthStore();
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmAttempts, setConfirmAttempts] = useState(0);
  const MAX_CONFIRM_ATTEMPTS = 3;
  const confirmInputRef = useRef<any>(null);

  const handlePinChange = (text: string) => {
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
    
    // Only allow digits
    const digits = text.replace(/[^0-9]/g, '');
    // Enforce exactly 6 digits
    if (digits.length <= 6) {
      if (step === 'enter') {
        setPin(digits);
      } else {
        setConfirmPin(digits);
      }
    }
  };

  const handleContinue = async () => {
    // Clear any previous error
    setErrorMessage('');
    
    if (step === 'enter') {
      // Must be exactly 6 digits
      if (pin.length !== 6) {
        setErrorMessage('PIN kodu 6 haneli olmalıdır!');
        return;
      }
      setStep('confirm');
    } else {
      // Confirm step - must be exactly 6 digits
      if (confirmPin.length !== 6) {
        setErrorMessage('PIN kodu6 haneli olmalıdır!');
        return;
      }

      // Normalize and compare (trim just in case) and log masked values to help debug
      const normalizedPin = (pin || '').trim();
      const normalizedConfirm = (confirmPin || '').trim();

      if (normalizedPin !== normalizedConfirm) {
        // Log masked values (do not print full PIN in production logs)
        const mask = (s: string) => '*'.repeat(Math.min(4, s.length)) + (s.length > 4 ? `(+${s.length - 4})` : '');
        console.debug('[PINSetupScreen] PIN mismatch during setup', { pinMask: mask(normalizedPin), confirmMask: mask(normalizedConfirm) });

        // Increment attempt count
        const newAttempts = confirmAttempts + 1;
        setConfirmAttempts(newAttempts);

        // If attempts remain, show inline message and remaining count
        if (newAttempts < MAX_CONFIRM_ATTEMPTS) {
          const remaining = MAX_CONFIRM_ATTEMPTS - newAttempts;
          const inlineMessage = `❌ Girdiğiniz PIN kodları eşleşmiyor. Lütfen tekrar deneyiniz.`;
          setErrorMessage(`${inlineMessage}\n⚠️ ${remaining} deneme hakkınız kaldı.`);
          setConfirmPin('');
          // focus back on confirm input if available
          try { confirmInputRef.current?.focus?.(); } catch (e) { /* ignore */ }
          return;
        }

        // Exceeded max attempts -> sign the user out and return to sign-in / main menu
        try {
          const finalMessage = 'Çok fazla hatalı deneme. PIN oluşturma iptal edildi. Ana menüye yönlendiriliyorsunuz.';
          setErrorMessage(finalMessage);
          // Sign out current firebase user to avoid creating PIN while signed in
          try { await signOut(auth); } catch (e) { console.warn('[PINSetupScreen] signOut failed', e); }

          if (Platform.OS === 'web') {
            (globalThis as any).alert(finalMessage);
          } else {
            Alert.alert('PIN Oluşturma İptal edildi', finalMessage);
          }

          // Navigate back to GoogleSignIn (main auth entry)
          navigation.reset({ index: 0, routes: [{ name: 'GoogleSignIn' as never }] });
          return;
        } catch (e) {
          console.error('[PINSetupScreen] Error handling max attempts', e);
          setErrorMessage('Beklenmeyen bir hata oluştu. Lütfen yeniden deneyin.');
          return;
        }
      }

      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }
        
        console.debug('[PINSetupScreen] Setting up PIN for user:', currentUser.email);
        
        // Setup PIN locally and get hash/salt for Firestore
        const { hash, salt } = await setupPIN(pin);
        console.debug('[PINSetupScreen] PIN saved locally');
        
        // Sync to Firestore with timeout (don't block the flow if Firestore is slow/offline)
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          await Promise.race([
            syncPINToFirestore(currentUser.uid, currentUser.email || '', hash, salt),
            timeoutPromise
          ]);
          console.debug('[PINSetupScreen] PIN synced to Firestore');
        } catch (firestoreError: any) {
          console.warn('[PINSetupScreen] Firestore sync failed (timeout or offline, continuing with local PIN):', firestoreError?.message);
          // Don't block user if Firestore sync fails - local PIN is sufficient
        }
        
        // Ensure auth store has current firebase user (may be set elsewhere but ensure consistency)
        try {
          if (currentUser) {
            // @ts-ignore
            useAuthStore.getState().setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            });
            console.debug('[PINSetupScreen] Auth store updated with user:', currentUser.email);
          }
        } catch (e) {
          console.warn('[PINSetupScreen] Could not update auth store:', e);
        }

        setPINVerified(true);
        console.debug('[PINSetupScreen] PIN verified flag set to true');

        // Show success message
        Alert.alert(
          '✅ PIN Oluşturuldu',
          'PIN\'iniz başarıyla oluşturuldu. Artık uygulamaya erişebilirsiniz.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Navigate to parent dashboard
                console.debug('[PINSetupScreen] Navigating to ParentDashboard...');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'ParentDashboard' as never }],
                });
              }
            }
          ]
        );
      } catch (error) {
        console.error('[PINSetupScreen] PIN Setup Error:', error);
        Alert.alert(t('common.error'), t('errors.generic'));
      } finally {
        setLoading(false);
      }
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;
  const canContinue = step === 'enter' ? pin.length === 6 : confirmPin.length === 6;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔐</Text>
        </View>
        
        <Text style={styles.title}>
          {step === 'enter' ? t('auth.pinSetupTitle') : 'PIN kodunuzu onaylayın!'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'enter' ? t('auth.pinSetupSubtitle') : 'PIN kodunuzu onaylamak için lütfen tekrar giriniz.'}
        </Text>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.pinContainer}>
          <TextInput
            ref={step === 'confirm' ? confirmInputRef : undefined}
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
    marginBottom: 48,
  },
  errorContainer: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
