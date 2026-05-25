import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthProvider';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

const LanguageContext = createContext();

const translations = { en, ru };

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth();
  const [locale, setLocale] = useState('en');

  // Sync locale with user.language when user object is loaded/updated
  useEffect(() => {
    if (user?.language) {
      setLocale(user.language);
      AsyncStorage.setItem('language', user.language).catch(err => console.error(err));
    }
  }, [user?.language]);

  // Load language from AsyncStorage on mount (for anonymous/logged out views)
  useEffect(() => {
    const loadStoredLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('language');
        if (storedLang && (storedLang === 'en' || storedLang === 'ru')) {
          setLocale(storedLang);
        }
      } catch (err) {
        console.error('Failed to load stored language', err);
      }
    };
    loadStoredLanguage();
  }, []);

  const changeLanguage = async (newLang) => {
    if (newLang !== 'en' && newLang !== 'ru') return;
    setLocale(newLang);
    try {
      await AsyncStorage.setItem('language', newLang);
    } catch (err) {
      console.error('Failed to save language to AsyncStorage', err);
    }
  };

  const t = (key, variables = {}) => {
    const keys = key.split('.');
    let result = translations[locale] || translations['en'];
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        // Fallback to English
        let fallback = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return replaceVariables(key, variables);
          }
        }
        return replaceVariables(fallback, variables);
      }
    }
    return replaceVariables(result, variables);
  };

  const replaceVariables = (str, variables) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, g) => variables[g] !== undefined ? variables[g] : `{{${g}}}`);
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
