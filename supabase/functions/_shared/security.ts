
/**
 * Validates a return URL to ensure it is safe to redirect to.
 * This prevents Open Redirect vulnerabilities.
 *
 * @param url The URL to validate
 * @param allowedOrigins Optional list of allowed origins. If not provided, it checks against SITE_URL env var.
 * @returns The validated URL
 * @throws Error if the URL is invalid or not allowed
 */
export function validateReturnUrl(url: string, allowedOrigins: string[] = []): string {
  try {
    const parsedUrl = new URL(url);
    const origins = [...allowedOrigins];

    // Always allow localhost for development
    origins.push("http://localhost:3000");
    origins.push("http://127.0.0.1:3000");

    // Add SITE_URL from environment if available
    const siteUrl = Deno.env.get("SITE_URL");
    if (siteUrl) {
      try {
        const siteOrigin = new URL(siteUrl).origin;
        origins.push(siteOrigin);
      } catch (e) {
        console.warn("Invalid SITE_URL environment variable:", siteUrl);
      }
    }

    if (!origins.includes(parsedUrl.origin)) {
      throw new Error(`Invalid return URL origin: ${parsedUrl.origin}`);
    }

    return url;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid return URL origin")) {
      throw error;
    }
    throw new Error("Invalid return URL");
  }
}
