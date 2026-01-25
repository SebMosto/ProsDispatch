import { describe, it, expect } from 'vitest';
import i18n from '../i18n';

describe('i18n Persistence', () => {
  it('should be configured to use localStorage', () => {
    const options = i18n.options;
    expect(options.detection).toBeDefined();
    expect(options.detection?.caches).toContain('localStorage');
    expect(options.detection?.lookupLocalStorage).toBe('i18nextLng');
  });
});
