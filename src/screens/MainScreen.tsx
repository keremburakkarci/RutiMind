// Main Screen - Entry point with Parent/Student/Education options

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { useSkillsStore } from '../store/skillsStore';
import { useAuthStore } from '../store/authStore';

const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { t } = useTranslation();
  const { selectedSkills } = useSkillsStore();
  const { setPINVerified } = useAuthStore();

  const handleParentPress = () => {
    // Reset PIN verification flag when navigating to Auth from Main
    // This ensures user must enter PIN every time they access Parent Panel
    console.debug('[MainScreen] Resetting PIN verification flag, navigating to Auth');
    setPINVerified(false);
    navigation.navigate('Auth');
  };

  const handleStudentPress = () => {
    if (selectedSkills.length === 0) {
      // TODO: Show alert
      return;
    }
    navigation.navigate('StudentFlow');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>🧠</Text>
        <Text style={styles.title}>{t('mainMenu.title')}</Text>
        <Text style={styles.subtitle}>{t('mainMenu.subtitle')}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={[styles.card, styles.parentCard]}
          onPress={handleParentPress}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.cardIcon}>👨‍👩‍👧‍👦</Text>
          </View>
          <Text style={styles.cardTitle}>{t('mainMenu.parentPanel')}</Text>
          <Text style={styles.cardDescription}>{t('mainMenu.parentPanelDesc')}</Text>
        </TouchableOpacity>

        <View style={styles.smallCardsContainer}>
          <TouchableOpacity 
            style={[styles.card, styles.smallCard]}
            onPress={handleStudentPress}
          >
            <View style={styles.smallIconContainer}>
              <Text style={styles.cardIcon}>👨‍🎓</Text>
            </View>
            <Text style={styles.smallCardTitle}>{t('mainMenu.studentMode')}</Text>
            <Text style={styles.smallCardDescription}>{t('mainMenu.studentModeDesc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.smallCard]}
            onPress={() => navigation.navigate('Education')}
          >
            <View style={styles.smallIconContainer}>
              <Text style={styles.cardIcon}>📚</Text>
            </View>
            <Text style={styles.smallCardTitle}>{t('mainMenu.education')}</Text>
            <Text style={styles.smallCardDescription}>{t('mainMenu.educationDesc')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('mainMenu.version')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64b5f6',
    opacity: 0.9,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    borderRadius: 24,
    marginBottom: 20,
    padding: 24,
    backgroundColor: '#2c3e50',
    borderWidth: 1,
    borderColor: '#34495e',
  },
  parentCard: {
    minHeight: 180,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIcon: {
    fontSize: 30,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#bdc3c7',
  },
  smallCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  smallCard: {
    flex: 1,
    padding: 20,
    minHeight: 160,
  },
  smallIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  smallCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  smallCardDescription: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64b5f6',
    opacity: 0.7,
  },
});

export default MainScreen;
