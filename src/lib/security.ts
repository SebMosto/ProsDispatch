/**
 * Validates if a URL is safe to be used in an href attribute to prevent XSS.
 * Only allows http and https protocols.
 *
 * @param url - The URL to validate
 * @returns true if the URL is safe, false otherwise
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
