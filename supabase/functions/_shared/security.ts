/**
 * Validates a return URL to prevent Open Redirect vulnerabilities.
 *
 * @param returnUrl The URL to validate
 * @param requestOrigin The Origin header from the request (optional)
 * @param siteUrl The configured SITE_URL environment variable (optional)
 * @returns true if the URL is safe to redirect to, false otherwise
 */
export function validateReturnUrl(returnUrl: string, requestOrigin: string | null, siteUrl?: string): boolean {
  try {
    const url = new URL(returnUrl);

    // 1. Strict Protocol Check
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // 2. Check against SITE_URL (Strict Mode)
    // If SITE_URL is configured, we ONLY allow redirects to that origin.
    if (siteUrl) {
      try {
        const site = new URL(siteUrl);
        return url.origin === site.origin;
      try {
        const site = new URL(siteUrl);
        // If SITE_URL is valid and matches, allow it.
        if (url.origin === site.origin) {
          return true;
        }
        // If SITE_URL is valid but doesn't match, explicitly deny.
        return false;
      } catch {
        // If SITE_URL is provided but invalid, it's a misconfiguration. Fail closed.
        return false;
      }
    if (requestOrigin) {
      try {
        const origin = new URL(requestOrigin);
        if (url.origin === origin.origin) {
          return true;
        }
      } catch {
        // Invalid Origin header, ignore it
      }
    }

    // 4. Localhost Fallback (for local development without SITE_URL)
    // Only reach here if SITE_URL was NOT set (or invalid)
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
