"use client";
import { useState, useRef, useEffect } from "react";
import { FiGlobe } from "react-icons/fi";

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.cookie.includes('NEXT_LOCALE=en') ? 'en' : 'es';
    }
    return 'es';
  });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const changeLanguage = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    setLocale(newLocale);
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 flex items-center gap-2 hover:text-[#F00808] transition-colors"
        title={locale === 'es' ? 'Cambiar idioma' : 'Change language'}
      >
        <FiGlobe size={20} />
        <span className="hidden md:inline-block text-xs font-bold uppercase">
          {locale === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
        </span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-[200]">
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
        </div>
      )}
    </div>
  );
}
