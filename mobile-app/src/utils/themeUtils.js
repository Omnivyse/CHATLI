// Theme utilities for mobile app
import { Appearance } from 'react-native';

// Color schemes for light and dark modes
export const lightColors = {
  // Background colors
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceVariant: '#f1f5f9',
  surfaceElevated: '#ffffff',
  
  // Text colors
  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
  
  // Border colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  
  // Interactive colors
  primary: '#000000',
  primaryLight: '#374151',
  secondary: '#64748b',
  accent: '#3b82f6',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  
  // Shadow colors
  shadow: '#000000',
  
  // Special colors
  link: '#3b82f6',
  placeholder: '#9ca3af',
  disabled: '#d1d5db',
  disabledText: '#9ca3af',
};

export const darkColors = {
  // Background colors
  background: '#000000',
  surface: '#1a1a1a',
  surfaceVariant: '#2a2a2a',
  surfaceElevated: '#1a1a1a',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  textInverse: '#000000',
  
  // Border colors
  border: '#333333',
  borderLight: '#404040',
  borderDark: '#1a1a1a',
  
  // Interactive colors
  primary: '#ffffff',
  primaryLight: '#e6e6e6',
  secondary: '#999999',
  accent: '#60a5fa',
  
  // Status colors
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  
  // Shadow colors
  shadow: '#000000',
  
  // Special colors
  link: '#60a5fa',
  placeholder: '#666666',
  disabled: '#404040',
  disabledText: '#666666',
};

// Get system theme preference
export const getSystemTheme = () => {
  return Appearance.getColorScheme() || 'light';
};

// Theme object with colors
export const getThemeColors = (theme) => {
  if (!theme || typeof theme !== 'string') {
    console.warn('getThemeColors: Invalid theme parameter:', theme);
    return lightColors; // Fallback to light colors
  }
  
  return theme === 'dark' ? darkColors : lightColors;
};

// Common styles that can be reused
export const getCommonStyles = (theme) => {
  const colors = getThemeColors(theme);
  
  return {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    surface: {
      backgroundColor: colors.surface,
    },
    surfaceVariant: {
      backgroundColor: colors.surfaceVariant,
    },
    text: {
      color: colors.text,
    },
    textSecondary: {
      color: colors.textSecondary,
    },
    textTertiary: {
      color: colors.textTertiary,
    },
    border: {
      borderColor: colors.border,
    },
    borderLight: {
      borderColor: colors.borderLight,
    },
    shadow: {
      shadowColor: colors.shadow,
    },
  };
};

// Status bar style based on theme (Expo version)
// Use 'light' for dark backgrounds, 'dark' for light backgrounds
export const getStatusBarStyle = (theme) => {
  return theme === 'dark' ? 'light' : 'dark';
};

// Status bar background color based on theme
export const getStatusBarBackgroundColor = (theme) => {
  const colors = getThemeColors(theme);
  return colors.background;
};

// Tab bar colors based on theme
export const getTabBarColors = (theme) => {
  const colors = getThemeColors(theme);
  
  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    activeTintColor: colors.primary,
    inactiveTintColor: colors.textSecondary,
  };
};

// Navigation header colors based on theme
export const getNavigationColors = (theme) => {
  const colors = getThemeColors(theme);
  
  return {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    titleColor: colors.text,
    tintColor: colors.primary,
  };
};

// Input field styles based on theme
export const getInputStyles = (theme) => {
  const colors = getThemeColors(theme);
  
  return {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    color: colors.text,
    placeholderTextColor: colors.placeholder,
  };
};

// Button styles based on theme
export const getButtonStyles = (theme, variant = 'primary') => {
  const colors = getThemeColors(theme);
  
  const variants = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.textInverse,
    },
    secondary: {
      backgroundColor: colors.surfaceVariant,
      color: colors.text,
      borderColor: colors.border,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text,
    },
  };
  
  return variants[variant] || variants.primary;
};

// Card styles based on theme
export const getCardStyles = (theme) => {
  const colors = getThemeColors(theme);
  
  return {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    shadowColor: colors.shadow,
  };
};

// Modal styles based on theme
export const getModalStyles = (theme) => {
  const colors = getThemeColors(theme);
  
  return {
    backgroundColor: colors.surface,
    overlayColor: colors.overlay,
  };
}; 