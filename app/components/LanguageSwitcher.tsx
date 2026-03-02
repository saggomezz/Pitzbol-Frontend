"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiGlobe } from "react-icons/fi";

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.cookie.includes('NEXT_LOCALE=en') ? 'en' : 'es';
    }
    return 'es';
  });

  const changeLanguage = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    setLocale(newLocale);
    window.location.reload();
  };

  return (
    <div className="relative group">
      <button
        className="p-2 bg-white/40 rounded-full hover:bg-white transition-all shadow-sm flex items-center gap-2"
        title={locale === 'es' ? 'Cambiar idioma' : 'Change language'}
      >
        <FiGlobe size={20} />
        <span className="hidden md:inline-block text-xs font-bold uppercase">
          {locale === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
        </span>
      </button>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        whileHover={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
      >
        <button
          onClick={() => changeLanguage('es')}
          className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-[#F6F0E6] transition-colors ${
            locale === 'es' ? 'bg-[#F6F0E6] font-bold' : ''
          }`}
        >
          <span className="text-lg">🇪🇸</span>
          <span className="text-sm">Español</span>
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-[#F6F0E6] transition-colors ${
            locale === 'en' ? 'bg-[#F6F0E6] font-bold' : ''
          }`}
        >
          <span className="text-lg">🇺🇸</span>
          <span className="text-sm">English</span>
        </button>
      </motion.div>
    </div>
  );
}
