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
## 2024-05-18 - Missing Assignment of Sanitized Variable in Open Redirect Fix
**Vulnerability:** Open redirect validation logic `validateReturnUrl` was called, but its sanitized output was discarded because it was not assigned to a variable. The raw `returnUrl` was subsequently passed to Stripe `sessions.create`, making the endpoint vulnerable despite the presence of sanitization code.
**Learning:** Returning a sanitized string from a validation function is useless if the caller doesn't use the result. It gives a false sense of security. The sanitization logic needs to be tightly coupled with the usage of the variable.
**Prevention:** The return value of sanitization functions like `validateReturnUrl` must be explicitly assigned and used in downstream logic (e.g., `const safeUrl = validateReturnUrl(url)`). Reviewers should verify not just that a sanitization function is called, but that its sanitized result is actually the variable passed to sensitive sinks.
