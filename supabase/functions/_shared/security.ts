
/**
 * Validates the return URL to prevent Open Redirect vulnerabilities.
 * Ensures the URL belongs to the allowed domain (SITE_URL) or localhost in development.
 *
 * @param url - The URL to validate
 * @returns The validated URL if safe
 * @throws Error if the URL is invalid or from an unauthorized origin
 */
export const validateReturnUrl = (url: string): string => {
  // Safe access to Deno global without confusing TS compilers of different environments (Node vs Deno)
  // Using globalThis prevents 'Deno is not defined' in Node
  // Casting to any prevents type errors in Node without triggering 'unused @ts-expect-error' in Deno
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deno = (globalThis as any).Deno;

  let siteUrl: string | undefined;
  
  if (deno) {
    siteUrl = deno.env.get("SITE_URL");
  }

  // Fail fast if SITE_URL is not configured
  // This prevents production deployments from silently breaking with localhost fallback
  if (!siteUrl) {
    console.error("SITE_URL environment variable is not set. This is required for secure URL validation.");
    throw new Error("Server configuration error: SITE_URL not configured");
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
