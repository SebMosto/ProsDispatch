import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

// Language persistence logic
const LANGUAGE_KEY = 'i18nextLng';

const getInitialLanguage = (): string => {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
      return savedLanguage;
    }
  } catch (error) {
    console.warn('Unable to access localStorage for language preference', error);
  }

  const browserLang = navigator.language;
  return browserLang.startsWith('fr') ? 'fr' : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: getInitialLanguage(),
    supportedLngs: ['en', 'fr'],
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((error) => {
    console.error('i18n initialization error', error);
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.warn('Unable to save language preference to localStorage', error);
  }
});

export default i18n;
