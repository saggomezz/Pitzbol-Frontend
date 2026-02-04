// Utility functions for i18n

/**
 * Get current locale from cookies
 */
export function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'es';
  
  const cookies = document.cookie.split('; ');
  const localeCookie = cookies.find(cookie => cookie.startsWith('NEXT_LOCALE='));
  return localeCookie ? localeCookie.split('=')[1] : 'es';
}

/**
 * Set locale and reload page
 */
export function setLocale(locale: 'es' | 'en'): void {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
  window.location.reload();
}

/**
 * Toggle between es and en
 */
export function toggleLocale(): void {
  const current = getCurrentLocale();
  const newLocale = current === 'es' ? 'en' : 'es';
  setLocale(newLocale);
}

/**
 * Check if current locale is English
 */
export function isEnglish(): boolean {
  return getCurrentLocale() === 'en';
}

/**
 * Check if current locale is Spanish
 */
export function isSpanish(): boolean {
  return getCurrentLocale() === 'es';
}
