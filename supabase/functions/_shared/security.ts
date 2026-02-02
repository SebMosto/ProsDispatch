export const validateReturnUrl = (returnUrl: string, requestOrigin?: string | null) => {
  const siteUrl = Deno.env.get("SITE_URL");

  // Primary: Use SITE_URL if configured
  // Fallback: Use request origin (for local development/deploy previews)
  const allowedOrigin = siteUrl ? new URL(siteUrl).origin : requestOrigin;

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
    // A TypeError is thrown by `new URL()` for malformed URLs.
    if (error instanceof TypeError) {
      throw new Error("Invalid returnUrl format");
    }
    // Re-throw our custom origin mismatch error or other unexpected errors.
    throw error;
  }
};
