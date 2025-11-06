// Wait Screen - Countdown before skills start

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { WaitScreenNavigationProp, WaitScreenRouteProp } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import { useSkillsStore } from '../../store/skillsStore';
import { SessionManager } from '../../services/sessionManager';
import { initResponsesDB } from '../../services/responseService';
import * as Haptics from 'expo-haptics';
import MainMenuButton from '../../components/MainMenuButton';
import { Alert } from 'react-native';

const WaitScreen: React.FC = () => {
  const navigation = useNavigation<WaitScreenNavigationProp>();
  const route = useRoute<WaitScreenRouteProp>();
  const { t } = useTranslation();
  const { selectedSkills } = useSkillsStore();
  
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1);
  
  const sessionManagerRef = useRef<SessionManager | null>(null);

  useEffect(() => {
    // Initialize response DB on mount
    initResponsesDB().catch((err) => {
      console.error('[WaitScreen] Failed to init responses DB:', err);
    });

    // Create session manager and start session
    if (!sessionManagerRef.current && selectedSkills.length > 0) {
      // note: SessionManager now expects per-skill durations representing the wait BEFORE each skill,
      // so we pass the selected skills as-is. The top-level waitDuration param is no longer used as the
      // primary driver of the initial wait; initial wait will come from the first skill's duration.
      sessionManagerRef.current = new SessionManager({
        waitDuration: route.params?.waitDuration || 0,
        skills: selectedSkills,
      });
      sessionManagerRef.current.startSession();
      console.log('[WaitScreen] Session manager created and started.');

      // Initialize countdown from the SessionManager's next scheduled skill
      const timeUntilMs = sessionManagerRef.current.getTimeUntilNextSkill();
      if (typeof timeUntilMs === 'number') {
        const secs = Math.max(0, Math.ceil(timeUntilMs / 1000));
        setSecondsRemaining(secs);
      } else {
        // Fallback to route param or default 5 minutes
        setSecondsRemaining((route.params?.waitDuration || 5) * 60);
      }
    }
  }, []);

  useEffect(() => {
    // Countdown timer
    if (secondsRemaining <= 0) {
      // Wait is over, navigate to skill presentation
      handleWaitComplete();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const handleWaitComplete = () => {
    console.log('[WaitScreen] Wait complete, navigating to SkillPresentation.');
    
    // Vibrate to signal start
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    if (!sessionManagerRef.current || selectedSkills.length === 0) {
      console.warn('[WaitScreen] No session manager or no skills, navigating to SessionComplete.');
      navigation.navigate('SessionComplete');
      return;
    }

    // Navigate to SkillPresentation with session manager context
    const schedule = sessionManagerRef.current.getSchedule();
    const sessionStart = sessionManagerRef.current.getSessionStartTime();
    // Log human-friendly schedule for debugging: show per-skill scheduled minute and interval since previous
    try {
      const readable = schedule.map((ev, idx) => {
        const mins = Math.round(ev.scheduledTime / 60000);
        const interval = idx === 0
          ? mins - (route.params?.waitDuration || 5)
          : mins - Math.round(schedule[idx - 1].scheduledTime / 60000);
        return { skillId: ev.skillId, skillName: ev.skillName, scheduledAtMins: mins, intervalSincePrevMins: interval };
      });
      console.log('[WaitScreen] Human-friendly schedule:', readable);
    } catch (e) {
      console.warn('[WaitScreen] Failed to build human-friendly schedule log', e);
    }
    navigation.navigate('SkillPresentation', {
      skills: selectedSkills,
      currentIndex: 0,
      schedule,
      sessionStartTime: sessionStart || Date.now(),
    });
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            console.debug('[WaitScreen] main menu pressed');
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
            console.error('[WaitScreen] main menu handler error', e);
          }
        }} />
        <View style={styles.content}>
          <LinearGradient
            colors={['#F39C12', '#E67E22']}
            style={styles.emojiGradient}
          >
            <Text style={styles.emoji}>⏳</Text>
          </LinearGradient>
          
          <Text style={styles.title}>{t('student.waitingTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('student.waitingSubtitle', { time: formatTime(secondsRemaining) }) || 'Please wait while we prepare your session...'}
          </Text>
          
          <View style={styles.timerContainer}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.3)', 'rgba(102, 126, 234, 0.15)']}
              style={styles.timerGradient}
            >
              <Text style={styles.timerText}>{formatTime(secondsRemaining)}</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.hint}>
            {t('student.waitingHint') || 'Stay ready! Skills will start soon.'}
          </Text>
          {/* Dev-only test button: tap => set to 3s, long-press => set to 0s (start immediately) */}
          {__DEV__ && (
            <TouchableOpacity
              accessibilityLabel={t('student.testingButton')}
              onPress={() => {
                console.log('[WaitScreen][DEV] Setting timer to 3 seconds for testing');
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
    padding: 32,
  },
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
  timerText: {
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

export default WaitScreen;
