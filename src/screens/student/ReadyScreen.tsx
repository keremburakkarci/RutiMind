// Ready Screen - Student readiness check

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { ReadyScreenNavigationProp } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import { useSkillsStore } from '../../store/skillsStore';

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎯</Text>
        <Text style={styles.title}>{t('student.readyTitle')}</Text>
        <Text style={styles.subtitle}>{t('student.readySubtitle')}</Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.yesButton]}
            onPress={handleYes}
          >
            <Text style={styles.buttonText}>{t('student.readyYes')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.noButton]}
            onPress={handleNo}
          >
            <Text style={styles.buttonText}>{t('student.readyNo')}</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
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
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#2ECC71',
  },
  noButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ReadyScreen;
