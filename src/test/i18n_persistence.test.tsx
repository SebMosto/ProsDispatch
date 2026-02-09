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
    // Let's re-mock with a specific spy to verify calls
    const changeLanguageMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(await import('react-i18next')).useTranslation = () => ({
      t: (key: string) => (key === 'layout.languageFrench' ? 'Français' : key),
      i18n: {
        language: 'en',
        changeLanguage: changeLanguageMock,
      },
    } as unknown as import('react-i18next').UseTranslationResponse<'translation'>);

    render(<LanguageSwitcher />);

    const frenchButton = screen.getByText('Français');
    fireEvent.click(frenchButton);

    await waitFor(() => {
      expect(changeLanguageMock).toHaveBeenCalledWith('fr');
      // The component explicitly calls localStorage.setItem('i18nextLng', language)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('i18nextLng', 'fr');
    });
  });
});
