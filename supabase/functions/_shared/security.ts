/**
 * Validates a return URL to prevent Open Redirect vulnerabilities.
 *
 * SECURITY: This function REQUIRES SITE_URL to be configured. It will reject
 * all requests when SITE_URL is not set, preventing open redirect attacks
 * in misconfigured environments (staging, local, or production).
 *
 * @param returnUrl The URL to validate
 * @param siteUrl The configured SITE_URL environment variable (optional, but defaults to Deno.env.get("SITE_URL"))
 * @returns The validated URL string if safe
 * @throws Error if the URL is invalid or doesn't match the allowlist
 */
export function validateReturnUrl(returnUrl: string, siteUrl: string | undefined = Deno.env.get("SITE_URL")): string {
  let url: URL;
  try {
    url = new URL(returnUrl);
  } catch {
    throw new Error("Invalid returnUrl: Malformed URL");
  }

  // 1. Strict Protocol Check
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Invalid returnUrl: Only http and https protocols are allowed');
  }

  // 2. Allow localhost for development
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return returnUrl;
  }

  // 3. Require SITE_URL for non-localhost
  if (!siteUrl) {
    throw new Error(
      'Invalid returnUrl: SITE_URL is not configured. Refusing to validate without an explicit allowlist.'
    );
  }

  // 4. Parse and validate SITE_URL
  let siteOrigin: string;
  try {
    const site = new URL(siteUrl);
    siteOrigin = site.origin;
  } catch {
    throw new Error('Invalid returnUrl: SITE_URL configuration is malformed');
  }

  // 5. Strict Origin Matching
  if (url.origin !== siteOrigin) {
    throw new Error(
      `Invalid returnUrl: Origin mismatch. Expected ${siteOrigin}, got ${url.origin}`
    );
  }

  return returnUrl;
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Use this when interpolating user-controlled strings into HTML templates (e.g. emails).
 *
 * @param unsafe The unsafe string to escape
 * @returns The escaped string
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe.replace(/[&<>"']/g, (match) => HTML_ESCAPE_MAP[match]);
}
