<<<<<<< Updated upstream
export const validateReturnUrl = (url: string): string => {
  try {
    const returnUrlObj = new URL(url);
    const siteUrlStr = Deno.env.get("SITE_URL");
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    if (siteUrlStr) {
      try {
        const siteUrlObj = new URL(siteUrlStr);
        if (!allowedOrigins.includes(siteUrlObj.origin)) {
          allowedOrigins.push(siteUrlObj.origin);
        }
      } catch {
        console.error(`SITE_URL environment variable contains an invalid URL format: ${siteUrlStr}`);
      }
    }

    if (!allowedOrigins.includes(returnUrlObj.origin)) {
      throw new Error(`Invalid return URL origin: ${returnUrlObj.origin}`);
    }

    return url;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid return URL origin")) {
      throw error;
    }
    throw new Error("Invalid return URL format");
  }
};
=======
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

>>>>>>> Stashed changes
