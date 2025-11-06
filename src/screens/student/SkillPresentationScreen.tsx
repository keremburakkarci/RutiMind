// Skill Presentation Screen - Show skills with 30s response timer

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Vibration,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { SkillPresentationScreenNavigationProp, SkillPresentationScreenRouteProp } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import MainMenuButton from '../../components/MainMenuButton';
import { saveResponse } from '../../services/responseService';
import type { SkillResponse } from '../../services/sessionManager';
import * as Haptics from 'expo-haptics';

const RESPONSE_TIMEOUT_MS = 30000; // 30 seconds

const SkillPresentationScreen: React.FC = () => {
  const navigation = useNavigation<SkillPresentationScreenNavigationProp>();
  const route = useRoute<SkillPresentationScreenRouteProp>();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  
  const { skills, currentIndex, schedule, sessionStartTime } = route.params;
  const currentSkill = skills[currentIndex];
  
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [blackoutRemainingSeconds, setBlackoutRemainingSeconds] = useState<number>(0);
  const [hasResponded, setHasResponded] = useState<boolean>(false);
  
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const blackoutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Vibrate on skill appearance
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 200, 100, 200]); // pattern: delay, vibrate, pause, vibrate
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }

    // Start 30-second response timer
    startResponseTimer();

    return () => {
      clearTimers();
    };
  }, [currentIndex]);

  const startResponseTimer = () => {
    setSecondsRemaining(30);
    setHasResponded(false);

    // Countdown display
    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
    if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto no-response timeout
    timeoutTimerRef.current = setTimeout(() => {
      if (!hasResponded) {
        handleResponse('no-response');
      }
    }, RESPONSE_TIMEOUT_MS);
  };

  const clearTimers = () => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (blackoutIntervalRef.current) {
      clearInterval(blackoutIntervalRef.current);
      blackoutIntervalRef.current = null;
    }
  };

  const handleResponse = async (response: SkillResponse) => {
    if (hasResponded) return; // Prevent duplicate responses
    
    setHasResponded(true);
    clearTimers();

    // Save response to database
    if (user) {
      const now = Date.now();
      const sessionDate = new Date(now).toISOString().split('T')[0]; // YYYY-MM-DD
      
      try {
        await saveResponse({
          userId: user.uid,
          sessionDate,
          skillId: currentSkill.skillId,
          skillName: currentSkill.skillName,
          response,
          timestamp: now,
        });
        console.log('[SkillPresentation] Response saved:', response);
      } catch (error) {
        console.error('[SkillPresentation] Failed to save response:', error);
        // Show alert but continue
        if (Platform.OS !== 'web') {
          Alert.alert('Uyarı', 'Cevap kaydedilemedi, ancak oturum devam ediyor.');
        }
      }
    }

    // Haptic feedback
    if (Platform.OS !== 'web') {
      if (response === 'yes') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else if (response === 'no') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }

    // Enter blackout period and show an inter-skill countdown instead of a
    // plain black screen. The countdown runs for the remaining time until
    // the next skill's scheduled start.
    setIsBlackout(true);

    // Calculate blackout duration
    const nextIndex = currentIndex + 1;
    if (nextIndex >= skills.length) {
      // Last skill finished — immediately end the session and navigate to SessionComplete.
      // Clear any pending timers and navigate without showing an inter-skill timer.
      clearTimers();
      setIsBlackout(false);
      navigation.navigate('SessionComplete');
      return;
    } else {
      // Prefer using the per-skill interval from the schedule (intervalAfterPrevMs)
      // so the blackout equals "how long after this skill the next should start" minus
      // the time already spent during the response window. This avoids relying on
      // sessionStartTime and cumulative scheduled times which can be confusing.
      let blackoutDuration = 0;

      const currentIntervalMs = (schedule && schedule[currentIndex])
        ? schedule[currentIndex].intervalAfterPrevMs
        : ((currentSkill.duration || 0) * 60 * 1000);

      // time already spent since the skill was presented (approx):
      // if the response happened before timeout, then timeIntoResponse = RESPONSE_TIMEOUT_MS - (secondsRemaining*1000)
      // if auto no-response (secondsRemaining === 0) timeIntoResponse ~= RESPONSE_TIMEOUT_MS
      const timeIntoResponse = Math.max(0, RESPONSE_TIMEOUT_MS - (secondsRemaining * 1000));

      blackoutDuration = currentIntervalMs - timeIntoResponse;

      if (blackoutDuration <= 0) {
        console.warn('[SkillPresentation] Computed blackoutDuration <= 0; using minimum blackout of 1s for skill:', currentSkill.skillId || currentSkill.skillName);
        blackoutDuration = 1000;
      }

      const seconds = Math.ceil(blackoutDuration / 1000);
      setBlackoutRemainingSeconds(seconds);

      // Start interval to count down and navigate when done
      blackoutIntervalRef.current = setInterval(() => {
        setBlackoutRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (blackoutIntervalRef.current) {
              clearInterval(blackoutIntervalRef.current);
              blackoutIntervalRef.current = null;
            }
            setIsBlackout(false);
            navigation.replace('SkillPresentation', {
              skills,
              currentIndex: nextIndex,
              schedule,
              sessionStartTime,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  if (isBlackout) {
    // Show a countdown timer during blackout using the same visual style
    // as the initial Wait screen so the UX is consistent.
    const formatSeconds = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#1a1a2e', '#16213e']}
          style={styles.gradientBackground}
        >
          {/* Main menu button (top center) */}
          <MainMenuButton onPress={async () => {
            try {
              console.debug('[SkillPresentation] main menu pressed (blackout)');
              if (Platform.OS === 'web' && typeof (globalThis as any).confirm === 'function') {
                const ok1 = (globalThis as any).confirm('Ana menüye dönmek istediğinize emin misiniz?');
                if (!ok1) return;
                const ok2 = (globalThis as any).confirm('Gerçekten çıkmak istediğinize emin misiniz? Bu işlemi onaylamak için tekrar "Evet"e basın.');
                if (!ok2) return;
                const top = (navigation.getParent() as any) || (navigation as any);
                top.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
                return;
              }
              Alert.alert(
                'Emin misiniz?',
                'Ana menüye dönmek istediğinize emin misiniz?',
                [
                  { text: 'Hayır', style: 'cancel' },
                  { text: 'Evet', onPress: () => {
                    Alert.alert(
                      'Son Onay',
                      'Gerçekten çıkmak istediğinize emin misiniz? Bu işlemi onaylamak için tekrar "Evet"e basın.',
                      [
                        { text: 'Hayır', style: 'cancel' },
                        { text: 'Evet', onPress: () => { const top = (navigation.getParent() as any) || (navigation as any); top.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })); } }
                      ],
                      { cancelable: false }
                    );
                  } }
                ],
                { cancelable: false }
              );
            } catch (e) {
              console.error('[SkillPresentation] main menu handler error', e);
            }
          }} />
          <View style={styles.content}>
            <LinearGradient
              colors={['#F39C12', '#E67E22']}
              style={styles.emojiGradient}
            >
              <Text style={styles.emoji}>⏳</Text>
            </LinearGradient>
            
            <Text style={styles.title}>{`Bekleniyor...`}</Text>
            <Text style={styles.subtitle}>{`${formatSeconds(blackoutRemainingSeconds)} sonra başlayacak`}</Text>

            <View style={styles.timerContainer}>
              <LinearGradient
                colors={['rgba(102, 126, 234, 0.3)', 'rgba(102, 126, 234, 0.15)']}
                style={styles.timerGradient}
              >
                <Text style={styles.largeTimerText}>{formatSeconds(blackoutRemainingSeconds)}</Text>
              </LinearGradient>
            </View>

            <Text style={styles.hint}>{'Bir sonraki beceri başlayana kadar bekleyin.'}</Text>

            {__DEV__ && isBlackout && (
              <TouchableOpacity
                accessibilityLabel={t('student.testingButton')}
                onPress={() => {
                  console.log('[SkillPresentation][DEV] Setting blackout timer to 3s');
                  setBlackoutRemainingSeconds(3);
                }}
                style={styles.devButton}
              >
                <Text style={styles.devButtonText}>{t('student.testingButton')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        {/* Main menu button (top center) */}
        <MainMenuButton onPress={async () => {
          try {
            console.debug('[SkillPresentation] main menu pressed');
            if (Platform.OS === 'web' && typeof (globalThis as any).confirm === 'function') {
              const ok1 = (globalThis as any).confirm('Ana menüye dönmek istediğinize emin misiniz?');
              if (!ok1) return;
              const ok2 = (globalThis as any).confirm('Gerçekten çıkmak istediğinize emin misiniz? Bu işlemi onaylamak için tekrar "Evet"e basın.');
              if (!ok2) return;
              const top = (navigation.getParent() as any) || (navigation as any);
              top.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
              return;
            }
            Alert.alert(
              'Emin misiniz?',
              'Ana menüye dönmek istediğinize emin misiniz?',
              [
                { text: 'Hayır', style: 'cancel' },
                { text: 'Evet', onPress: () => {
                  Alert.alert(
                    'Son Onay',
                    'Gerçekten çıkmak istediğinize emin misiniz? Bu işlemi onaylamak için tekrar "Evet"e basın.',
                    [
                      { text: 'Hayır', style: 'cancel' },
                      { text: 'Evet', onPress: () => { const top = (navigation.getParent() as any) || (navigation as any); top.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })); } }
                    ],
                    { cancelable: false }
                  );
                } }
              ],
              { cancelable: false }
            );
          } catch (e) {
            console.error('[SkillPresentation] main menu handler error', e);
          }
        }} />
        <View style={styles.content}>
          {/* Timer badge */}
          <LinearGradient
            colors={['#DC2626', '#991B1B']}
            style={styles.timerBadge}
          >
            <Text style={styles.timerText}>{secondsRemaining}s</Text>
          </LinearGradient>

          {/* Skill number */}
          <Text style={styles.skillNumber}>
            Beceri {currentIndex + 1} / {skills.length}
          </Text>

          {/* Skill name */}
          <Text style={styles.skillName}>{currentSkill.skillName}</Text>

          {/* Skill image */}
          {currentSkill.imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: currentSkill.imageUri }} style={styles.skillImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={[styles.imageContainer, styles.placeholderImage]}>
              <Text style={styles.placeholderEmoji}>📝</Text>
            </View>
          )}

          {/* Yes / No buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.yesButton]}
              onPress={() => handleResponse('yes')}
              disabled={hasResponded}
              accessibilityLabel="Yes"
            >
              <LinearGradient
                colors={['#2ECC71', '#27AE60']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonIcon}>✅</Text>
                <Text style={styles.buttonText}>Evet</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.noButton]}
              onPress={() => handleResponse('no')}
              disabled={hasResponded}
              accessibilityLabel="No"
            >
              <LinearGradient
                colors={['#E74C3C', '#C0392B']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonIcon}>❌</Text>
                <Text style={styles.buttonText}>Hayır</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {hasResponded && (
            <Text style={styles.respondedHint}>Cevap kaydedildi, sonraki beceriye geçiliyor...</Text>
          )}

          {/* Dev-only test button for response timer (sets remaining to 3s) */}
          {__DEV__ && !isBlackout && (
            <TouchableOpacity
              accessibilityLabel={t('student.testingButton')}
              onPress={() => {
                console.log('[SkillPresentation][DEV] Setting response timer to 3s');
                setSecondsRemaining(3);
              }}
              style={styles.devButton}
            >
              <Text style={styles.devButtonText}>{t('student.testingButton')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  timerBadge: {
    position: 'absolute',
    top: 60,
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skillNumber: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    fontWeight: '600',
  },
  skillName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 32,
  },
  imageContainer: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
    backgroundColor: 'rgba(13, 27, 42, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  skillImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 400,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  yesButton: {},
  noButton: {},
  buttonIcon: {
    fontSize: 32,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  respondedHint: {
    marginTop: 24,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  /* Blackout/waiting screen styles */
  emojiGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#F39C12',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  emoji: {
    fontSize: 70,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  timerContainer: {
    marginBottom: 24,
  },
  timerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 50,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  largeTimerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  devButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.4)',
  },
  devButtonText: {
    color: '#FFA500',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default SkillPresentationScreen;
