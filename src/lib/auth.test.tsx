import { describe, it, expect } from 'vitest';
import { calculateTrialDaysRemaining } from './auth';

describe('calculateTrialDaysRemaining', () => {
  it('returns 0 when endDate is null', () => {
    expect(calculateTrialDaysRemaining(null)).toBe(0);
  });

  it('returns 0 for invalid dates', () => {
    // @ts-expect-error testing invalid input
    expect(calculateTrialDaysRemaining('not-a-date')).toBe(0);
  });

  it('returns a positive integer number of days (rounded up)', () => {
    const now = Date.now();
    const twoAndHalfDaysMs = 2.5 * 24 * 60 * 60 * 1000;
    const future = new Date(now + twoAndHalfDaysMs).toISOString();

    const days = calculateTrialDaysRemaining(future);
    expect(days).toBeGreaterThanOrEqual(2);
    expect(days).toBeLessThanOrEqual(3);
  });

  it('never returns negative values', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateTrialDaysRemaining(past)).toBe(0);
  });
});

