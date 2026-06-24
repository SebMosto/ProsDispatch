## 2024-06-03 - Open Redirect Vulnerability in Edge Functions
**Vulnerability:** The Edge Functions `create-checkout-session` and `create-portal-session` blindly trust the `returnUrl` provided by the client, using it as the `success_url`, `cancel_url`, or `return_url`. This allows an attacker to create checkout or portal sessions that redirect victims to malicious sites, potentially to steal session IDs or conduct phishing attacks.
**Learning:** `returnUrl` must always be validated against a whitelist of trusted domains (e.g., the application's base URL) before being used in redirect flows.
**Prevention:** Implement a validation function to ensure the `returnUrl` is relative, or if absolute, matches an allowed domain.

## 2024-06-03 - Hardcoded Secrets Bypassing Environment Variables
**Vulnerability:** The `src/lib/supabase.ts` file had hardcoded `supabaseUrl` and `supabaseAnonKey` strings directly in the source code. While one was marked as a "Temporary Bypass", this completely subverted the environment variable system (`import.meta.env`) and caused secrets to be tracked in version control, creating a critical risk of exposing database credentials.
**Learning:** Developers sometimes hardcode secrets temporarily for local debugging or due to environment issues, and forget to revert them before committing.
**Prevention:** Always ensure configuration files pull secrets exclusively from environment variables.

## 2025-10-24 - Open Redirect in Payment Flows
**Vulnerability:** Supabase Edge Functions accepted an arbitrary `returnUrl` from the client for Stripe checkout success/cancel URLs.
**Learning:** Developers often assume `returnUrl` will be a relative path or safe, but it can be any URL, allowing attackers to phish users after a legitimate payment flow.
**Prevention:** Always validate `returnUrl` against a strict allowlist of origins (e.g., `SITE_URL` env var) before passing it to third-party services like Stripe.

## 2026-03-22 - Unassigned Validation Function Return Value
**Vulnerability:** In `create-portal-session`, the `validateReturnUrl` function was called to sanitize the `returnUrl`, but its safe return value was not assigned or used. Instead, the raw, untrusted user input was passed directly to the Stripe API as the `return_url`.
**Learning:** Pure validation functions that return safe values are ineffective if their output is ignored. A function call like `validateReturnUrl(returnUrl)` provides a false sense of security if the raw input is still used subsequently.
**Prevention:** Always capture the output of validation/sanitization functions (e.g., `const safeValue = sanitize(input)`) and strictly use that safe value in all downstream logic, never the raw input.
