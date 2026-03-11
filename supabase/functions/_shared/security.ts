/**
 * Security helpers shared across Edge Functions.
 *
 * validateReturnUrl implements the open-redirect mitigation pattern used
 * in bead_004 / PR #370. It ensures that any redirect or return URL is:
 * - either a relative URL (no protocol/host), or
 * - an absolute URL whose origin matches the configured SITE_URL origin.
 */

const getSiteOrigin = () => {
  const siteUrl = Deno.env.get("SITE_URL") ?? "";
  try {
    const url = new URL(siteUrl);
    return url.origin;
  } catch {
    return "";
  }
};

/**
 * Validates a candidate return URL against the allowed origin.
 *
 * @param returnUrl The untrusted return URL from the client.
 * @returns A safe URL string that can be used for redirects.
 *          Falls back to SITE_URL (or "/") when invalid.
 */
export const validateReturnUrl = (returnUrl: string | null | undefined): string => {
  const siteOrigin = getSiteOrigin();

  // If SITE_URL is not configured, fall back to a relative-safe path.
  if (!siteOrigin) {
    return "/";
  }

  if (!returnUrl) {
    return siteOrigin;
  }

  // Relative URLs are always allowed; they will be resolved by the browser.
  // This prevents open redirects to external domains.
  try {
    const parsed = new URL(returnUrl, siteOrigin);
    if (parsed.origin === siteOrigin) {
      return parsed.toString();
    }
    // Origin mismatch: fall back to safe origin root
    return siteOrigin;
  } catch {
    return siteOrigin;
  }
};

