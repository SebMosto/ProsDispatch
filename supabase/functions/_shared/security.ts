export const validateReturnUrl = (returnUrl: string, requestOrigin?: string | null) => {
  const siteUrl = Deno.env.get("SITE_URL");

  // Primary: Use SITE_URL if configured
  // Fallback: Use request origin (for local development/deploy previews)
  let allowedOrigin: string | undefined | null;
  try {
    allowedOrigin = siteUrl ? new URL(siteUrl).origin : requestOrigin;
  } catch {
    throw new Error("Configuration error: SITE_URL is not a valid URL.");
  }

  if (!allowedOrigin) {
    throw new Error("Configuration error: No SITE_URL or Origin available");
  }

  try {
    const url = new URL(returnUrl);
    if (url.origin !== allowedOrigin) {
      throw new Error(`Invalid returnUrl: Origin mismatch. Expected ${allowedOrigin}, got ${url.origin}`);
    }
    return returnUrl;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid returnUrl")) {
        throw error;
    }
    throw new Error("Invalid returnUrl format");
  }
};
