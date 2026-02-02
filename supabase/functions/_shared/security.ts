
/**
 * Validates the return URL to prevent Open Redirect vulnerabilities.
 * Ensures the URL belongs to the allowed domain (SITE_URL) or localhost in development.
 *
 * @param url - The URL to validate
 * @returns The validated URL if safe
 * @throws Error if the URL is invalid or from an unauthorized origin
 */
export const validateReturnUrl = (url: string): string => {
  let siteUrl = "http://localhost:5173"; // Default to Vite local port for development

  // Deno global is available in Supabase Edge Functions
  // @ts-expect-error: Deno is not defined in standard Node environment
  if (typeof Deno !== "undefined") {
    // @ts-expect-error: Deno types are missing in this context
    siteUrl = Deno.env.get("SITE_URL") || siteUrl;
  }

  try {
    const returnUrlObj = new URL(url);
    const siteUrlObj = new URL(siteUrl);

    const originsMatch = returnUrlObj.origin === siteUrlObj.origin;

    // Check if SITE_URL implies a development environment and if the return URL is also local.
    const isSiteDev = siteUrlObj.hostname === "localhost" || siteUrlObj.hostname === "127.0.0.1";
    const isReturnUrlLocal = returnUrlObj.hostname === "localhost" || returnUrlObj.hostname === "127.0.0.1";
    const isDevAllowed = isSiteDev && isReturnUrlLocal;

    if (originsMatch || isDevAllowed) {
      return url;
    }

    // If neither condition is met, the URL is invalid.
    throw new Error("Invalid returnUrl origin");

  } catch (error) {
    // Log the actual error for debugging
    console.error(`Security validation failed for URL: ${url}`, error);
    throw new Error("Invalid returnUrl");
  }
};
