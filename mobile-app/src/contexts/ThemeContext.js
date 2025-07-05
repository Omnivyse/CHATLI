import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSystemTheme } from '../utils/themeUtils';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@chatli_theme';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default to light
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from storage on app start
  useEffect(() => {
    loadThemeFromStorage();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      // Only auto-update if user hasn't manually set a theme
      loadThemeFromStorage().then(() => {
        // If no stored theme, follow system preference
        if (!AsyncStorage.getItem(THEME_STORAGE_KEY)) {
          setTheme(colorScheme || 'light');
        }
      });
    });
    
    return () => {
      if (listener?.remove) {
        listener.remove();
      }
    };
  }, []);

  const loadThemeFromStorage = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        // If no stored theme, use system preference
        const systemTheme = getSystemTheme();
        setTheme(systemTheme);
      }
    } catch (error) {
      console.error('Error loading theme from storage:', error);
      // Fallback to system theme
      const systemTheme = getSystemTheme();
      setTheme(systemTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setThemeAsync(newTheme);
  };

  const setThemeAsync = async (newTheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme to storage:', error);
      // Still update the state even if storage fails
      setTheme(newTheme);
    }
  };

  const resetToSystemTheme = async () => {
    const systemTheme = getSystemTheme();
    await setThemeAsync(systemTheme);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeAsync,
    resetToSystemTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 