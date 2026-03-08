
export const validateReturnUrl = (url: string): string => {
  let returnUrlObj: URL;
  try {
    returnUrlObj = new URL(url);
  } catch {
    throw new Error("Invalid return URL format");
  }

  const siteUrlStr = Deno.env.get("SITE_URL");
  const allowedOrigins = new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  if (siteUrlStr) {
    try {
      const siteUrlObj = new URL(siteUrlStr);
      allowedOrigins.add(siteUrlObj.origin);
    } catch {
      console.error("Invalid SITE_URL environment variable:", siteUrlStr);
    }
  }

  if (!allowedOrigins.has(returnUrlObj.origin)) {
    throw new Error(`Invalid return URL origin: ${returnUrlObj.origin}`);
  }

  return url;
};
