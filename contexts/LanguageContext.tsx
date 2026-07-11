'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { en } from '@/dictionaries/en';
import { vi } from '@/dictionaries/vi';

export type Locale = 'en' | 'vi';
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, vi };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'chess-locale';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'vi') {
        setLocaleState(saved);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // localStorage not available
    }
  }, []);

  // Avoid hydration mismatch: render children only after mount
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ locale: 'en', setLocale, t: dictionaries.en }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
