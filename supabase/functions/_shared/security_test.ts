import { assertThrows } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { validateReturnUrl } from "./security.ts";

Deno.test("validateReturnUrl - allows localhost", () => {
  // Should not throw
  validateReturnUrl("http://localhost:3000/success");
  validateReturnUrl("http://127.0.0.1:54321/cancel");
});

Deno.test("validateReturnUrl - rejects localhost bypass attempt", () => {
  // "http://localhost:@evil.com" parses to hostname "evil.com" with username "localhost"
  assertThrows(
    () => validateReturnUrl("http://localhost:@evil.com"),
    Error,
    "Server configuration error" // Fails because SITE_URL is missing in this test case, or falls through to site check
  );

  // If we set SITE_URL, it should fail origin check
  const original = Deno.env.get("SITE_URL");
  Deno.env.set("SITE_URL", "https://example.com");
  try {
      assertThrows(
        () => validateReturnUrl("http://localhost:@evil.com"),
        Error,
        "Invalid returnUrl origin"
      );
  } finally {
      if (original) Deno.env.set("SITE_URL", original);
      else Deno.env.delete("SITE_URL");
  }
});

Deno.test("validateReturnUrl - matches SITE_URL", () => {
  Deno.env.set("SITE_URL", "https://example.com");
  try {
    validateReturnUrl("https://example.com/success");
    validateReturnUrl("https://example.com/dashboard?foo=bar");
  } finally {
    Deno.env.delete("SITE_URL");
  }
});

Deno.test("validateReturnUrl - rejects mismatching origin", () => {
  Deno.env.set("SITE_URL", "https://example.com");
  try {
    assertThrows(() => validateReturnUrl("https://evil.com"), Error, "Invalid returnUrl origin");
    assertThrows(() => validateReturnUrl("https://example.com.evil.com"), Error, "Invalid returnUrl origin");
  } finally {
    Deno.env.delete("SITE_URL");
  }
});

Deno.test("validateReturnUrl - throws if SITE_URL missing", () => {
  const originalUrl = Deno.env.get("SITE_URL");
  Deno.env.delete("SITE_URL"); // Ensure it's unset

  try {
      assertThrows(() => validateReturnUrl("https://example.com"), Error, "Server configuration error");
  } finally {
      if (originalUrl) Deno.env.set("SITE_URL", originalUrl);
  }
});
