import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Mock the locales to avoid loading files in test
const enMock = { greeting: 'Hello' };
const frMock = { greeting: 'Bonjour' };

const resources = {
  en: { translation: enMock },
  fr: { translation: frMock },
};

// Helper to create i18n instance with manual language persistence
const createI18nInstance = (initialLng?: string) => {
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
    return initialLng || 'en';
  };

  const i18n = i18next.createInstance();

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

  return i18n;
};

describe('i18n Initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default language (en) if localStorage is empty', async () => {
    const i18n = createI18nInstance();

    await i18n.loadLanguages(['en', 'fr']);

    expect(i18n.language).toBe('en');
    expect(i18n.t('greeting')).toBe('Hello');
  });

  it('should initialize with stored language (fr) from localStorage', async () => {
    localStorage.setItem('i18nextLng', 'fr');

    const i18n = createI18nInstance();

    await i18n.loadLanguages(['en', 'fr']);

    expect(i18n.language).toBe('fr');
    expect(i18n.t('greeting')).toBe('Bonjour');
  });
});
