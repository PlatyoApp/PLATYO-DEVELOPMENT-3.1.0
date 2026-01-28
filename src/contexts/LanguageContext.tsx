import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, useTranslation } from '../utils/translations';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { restaurant, refreshRestaurantData } = useAuth();
  const [language, setLanguageState] = useState<Language>('es');

  const { t } = useTranslation(language);

  useEffect(() => {
    if (restaurant?.settings?.language) {
      setLanguageState(restaurant.settings.language as Language);
    }
  }, [restaurant]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);

    if (restaurant) {
      try {
        const updatedSettings = {
          ...restaurant.settings,
          language: lang
        };

        const { error } = await supabase
          .from('restaurants')
          .update({
            settings: updatedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', restaurant.id);

        if (error) {
          console.error('Error updating language in database:', error);
          return;
        }

        await refreshRestaurantData();
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: t as (key: string) => string,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};