import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import i18n from '../i18n';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock useTranslation
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        language: 'en',
        changeLanguage: vi.fn().mockResolvedValue(undefined),
      },
    }),
  };
});

describe('LanguageSwitcher Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should explicitly save language to localStorage when French is clicked', async () => {
    // We need to access the mocked changeLanguage to verify it's called
    // But since we mocked useTranslation entirely, we need to spy on the implementation or the mock.

    // Let's re-mock with a specific spy
    const changeLanguageMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(await import('react-i18next')).useTranslation = () => ({
      t: (key: string) => key === 'layout.languageFrench' ? 'Français' : key,
      i18n: {
        language: 'en',
        changeLanguage: changeLanguageMock,
      },
    }) as any;

    render(<LanguageSwitcher />);

    // Find French button.
    // The component renders: {language === 'en' ? t('layout.languageEnglish') : t('layout.languageFrench')}
    // If current is 'en', the buttons are 'en' and 'fr'.
    // Wait, the component maps over ['en', 'fr'].
    // Button 1: key='en', text=t('layout.languageEnglish')
    // Button 2: key='fr', text=t('layout.languageFrench')

    const frenchButton = screen.getByText('Français');
    fireEvent.click(frenchButton);

    await waitFor(() => {
      expect(changeLanguageMock).toHaveBeenCalledWith('fr');
      // The component explicitly calls localStorage.setItem('i18nextLng', language)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('i18nextLng', 'fr');
    });
  });
});
