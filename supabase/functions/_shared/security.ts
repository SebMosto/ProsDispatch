
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

/**
 * Returns true when the function is running in a local/development environment.
 * We detect this by parsing SUPABASE_URL and checking whether its hostname is a
 * well-known loopback address, which is more robust than a substring search.
 * Defaults to non-local (false) when the variable is absent or unparseable so
 * that we stay in the safe/strict path.
 */
const isLocalEnvironment = (): boolean => {
  const supabaseUrlStr = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrlStr) return false;
  try {
    const { hostname } = new URL(supabaseUrlStr);
    return LOCAL_HOSTNAMES.has(hostname);
  } catch {
    return false;
  }
};

export const validateReturnUrl = (url: string): string => {
  try {
    const returnUrlObj = new URL(url);
    const siteUrlStr = Deno.env.get("SITE_URL");

    // In non-local (production/staging) environments, SITE_URL is required.
    // A missing SITE_URL would leave the allowlist as localhost-only, silently
    // rejecting every real production returnUrl with a confusing 400.
    if (!siteUrlStr && !isLocalEnvironment()) {
      throw new Error(
        "Server configuration error: SITE_URL environment variable is not set"
      );
    }

    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    if (siteUrlStr) {
      try {
        const siteUrlObj = new URL(siteUrlStr);
        // Only add if not already present to avoid duplicates (though harmless)
        if (!allowedOrigins.includes(siteUrlObj.origin)) {
          allowedOrigins.push(siteUrlObj.origin);
        }
      } catch {
        // An unparseable SITE_URL in production is also a hard configuration error.
        if (!isLocalEnvironment()) {
          throw new Error(
            "Server configuration error: SITE_URL environment variable is malformed"
          );
        }
        console.error("Invalid SITE_URL environment variable:", siteUrlStr);
      }
    }

    if (!allowedOrigins.includes(returnUrlObj.origin)) {
      throw new Error(`Invalid return URL origin: ${returnUrlObj.origin}`);
    }

    return url;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Invalid return URL origin") ||
        error.message.startsWith("Server configuration error:"))
    ) {
      throw error;
    }
    throw new Error("Invalid return URL format");
  }
};
