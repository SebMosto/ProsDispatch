import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LanguageSwitcher from '../components/LanguageSwitcher';
import React from 'react';

// Use vi.hoisted to ensure the mock is created before the module mock factory uses it
const { changeLanguageMock } = vi.hoisted(() => {
  return { changeLanguageMock: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
        if (key === 'layout.languageFrench') return 'Français';
        if (key === 'layout.languageEnglish') return 'English';
        return key;
    },
    i18n: {
      language: 'en',
      changeLanguage: changeLanguageMock,
    },
  }),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Spy on localStorage.setItem
    vi.spyOn(Storage.prototype, 'setItem');
  });

  it.each([
    { lang: 'fr', text: 'Français' },
    { lang: 'en', text: 'English' },
  ])('updates localStorage when language is changed to $text', async ({ lang, text }) => {
    render(<LanguageSwitcher />);

    const button = screen.getByText(text);
    fireEvent.click(button);

    expect(changeLanguageMock).toHaveBeenCalledWith(lang);

    // Wait for the promise chain to resolve and verify localStorage
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('i18nextLng', lang);
    });
  });
});
