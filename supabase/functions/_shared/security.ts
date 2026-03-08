export const validateReturnUrl = (url: string): string => {
  try {
    const returnUrlObj = new URL(url);
    const siteUrlStr = Deno.env.get("SITE_URL");
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    if (siteUrlStr) {
      try {
        const siteUrlObj = new URL(siteUrlStr);
        if (!allowedOrigins.includes(siteUrlObj.origin)) {
          allowedOrigins.push(siteUrlObj.origin);
        }
      } catch {
        console.error(`SITE_URL environment variable contains an invalid URL format: ${siteUrlStr}`);
      }
    }

    if (!allowedOrigins.includes(returnUrlObj.origin)) {
      throw new Error(`Invalid return URL origin: ${returnUrlObj.origin}`);
    }

    return url;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid return URL origin")) {
      throw error;
    }
    throw new Error("Invalid return URL format");
  }
};
