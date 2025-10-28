// Theme configuration using @shopify/restyle

import { createTheme } from '@shopify/restyle';
import { Platform } from 'react-native';

// Color palette
const palette = {
  // Primary colors
  primary: '#4285F4',
  primaryDark: '#1565C0',
  primaryLight: '#64B5F6',
  
  // Category colors
  categoryRed: '#E74C3C',
  categoryBlue: '#3498DB',
  categoryOrange: '#F39C12',
  categoryPurple: '#9B59B6',
  categoryGreen: '#27AE60',
  
  // Semantic colors
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  
  // Neutral colors - Light theme
  lightBackground: '#FFFFFF',
  lightSurface: '#F5F6FA',
  lightCard: '#FFFFFF',
  lightBorder: '#E1E8ED',
  lightText: '#2C3E50',
  lightTextSecondary: '#7F8C8D',
  lightTextTertiary: '#95A5A6',
  
  // Neutral colors - Dark theme
  darkBackground: '#1A1A1A',
  darkBackgroundSecondary: '#1E1E1E',
  darkSurface: '#2D2D2D',
  darkCard: '#2C3E50',
  darkBorder: '#34495E',
  darkText: '#FFFFFF',
  darkTextSecondary: '#BDC3C7',
  darkTextTertiary: '#95A5A6',
};

// Light theme
export const lightTheme = createTheme({
  colors: {
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    primaryLight: palette.primaryLight,
    
    // Category colors
    categoryRed: palette.categoryRed,
    categoryBlue: palette.categoryBlue,
    categoryOrange: palette.categoryOrange,
    categoryPurple: palette.categoryPurple,
    categoryGreen: palette.categoryGreen,
    
    // Semantic
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,
    
    // Base colors
    background: palette.lightBackground,
    backgroundSecondary: palette.lightSurface,
    surface: palette.lightCard,
    border: palette.lightBorder,
    text: palette.lightText,
    textSecondary: palette.lightTextSecondary,
    textTertiary: palette.lightTextTertiary,
    
    // Interactive states
    cardBackground: palette.lightCard,
    cardBorder: palette.lightBorder,
    buttonPrimary: palette.primary,
    buttonSecondary: palette.lightSurface,
    buttonText: '#FFFFFF',
    inputBackground: palette.lightCard,
    inputBorder: palette.lightBorder,
    inputText: palette.lightText,
    placeholderText: palette.lightTextTertiary,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadii: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
    xxl: 24,
    round: 999,
  },
  textVariants: {
    // Headers
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
      color: 'text',
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36,
      color: 'text',
    },
    h3: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
      color: 'text',
    },
    h4: {
      fontSize: 20,
      fontWeight: 'bold',
      lineHeight: 28,
      color: 'text',
    },
    
    // Body text
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: 'text',
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: 'bold',
      lineHeight: 24,
      color: 'text',
    },
    bodySecondary: {
      fontSize: 16,
      lineHeight: 24,
      color: 'textSecondary',
    },
    
    // Small text
    caption: {
      fontSize: 14,
      lineHeight: 20,
      color: 'textSecondary',
    },
    captionBold: {
      fontSize: 14,
      fontWeight: 'bold',
      lineHeight: 20,
      color: 'text',
    },
    
    // Tiny text
    tiny: {
      fontSize: 12,
      lineHeight: 16,
      color: 'textTertiary',
    },
    
    // Button text
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      color: 'buttonText',
    },
  },
  cardVariants: {
    defaults: {
      backgroundColor: 'cardBackground',
      borderRadius: 'l',
      padding: 'm',
      borderWidth: 1,
      borderColor: 'cardBorder',
    },
    elevated: {
      backgroundColor: 'cardBackground',
      borderRadius: 'l',
      padding: 'm',
      // Prefer boxShadow on web and platform shadow props on native
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      ...(Platform.OS !== 'web'
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }
        : {}),
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  colors: {
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    primaryLight: palette.primaryLight,
    
    // Category colors
    categoryRed: palette.categoryRed,
    categoryBlue: palette.categoryBlue,
    categoryOrange: palette.categoryOrange,
    categoryPurple: palette.categoryPurple,
    categoryGreen: palette.categoryGreen,
    
    // Semantic
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,
    
    // Base colors
    background: palette.darkBackground,
    backgroundSecondary: palette.darkBackgroundSecondary,
    surface: palette.darkSurface,
    border: palette.darkBorder,
    text: palette.darkText,
    textSecondary: palette.darkTextSecondary,
    textTertiary: palette.darkTextTertiary,
    
    // Interactive states
    cardBackground: palette.darkCard,
    cardBorder: palette.darkBorder,
    buttonPrimary: palette.primary,
    buttonSecondary: palette.darkSurface,
    buttonText: '#FFFFFF',
    inputBackground: palette.darkSurface,
    inputBorder: palette.darkBorder,
    inputText: palette.darkText,
    placeholderText: palette.darkTextTertiary,
  },
  spacing: lightTheme.spacing,
  borderRadii: lightTheme.borderRadii,
  textVariants: lightTheme.textVariants,
  cardVariants: lightTheme.cardVariants,
});

export type Theme = typeof lightTheme;

export default lightTheme;
