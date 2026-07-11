'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-[#070f15] border border-[#414942] rounded-lg p-0.5">
      <button
        onClick={() => setLocale('en')}
        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
          locale === 'en'
            ? 'bg-[#a8d638] text-[#263500] shadow-sm'
            : 'text-[#8e9a92] hover:text-[#dbe3ec]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('vi')}
        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
          locale === 'vi'
            ? 'bg-[#a8d638] text-[#263500] shadow-sm'
            : 'text-[#8e9a92] hover:text-[#dbe3ec]'
        }`}
      >
        VI
      </button>
    </div>
  );
}
