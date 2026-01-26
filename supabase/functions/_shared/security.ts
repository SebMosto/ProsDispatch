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
      } catch {
        // Invalid SITE_URL config, fall through or fail?
        // Failing safe: if config is present but invalid, ignore it (treat as not set) or block?
        // Let's treat as not set to avoid breaking everything if someone types a bad URL in env.
        // But for security, maybe we should block.
        // Given the prompt context, I'll fall through (ignore invalid config).
      }
    }

    // 3. Check against Request Origin
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
