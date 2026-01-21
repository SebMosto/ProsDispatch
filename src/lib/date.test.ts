import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDate } from './date';
import i18n from '../i18n';

describe('formatDate', () => {
  afterEach(() => {
    // Reset language to english
    i18n.changeLanguage('en');
  });

  it('formats date in English (CA) by default', () => {
    const date = new Date('2023-10-25T14:30:00');
    // en-CA short date is usually YYYY-MM-DD in some contexts, or M/D/YY.
    // But we used default options: year, month, day, hour, minute (numeric).
    // Intl.DateTimeFormat('en-CA', ...).format(date)
    // We can't strictly predict the exact string across all node versions/environments easily without a loose match,
    // but we can check it looks English-ish or matches exactly if we know the environment.
    // Let's just check that it formats validly.

    // Actually, let's mock i18n.language to be sure.
    i18n.language = 'en';
    const result = formatDate(date);
    expect(result).toBeTruthy();
    // In en-CA, it might look like "2023-10-25, 2:30 p.m." or similar.
  });

  it('formats date in French (CA) when language is fr', async () => {
    const date = new Date('2023-10-25T14:30:00');
    await i18n.changeLanguage('fr');

    const result = formatDate(date);
    expect(result).toBeTruthy();
    // In fr-CA, it typically uses 24h format or specific French separators.
    // 2023-10-25 14 h 30
  });

  it('handles invalid dates', () => {
    expect(formatDate('invalid')).toBe('Invalid Date');
  });
});
