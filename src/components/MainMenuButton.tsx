import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  onPress?: () => void;
  // small override if a particular screen wants a slightly different top offset
  topOffset?: number;
  accessibilityLabel?: string;
  style?: ViewStyle | any;
  // if inline is true the button will render without absolute positioning so
  // it can be used inside headers or other inline layouts
  inline?: boolean;
};

const MainMenuButton: React.FC<Props> = ({ onPress, topOffset, accessibilityLabel, style, inline }) => {
  const defaultTop = topOffset ?? (Platform.OS === 'web' ? 20 : 12); // slightly higher than before (adjusted globally)

  if (inline) {
    return (
      <TouchableOpacity
        accessibilityLabel={accessibilityLabel || 'go-to-main'}
        onPress={onPress}
        style={[styles.inlineContainer, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inline}
        >
          <Text style={styles.text}>Ana Menü</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel || 'go-to-main'}
      onPress={onPress}
      style={[styles.wrapper, { top: defaultTop }, style]}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientButton}
      >
        <Text style={styles.text}>Ana Menü</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -72 }],
    zIndex: 10000,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  inline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default MainMenuButton;
