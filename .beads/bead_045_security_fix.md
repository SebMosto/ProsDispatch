# Bead 045: Fix Open Redirect Vulnerability in create-portal-session

## Scope
- Identify the unused return value of `validateReturnUrl` in `supabase/functions/create-portal-session/index.ts`.
- Assign the result to a variable `safeReturnUrl`.
- Pass `safeReturnUrl` as the `return_url` to `stripe.billingPortal.sessions.create()`.
- Add a learning entry to `.jules/sentinel.md`.

## Out of Scope
- Modifying other Edge Functions.
- Refactoring `validateReturnUrl` itself.
- Changes to the frontend application.
