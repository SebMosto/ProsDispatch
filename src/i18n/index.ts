import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: navigator.language.startsWith('fr') ? 'fr' : 'en',
    supportedLngs: ['en', 'fr'],
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((error) => {
    console.error('i18n initialization error', error);
  });

export default i18n;
