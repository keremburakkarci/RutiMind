// Ready Screen - Student readiness check

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { ReadyScreenNavigationProp } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import { useSkillsStore } from '../../store/skillsStore';
import MainMenuButton from '../../components/MainMenuButton';
import { Alert } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';

const ReadyScreen: React.FC = () => {
  const navigation = useNavigation<ReadyScreenNavigationProp>();
  const { t } = useTranslation();
  const { waitDuration } = useSkillsStore();

  const handleYes = () => {
    navigation.navigate('Wait', { waitDuration });
  };

  const handleNo = () => {
    navigation.goBack();
  };

  const { logout } = useAuth();

  const handleMainMenuPress = async () => {
    try {
      console.debug('[ReadyScreen] main menu pressed');
      // Web: use native confirm for a more reliable UX in browsers
      if (Platform.OS === 'web' && typeof (globalThis as any).confirm === 'function') {
        const ok1 = (globalThis as any).confirm('Ana menüye dönmek istediğinize emin misiniz?');
        console.debug('[ReadyScreen] web confirm1 result:', ok1);
        if (!ok1) return;
        const ok2 = (globalThis as any).confirm('Gerçekten çıkmak istediğinize emin misiniz? Bu işlemi onaylamak için tekrar "Evet"e basın.');
        console.debug('[ReadyScreen] web confirm2 result:', ok2);
        if (!ok2) return;
        await logout();
        (navigation.getParent() as any)?.navigate('Main');
        return;
      }

      // Native flow using Alert
      Alert.alert(
        'Emin misiniz?',
        'Ana menüye dönmek istediğinize emin misiniz?',
        [
          { text: 'Hayır', style: 'cancel', onPress: () => console.debug('[ReadyScreen] alert cancelled (no)') },
          { text: 'Evet', onPress: () => {
            console.debug('[ReadyScreen] alert first confirmed');
            Alert.alert(
              'Son Onay',
              'Gerçekten çıkmak istediğinize emin misiniz? Bu işlemi onaylamak için tekrar "Evet"e basın.',
              [
                { text: 'Hayır', style: 'cancel', onPress: () => console.debug('[ReadyScreen] second alert cancelled (no)') },
                { text: 'Evet', onPress: async () => { console.debug('[ReadyScreen] second alert confirmed - logging out'); await logout(); (navigation.getParent() as any)?.navigate('Main'); } }
              ],
              { cancelable: false }
            );
          } }
        ],
        { cancelable: false }
      );
    } catch (e) {
      console.error('[ReadyScreen] handleMainMenuPress error', e);
      try { Alert.alert('Hata', 'Ana menüye dönme sırasında bir hata oluştu.'); } catch (_) {}
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        {/* Main menu button (top center) */}
        <MainMenuButton onPress={handleMainMenuPress} />
        <View style={styles.content}>
          <LinearGradient
            colors={['#2ECC71', '#27AE60']}
            style={styles.emojiGradient}
          >
            <Text style={styles.emoji}>🎯</Text>
          </LinearGradient>
          
          <Text style={styles.title}>{t('student.readyTitle')}</Text>
          <Text style={styles.subtitle}>{t('student.readySubtitle')}</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleYes}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#2ECC71', '#27AE60']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{t('student.readyYes')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleNo}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#E74C3C', '#C0392B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{t('student.readyNo')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emojiGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#2ECC71',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  emoji: {
    fontSize: 64,
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
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
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
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default ReadyScreen;
