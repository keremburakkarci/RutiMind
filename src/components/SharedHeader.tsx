import React from 'react';
import { Text, StyleSheet, TextProps, Platform } from 'react-native';

type Props = TextProps & {
  children: React.ReactNode;
};

export const HeaderTitle: React.FC<Props> = ({ children, style, ...props }) => {
  return (
    <Text {...props} style={[styles.title, style]} numberOfLines={1} ellipsizeMode="tail">
      {children}
    </Text>
  );
};

export const MainMenuStyles = StyleSheet.create({
  // same baseline as GlobalTopActions mainMenuButton/mainMenuText but exposed for reuse
  mainMenuButton: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -60 }],
    top: Platform.OS === 'web' ? 36 : 28,
    backgroundColor: 'rgba(66, 133, 244, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainMenuText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
});

export default HeaderTitle;
