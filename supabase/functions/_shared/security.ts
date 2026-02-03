
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

  // Safe access to Deno global without confusing TS compilers of different environments (Node vs Deno)
  // Using globalThis prevents 'Deno is not defined' in Node
  // Casting to any prevents type errors in Node without triggering 'unused @ts-expect-error' in Deno
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deno = (globalThis as any).Deno;

  if (deno) {
    siteUrl = deno.env.get("SITE_URL") || siteUrl;
  }

  try {
    const returnUrlObj = new URL(url);
    const siteUrlObj = new URL(siteUrl);

    // Check if SITE_URL implies a development environment (localhost/127.0.0.1)
    const isDev = siteUrlObj.hostname === "localhost" || siteUrlObj.hostname === "127.0.0.1";

    if (isDev) {
      // In dev, allow localhost and 127.0.0.1 explicitly to handle variations
      if (returnUrlObj.hostname === "localhost" || returnUrlObj.hostname === "127.0.0.1") {
        return url;
      }
    }

    // Strict origin check for production (and dev if exact match)
    if (returnUrlObj.origin === siteUrlObj.origin) {
      return url;
    }

    // Explicitly throw to trigger catch block
    throw new Error("Invalid returnUrl origin");

  } catch (error) {
    // Log the actual error for debugging
    console.error(`Security validation failed for URL: ${url}`, error);
    throw new Error("Invalid returnUrl");
  }
};
