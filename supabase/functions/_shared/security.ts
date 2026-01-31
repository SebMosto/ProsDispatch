/**
 * Validates that the provided return URL matches the allowed SITE_URL or is a localhost URL.
 * Prevents Open Redirect vulnerabilities.
 *
 * @param url The URL to validate
 * @throws Error if the URL is invalid or does not match the allowed origin
 */
export function validateReturnUrl(url: string): void {
  const siteUrl = Deno.env.get("SITE_URL");

  let returnUrlObj: URL;
  try {
    returnUrlObj = new URL(url);
  } catch (_e) {
    throw new Error("Invalid returnUrl format");
  }

  // Allow localhost for development (common ports)
  // We strictly check hostname to prevent "http://localhost:@evil.com" bypasses
  if (returnUrlObj.hostname === "localhost" || returnUrlObj.hostname === "127.0.0.1") {
    // Only allow http/https for localhost
    if (returnUrlObj.protocol !== "http:" && returnUrlObj.protocol !== "https:") {
        throw new Error("Invalid returnUrl protocol");
    }
    return;
  }

  if (!siteUrl) {
    console.error("SITE_URL environment variable is not set. Cannot validate returnUrl.");
    throw new Error("Server configuration error");
  }

  try {
    const siteUrlObj = new URL(siteUrl);

    if (returnUrlObj.origin !== siteUrlObj.origin) {
      throw new Error("Invalid returnUrl origin");
    }
  } catch (e) {
    // If SITE_URL parsing fails or origin check fails
    if (e instanceof Error && e.message === "Invalid returnUrl origin") {
        throw e;
    }
    // If SITE_URL is invalid, that's a server config error
    if (!Deno.env.get("SITE_URL")) { // Double check but we checked above
       throw new Error("Server configuration error");
    }
    // If SITE_URL is unparseable?
    // We should probably catch that specifically.
    // But for now, generic error is safe.
    throw new Error("Server configuration error or invalid URL");
  }
}
