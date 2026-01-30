# Sentinel Journal

## 2025-10-23 - Information Leakage in Auth Handling
**Vulnerability:** Raw error messages from Supabase (`error.message`) were directly displayed to users in authentication forms.
**Learning:** This exposes backend details and allows for user enumeration (e.g., distinguishing between "User not found" and "Invalid password"). Developers relying on client-side libraries often trust the library's error messages too much.
**Prevention:** Always map authentication errors to generic, localized messages (e.g., "Invalid credentials") in the UI layer, while logging specific errors internally for debugging.

## 2025-10-23 - Reverse Tabnapping in External Links
**Vulnerability:** External links (e.g., PDF downloads) used `target="_blank"` without explicit `rel="noopener noreferrer"`.
**Learning:** While modern browsers mitigate this, explicit `rel` attributes are required for robust defense-in-depth against malicious pages manipulating the origin page via `window.opener`.
**Prevention:** Enforce `rel="noopener noreferrer"` on all external links opening in new tabs.

## 2025-10-23 - Least Privilege in Edge Functions
**Vulnerability:** Supabase Edge Functions were using `SUPABASE_SERVICE_ROLE_KEY` to read user profiles when the user's own Auth token (`supabaseClient`) would have sufficed.
**Learning:** Over-reliance on Service Role keys in server-side functions bypasses Row Level Security (RLS), increasing the blast radius if the function is compromised or contains logic errors.
**Prevention:** Always default to using the client provided `Authorization` header to create a Supabase client. Only upgrade to Service Role if strictly necessary (e.g., accessing data the user explicitly cannot see but the system needs).

## 2025-10-24 - Open Redirect in Payment Flows
**Vulnerability:** Supabase Edge Functions (`create-checkout-session`, `create-portal-session`) accepted a `returnUrl` from the client body and used it directly in Stripe API calls without validation.
**Learning:** Even internal backend functions are vulnerable to Open Redirects if they blindly trust client input. Attackers could theoretically craft calls (or trick users) to redirect to malicious sites after payment.
**Prevention:** Implement strict validation for all URL inputs using an allowlist (e.g., `SITE_URL` env var) and enforcing exact origin matching.
