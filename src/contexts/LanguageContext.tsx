import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ta' | 'hi' | 'te' | 'kn' | 'ml' | 'gu' | 'bn' | 'mr' | 'pa';

export interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Import all translation files
import { translations as enTranslations } from '@/translations/en';
import { translations as taTranslations } from '@/translations/ta';
import { translations as hiTranslations } from '@/translations/hi';
import { translations as teTranslations } from '@/translations/te';
import { translations as knTranslations } from '@/translations/kn';
import { translations as mlTranslations } from '@/translations/ml';
import { translations as guTranslations } from '@/translations/gu';
import { translations as bnTranslations } from '@/translations/bn';
import { translations as mrTranslations } from '@/translations/mr';
import { translations as paTranslations } from '@/translations/pa';

const allTranslations = {
  en: enTranslations,
  ta: taTranslations,
  hi: hiTranslations,
  te: teTranslations,
  kn: knTranslations,
  ml: mlTranslations,
  gu: guTranslations,
  bn: bnTranslations,
  mr: mrTranslations,
  pa: paTranslations,
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') as Language;
    if (savedLanguage && Object.keys(allTranslations).includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('selectedLanguage', currentLanguage);
    
    // Update document language and direction
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = allTranslations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Fallback to English if translation not found
    if (value === undefined) {
      value = allTranslations.en;
      for (const k of keys) {
        value = value?.[k];
      }
    }
    
    return value || key;
  };

  // Check if current language is RTL (none of our supported languages are RTL)
  const isRTL = false;

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      t,
      isRTL
    }}>
      {children}
    </LanguageContext.Provider>
  );
};