export function validateReturnUrl(returnUrl: string, allowedOrigin?: string) {
  try {
    const url = new URL(returnUrl);
    const siteUrl = Deno.env.get("SITE_URL");

    // 1. If SITE_URL is configured, strictly match it
    if (siteUrl) {
      const site = new URL(siteUrl);
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

  } catch (err) {
     if (err instanceof Error && err.message.startsWith("Invalid returnUrl")) {
       throw err;
     }
     throw new Error("Invalid returnUrl: Malformed URL");
  }
}
