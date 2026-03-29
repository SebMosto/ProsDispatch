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

- [x] `/clients` does not hang on `isLoading: true` after login — **PASS** (redirects to /login, no hang)
- [x] `/jobs` does not hang on `isLoading: true` after login — **PASS** (redirects to /login, no hang)
- [x] `/invoices` does not hang on `isLoading: true` after login — **PASS** (redirects to /login, no hang)
- [ ] Client URL after creation uses a real Supabase UUID, not `temp-` — **NOT TESTED** (authenticated suite not run)
- [x] Incognito visit to `/dashboard` redirects to `/login` (auth guard still enforced) — **PASS**

---

## Run Results — 2026-03-28

**Build:** Clean (`tsc -b && vite build` — zero errors)
**Server:** `vite preview --port 4173`
**Test runner:** Playwright

### Static Suite (`e2e-bead013-static.spec.ts`)

| Test | Mobile | Tablet | Desktop |
|---|---|---|---|
| App boots at / without console errors | INFRA FAIL | PASS | PASS |
| Login page renders all required fields | INFRA FAIL | **FAIL** | **FAIL** |
| /jobs → login, no hang (regression: enabled:!!user) | INFRA FAIL | PASS | PASS |
| /invoices → login, no hang (regression: enabled:!!user) | INFRA FAIL | PASS | PASS |
| /clients → login, no hang | INFRA FAIL | PASS | PASS |
| /dashboard → login, no hang | INFRA FAIL | PASS | PASS |
| /jobs/approve/:bogus-token renders (not blank crash) | INFRA FAIL | **FAIL** | **FAIL** |
| /pay/:bogus-token renders (not blank crash) | INFRA FAIL | **FAIL** | **FAIL** |
| Stripe publishable key sanity check | INFRA FAIL | PASS | PASS |

### Authenticated Suite (`e2e-bead013.spec.ts`)

| Step | Result |
|---|---|
| Step 1 — Sign in + Create client Doris Clement | **NOT RUN** |
| Step 2 — Add property: 72 Rue de Beauvallon | **NOT RUN** |
| Step 3 — Create job linked to Doris + property | **NOT RUN** |
| Step 4 — Send job for approval | **NOT RUN** |
| Step 5 — Approve job via token URL | **NOT RUN** |
| Step 6 — Mark in progress → completed | **NOT RUN** |
| Step 7 — Create invoice with 2 line items | **NOT RUN** |
| Step 8 — Finalize and send invoice | **NOT RUN** |
| Step 9 — Open public pay URL, confirm Pay Now renders | **NOT RUN** |

Reason: `E2E_EMAIL` and `E2E_PASSWORD` environment variables not set. Test called `test.fail()` and returned early on all viewports.

---

## Blocker Details

### BLOCKER 1 — INFRA: Mobile/WebKit browser binary missing
- **Error:** `browserType.launch: Executable doesn't exist at ...\webkit-2248\Playwright.exe`
- **Scope:** All 9 static tests on Mobile viewport; authenticated test on Mobile
- **Fix:** `npx playwright install` (downloads WebKit binary)
- **App impact:** None — this is a local dev machine configuration issue

### BLOCKER 2 — APP: Login page `#email` / `#password` selectors not found
- **Error:** `expect(page.locator('#email')).toBeVisible()` times out after 10s
- **Scope:** Tablet and Desktop (i.e., the working viewports)
- **Evidence:** Page loads (networkidle reached), but `#email` element not present
- **Likely cause:** Login form uses `input[name="email"]` or no explicit `id`, or the form is conditionally rendered behind a loading state
- **Files to inspect:** `src/pages/auth/SignInPage.tsx` — check input IDs
- **App impact:** Unknown until inspected. Login may still work in-browser but selector mismatch means test cannot verify it.

### BLOCKER 3 — APP: Public token pages emit unfiltered console.error on bogus tokens
- **`/jobs/approve/:bogus-token` error:**
  - `[console.error] Failed to load resource: net::ERR_FAILED`
  - `[console.error] Error fetching job: FunctionsFetchError: Failed to send a request to the Edge Function`
  - **Root cause:** Edge Function is not reachable from localhost (expected — no local Supabase). However, the error surfaces as an unfiltered `console.error`. With a valid remote Supabase, this would fire for any invalid token lookup.
- **`/pay/:bogus-token` error:**
  - `[console.error] Failed to load resource: the server responded with a status of 404 ()`
  - **Root cause:** A network request (likely the RPC or edge function fetch for the bogus token) returns 404, and the error is logged to console.error rather than caught silently.
- **Files to inspect:** `src/pages/public/JobApprovalPage.tsx`, `src/pages/public/PublicInvoicePage.tsx` — error handling on token fetch failures

### BLOCKER 4 — AUTHENTICATED SUITE: No credentials in session
- `E2E_EMAIL` and `E2E_PASSWORD` not set
- All 9 steps untested
- Set credentials via: `export E2E_EMAIL=... E2E_PASSWORD=...` before running `npx playwright test tests/e2e-bead013.spec.ts`
