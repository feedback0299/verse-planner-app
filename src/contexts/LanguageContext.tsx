// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { en_translations, ta_translations, ka_translations, hi_translations, te_translations, ml_translations, pu_translations } from '@/lib/translations';

// Supported languages
export type Language = 'en' | 'ta' | 'ka' | 'hi' | 'te' | 'ml' | 'pu';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;  // ← This is the function name in context
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const allTranslations = {
  en: en_translations,
  ta: ta_translations,
  ka: ka_translations,
  hi: hi_translations,
  te: te_translations,
  ml: ml_translations,
  pu: pu_translations,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ta');
  // const [currentLanguage, setCurrentLanguage] = useState<Language>('en'); // Default to English initially

  // React.useEffect(() => {
  //   const detectLocation = async () => {
  //     try {
  //       const response = await fetch('https://ipapi.co/json/');
  //       if (!response.ok) throw new Error('Failed to fetch IP location');
  //       const data = await response.json();
        
  //       // Region detection for India
  //       if (data.country_code === 'IN') {
  //         const region = data.region_code;
  //         if (region === 'TN') {
  //           setCurrentLanguage('ta'); // Tamil
  //         } else if (region === 'KL') {
  //           setCurrentLanguage('ml'); // Malayalam
  //         } else if (region === 'KA') {
  //           setCurrentLanguage('ka'); // Kannada
  //         } else if (region === 'PB') {
  //           setCurrentLanguage('pu'); // Punjabi
  //         } else if (region === 'AP' || region === 'TG') {
  //           setCurrentLanguage('te'); // Telugu
  //         } else {
  //           // Default to Hindi for other Indian states if they are majority Hindi speakers
  //           // or fallback to English if preferred.
  //           setCurrentLanguage('hi'); 
  //         }
  //       } else {
  //         setCurrentLanguage('en'); // Default for other countries
  //       }
  //     } catch (error) {
  //       console.error('Error detecting location:', error);
  //       setCurrentLanguage('en'); // Fallback to English
  //     }
  //   };

  //   detectLocation();
  // }, []);

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