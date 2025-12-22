// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { en_translations, ta_translations } from '@/lib/translations';

// Supported languages
type Language = 'en' | 'ta';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;  // ← This is the function name in context
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const allTranslations = {
  en: en_translations,
  ta: ta_translations,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ta');

  // Create a stable setLanguage function that matches the interface
  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  const t = (key: string): string => {
    const dict = allTranslations[currentLanguage] || allTranslations.en;
    const keys = key.split('.');
    let value: any = dict;

    for (const k of keys) {
      value = value?.[k];
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};