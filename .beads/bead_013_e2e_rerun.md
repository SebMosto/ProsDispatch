# Bead: Full 9-Step E2E Re-Run Post Auth Fix
**Bead ID:** bead_013
**Status:** Ready to Test — QA Agent
**Type:** Verification only — no code changes
**Depends on:** bead_012 (Closed)

## Context

bead_012 was blocked by an auth-gating regression (all data query hooks missing
`enabled: !!user` guard). The fix has been verified in place. This bead re-runs
the full 9-step E2E flow to confirm the regression is resolved end-to-end.

## What to verify

Run the full E2E flow in order:

1. **Create client:** Doris Clement / sebmostovac@hotmail.com / preferred language: fr
2. **Add property:** 72 Rue de Beauvallon, Gatineau QC J8T 5Z8 (linked to Doris)
3. **Create job:** linked to Doris Clement + the Beauvallon property
4. **Send job for approval:** job status transitions to `sent`
5. **Approve job via token URL:** open the public `/jobs/approve/:token` link and submit approval
6. **Mark in progress → Mark completed:** two status transitions via UI
7. **Generate invoice:** create invoice with 2 line items against the completed job
8. **Send invoice:** confirm email stub fires (check Supabase edge function logs or stub output)
9. **Open public invoice URL:** navigate to `/pay/:token` — confirm Pay Now button renders without error

## Pass criteria

- All 9 steps complete without a hanging spinner, frozen button, or silent error
- `/clients` list loads immediately after login (no indefinite loading state)
- Newly created client shows a real UUID in the URL (not `temp-<uuid>`)
- Each step navigates correctly to the next screen
- No console errors related to `auth`, `repository`, or `enabled` guards
- Public routes (`/jobs/approve/:token`, `/pay/:token`) work without authentication

## Regression checks

- [ ] `/clients` does not hang on `isLoading: true` after login
- [ ] `/jobs` does not hang on `isLoading: true` after login
- [ ] `/invoices` does not hang on `isLoading: true` after login
- [ ] Client URL after creation uses a real Supabase UUID, not `temp-`
- [ ] Incognito visit to `/dashboard` redirects to `/login` (auth guard still enforced)
