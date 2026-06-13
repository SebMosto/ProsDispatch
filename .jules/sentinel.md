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
## 2024-04-12 - [Critical] Fix Open Redirect in Stripe Portal Session
**Vulnerability:** The `create-portal-session` Edge Function called `validateReturnUrl(returnUrl)` but failed to capture its return value. As a result, the unvalidated raw user input (`returnUrl`) was passed directly to the Stripe billing portal creation, potentially allowing open redirect attacks if the user provided an external, unallowed URL.
**Learning:** Security sanitation functions must have their return values explicitly assigned and used. Calling a validation/sanitization function without capturing its output is a common oversight that leaves the application vulnerable despite the presence of security logic.
**Prevention:** Always verify that the result of functions like `validateReturnUrl` is assigned to a variable (e.g., `const safeUrl = validateReturnUrl(url);`) and that this safe variable is the one passed to downstream APIs (like Stripe). Consider linting rules or code review checklists to catch unassigned return values from known security functions.
