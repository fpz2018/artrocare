import React, { createContext, useContext, useState, useCallback } from 'react';
import nl from './nl';
import en from './en';

const translations = { nl, en };

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('artrose_lang') || 'nl';
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem('artrose_lang', lang);
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.nl[key] || key;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
