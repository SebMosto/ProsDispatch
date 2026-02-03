import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import i18n from '../i18n';

describe('i18n Persistence', () => {
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    // Mock localStorage
    globalThis.localStorage = {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
      key: () => null,
      length: Object.keys(localStorageMock).length,
    };
  });

  afterEach(() => {
    localStorageMock = {};
  });

  it('should persist language changes to localStorage', async () => {
    // Change language to French
    await i18n.changeLanguage('fr');
    
    // Verify it's saved to localStorage
    expect(localStorage.getItem('i18nextLng')).toBe('fr');
    
    // Change back to English
    await i18n.changeLanguage('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
  });
});
