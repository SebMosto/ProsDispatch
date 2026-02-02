/**
 * Validates a return URL to prevent Open Redirect vulnerabilities.
 *
 * @param returnUrl The URL to validate
 * @param allowedOrigin The Origin header from the request (optional fallback)
 * @throws Error with specific message if validation fails
 */
export function validateReturnUrl(returnUrl: string, allowedOrigin?: string): void {
  let url: URL;
  try {
    url = new URL(returnUrl);
  } catch {
    throw new Error("Invalid returnUrl: Malformed URL");
  }

  const siteUrl = Deno.env.get("SITE_URL");

  // 1. If SITE_URL is configured, strictly match it
  if (siteUrl) {
    let site: URL;
    try {
      site = new URL(siteUrl);
    } catch {
      console.error(`Server configuration error: Invalid SITE_URL: ${siteUrl}`);
      throw new Error("Internal Server Error: Site URL misconfigured");
    }
    if (url.origin !== site.origin) {
      throw new Error("Invalid returnUrl: Domain mismatch with SITE_URL");
    }
    return;
  }

  // 2. Fallback: Match the request's Origin (if provided)
  if (allowedOrigin) {
    if (url.origin !== allowedOrigin) {
      throw new Error("Invalid returnUrl: Domain mismatch with Origin");
    }
    return;
  }

  // 3. Fail safe if we can't validate against anything
  throw new Error("Invalid returnUrl: Configuration missing (SITE_URL)");
}
