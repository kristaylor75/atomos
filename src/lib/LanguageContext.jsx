import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations } from '@/lib/i18n';
import { mapTranslations } from '@/lib/i18nMap';
import { extraTranslations } from '@/lib/i18nExtra';
import { moreTranslations } from '@/lib/i18nMore';
import { gameTranslations } from '@/lib/i18nGames';
import { searchTranslations } from '@/lib/i18nSearch';
import { notificationTranslations } from '@/lib/i18nNotifications';
import { skinTranslations } from '@/lib/i18nSkins';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'calcsuite_language';
const SUPPORTED_CODES = Object.keys({ ...translations, ...mapTranslations, ...extraTranslations, ...moreTranslations, ...gameTranslations, ...searchTranslations, ...notificationTranslations, ...skinTranslations });

function readStoredLang() {
  let code = null;
  try { code = localStorage.getItem(STORAGE_KEY); } catch { code = null; }
  // Fallback to English if the stored value isn't a known language code.
  if (!code || !SUPPORTED_CODES.includes(code)) return 'en';
  return code;
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStoredLang);

  // Mirror the active language onto the document so locale-aware native
  // controls (e.g. <input type="date"> calendar pickers) render in it.
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  const switchLanguage = useCallback((code) => {
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
    setLang(code);
  }, []);

  // Keep state in sync if the language changes in another tab/window.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue && SUPPORTED_CODES.includes(e.newValue)) {
        setLang(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const t = useCallback((key) => {
    const dict = translations[lang] || translations['en'];
    const mapDict = mapTranslations[lang] || {};
    const extraDict = extraTranslations[lang] || {};
    const moreDict = moreTranslations[lang] || {};
    const gameDict = gameTranslations[lang] || {};
    const searchDict = searchTranslations[lang] || {};
    const notifDict = notificationTranslations[lang] || {};
    const skinDict = skinTranslations[lang] || {};
    return dict[key] ?? mapDict[key] ?? extraDict[key] ?? moreDict[key] ?? gameDict[key] ?? searchDict[key] ?? notifDict[key] ?? skinDict[key]
      ?? translations['en'][key] ?? mapTranslations['en'][key] ?? extraTranslations['en'][key] ?? moreTranslations['en']?.[key] ?? gameTranslations['en']?.[key] ?? searchTranslations['en']?.[key] ?? notificationTranslations['en']?.[key] ?? skinTranslations['en']?.[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}