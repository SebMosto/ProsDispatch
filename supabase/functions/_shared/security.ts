
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
