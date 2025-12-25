import React from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const languageNames = {
  en: 'English',
  ta: 'தமிழ்',
  hi: 'हिंदी',
  te: 'తెలుగు',
  ka: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  gu: 'ગુજરાતી',
  bn: 'বাংলা',
  mr: 'मराठी',
  pa: 'ਪੰਜਾਬੀ',
};

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, t } = useLanguage();

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-border hover:bg-spiritual-light gap-2"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">
            {languageNames[currentLanguage]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-card border-border shadow-spiritual z-50"
      >
        {Object.entries(languageNames).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className={`cursor-pointer hover:bg-spiritual-light ${
              currentLanguage === code ? 'bg-spiritual-light text-spiritual-blue font-medium' : ''
            }`}
          >
            <span className="text-base">{name}</span>
            {code !== 'en' && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({t(`language.${code === 'ta' ? 'tamil' : 
                     code === 'hi' ? 'hindi' : 
                     code === 'te' ? 'telugu' : 
                     code === 'ka' ? 'kannada' : 
                     code === 'ml' ? 'malayalam' : 
                     code === 'gu' ? 'gujarati' : 
                     code === 'bn' ? 'bengali' : 
                     code === 'mr' ? 'marathi' : 
                     code === 'pa' ? 'punjabi' : 'english'}`)})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;