# Sentinel Journal

## 2025-10-23 - Information Leakage in Auth Handling
**Vulnerability:** Raw error messages from Supabase (`error.message`) were directly displayed to users in authentication forms.
**Learning:** This exposes backend details and allows for user enumeration (e.g., distinguishing between "User not found" and "Invalid password"). Developers relying on client-side libraries often trust the library's error messages too much.
**Prevention:** Always map authentication errors to generic, localized messages (e.g., "Invalid credentials") in the UI layer, while logging specific errors internally for debugging.

## 2025-10-23 - Reverse Tabnapping in External Links
**Vulnerability:** External links (e.g., PDF downloads) used `target="_blank"` without explicit `rel="noopener noreferrer"`.
**Learning:** While modern browsers mitigate this, explicit `rel` attributes are required for robust defense-in-depth against malicious pages manipulating the origin page via `window.opener`.
**Prevention:** Enforce `rel="noopener noreferrer"` on all external links opening in new tabs.
