import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Mock the locales to avoid loading files in test
const enMock = { greeting: 'Hello' };
const frMock = { greeting: 'Bonjour' };

const resources = {
  en: { translation: enMock },
  fr: { translation: frMock },
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
    const i18n = i18next.createInstance();

    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr'],
        detection: {
            order: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        }
      });

    // Depending on detector config, it might return 'en' or 'en-US' etc.
    // Given we set 'en' as fallback and resource, it should settle on 'en' if nothing else is found.
    expect(i18n.language).toContain('en');
    expect(i18n.t('greeting')).toBe('Hello');
  });

  it('should initialize with stored language (fr) from localStorage', async () => {
    localStorage.setItem('i18nextLng', 'fr');

    const i18n = i18next.createInstance();

    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr'],
        detection: {
            order: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        }
      });

    expect(i18n.language).toBe('fr');
    expect(i18n.t('greeting')).toBe('Bonjour');
  });
});
