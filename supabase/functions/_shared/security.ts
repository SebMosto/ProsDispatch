/**
 * Validates a return URL to prevent Open Redirect vulnerabilities.
 *
 * SECURITY: This function REQUIRES SITE_URL to be configured. It will reject
 * all requests when SITE_URL is not set, preventing open redirect attacks
 * in misconfigured environments (staging, local, or production).
 *
 * @param returnUrl The URL to validate
 * @param siteUrl The configured SITE_URL environment variable (REQUIRED)
 * @returns The validated URL string if safe, throws an error otherwise
 * @throws Error if the URL is invalid or doesn't match the allowlist
 */
export function validateReturnUrl(returnUrl: string, siteUrl: string | undefined): string {
  // 1. Require SITE_URL to be configured
  if (!siteUrl) {
    throw new Error(
      'Invalid returnUrl: SITE_URL is not configured. Refusing to validate without an explicit allowlist.'
    );
  }

  try {
    const url = new URL(returnUrl);

    // 2. Strict Protocol Check
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid returnUrl: Only http and https protocols are allowed');
    }

    // 3. Parse and validate SITE_URL
    let siteOrigin: string;
    try {
      const site = new URL(siteUrl);
      siteOrigin = site.origin;
    } catch {
      throw new Error('Invalid returnUrl: SITE_URL configuration is malformed');
    }

    // 4. Strict Origin Matching
    if (url.origin !== siteOrigin) {
      throw new Error(
        `Invalid returnUrl: Origin mismatch. Expected ${siteOrigin}, got ${url.origin}`
      );
    }

    // Return the validated URL
    return returnUrl;
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof Error && error.message.startsWith('Invalid returnUrl')) {
      throw error;
    }
    // Malformed URL
    throw new Error('Invalid returnUrl: Malformed URL');
  }
}
