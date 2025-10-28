// Skill Presentation Screen - Show skills with timer (placeholder)

import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
} from 'react-native';

const SkillPresentationScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📝</Text>
        <Text style={styles.title}>Skill Presentation</Text>
        <Text style={styles.subtitle}>
          Skill presentation with 30s timer will be implemented here
        </Text>
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
  },
});

export default SkillPresentationScreen;
