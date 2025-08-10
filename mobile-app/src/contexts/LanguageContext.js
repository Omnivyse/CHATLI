import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = '@chatli_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default to English
  const [isLoading, setIsLoading] = useState(true);

  // Load language from storage on app start
  useEffect(() => {
    loadLanguageFromStorage();
  }, []);

  const loadLanguageFromStorage = async () => {
    try {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage) {
        setLanguage(storedLanguage);
      } else {
        // Default to English if no stored language
        setLanguage('en');
      }
    } catch (error) {
      console.error('Error loading language from storage:', error);
      // Fallback to English
      setLanguage('en');
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguageAsync = async (newLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language to storage:', error);
      // Still update the state even if storage fails
      setLanguage(newLanguage);
    }
  };

  const value = {
    language,
    setLanguage: setLanguageAsync,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 