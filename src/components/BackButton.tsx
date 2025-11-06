import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
};

const BackButton: React.FC<Props> = ({ onPress, label, accessibilityLabel = 'go-back' }) => {
  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(100, 126, 234, 0.3)', 'rgba(100, 126, 234, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>←</Text>
          {label ? <Text style={styles.label}>{label}</Text> : null}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradient: {
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  icon: {
    fontSize: 24,
    color: '#FFFFFF',
    marginRight: 6,
    fontWeight: 'bold',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BackButton;
