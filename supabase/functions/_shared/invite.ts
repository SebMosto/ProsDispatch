import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

export async function generateInviteToken(jobId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  const jwt = await create(
    { alg: "HS256", typ: "JWT" },
    { job_id: jobId, exp: getNumericDate(60 * 60 * 24 * 7) }, // 7 days expiration
    key
  );

  return jwt;
}

export async function verifyInviteToken(token: string, secret: string): Promise<{ job_id: string } | null> {
  try {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );

    const payload = await verify(token, key);
    return payload as { job_id: string };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
