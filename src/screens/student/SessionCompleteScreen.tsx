// Session Complete Screen - Congratulations screen

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CommonActions } from '@react-navigation/native';
import MainMenuButton from '../../components/MainMenuButton';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

const SessionCompleteScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleBackToMenu = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        <MainMenuButton onPress={() => {
          try {
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
                { text: 'Evet', onPress: () => { const top = (navigation.getParent() as any) || (navigation as any); top.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })); } }
              ],
              { cancelable: false }
            );
          } catch (e) {
            console.error('[SessionComplete] main menu handler error', e);
          }
        }} />
        <View style={styles.content}>
          <LinearGradient
            colors={['#F39C12', '#E67E22']}
            style={styles.emojiGradient}
          >
            <Text style={styles.emoji}>🎉</Text>
          </LinearGradient>
          
          <Text style={styles.title}>{t('student.sessionComplete')}</Text>
          <Text style={styles.subtitle}>{t('student.sessionCompleteMessage')}</Text>
          
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleBackToMenu}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{t('student.backToMenu')}</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#F39C12',
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
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
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
  button: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default SessionCompleteScreen;
