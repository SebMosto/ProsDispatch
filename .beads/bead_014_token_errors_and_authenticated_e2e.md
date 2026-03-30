# Bead: Fix Public Token Error Handling + Run Authenticated 9-Step E2E Suite
**Bead ID:** bead_014
**Status:** Open
**Depends on:** bead_013 (Blocked — findings documented)

## Context

bead_013 was blocked by three findings after the static E2E suite ran. The playwright
infra issue (Blocker 1) was resolved in the same session (`npx playwright install`).
This bead closes the remaining two app issues and runs the authenticated flow that
bead_013 never executed.

---

## Task 1 — DONE: Playwright browser install
`npx playwright install` was run on 2026-03-28. Firefox + WebKit binaries are present.
No action needed.

---

## Task 2 — Fix login selector + run authenticated 9-step E2E suite

### 2a. Fix login field selectors in `tests/e2e-bead013.spec.ts`
The test uses `#email` and `#password` to locate the login form fields, but the
`SignInPage` component does not use those IDs. Before running the authenticated suite,
read `src/pages/auth/SignInPage.tsx`, find the actual input selectors, and update the
`signIn()` helper in `tests/e2e-bead013.spec.ts` to match.

Do NOT change the app — only update the test selectors.

Also check `tests/e2e-bead013-static.spec.ts` line 39 — same `#email` reference —
and fix it to match.

### 2b. Set credentials and run
```bash
export E2E_EMAIL=<contractor account email>
export E2E_PASSWORD=<contractor account password>
npx playwright test tests/e2e-bead013.spec.ts --reporter=list
```

### Pass criteria (all 9 steps must pass on Tablet + Desktop)
1. Sign in and create client Doris Clement — URL after save must not contain `temp-`
2. Add property: 72 Rue de Beauvallon, Gatineau QC J8T 5Z8
3. Create job: "Bead 013 — Snow Removal" linked to Doris + property
4. Send job for approval — status badge shows `sent`
5. Approve job via `/jobs/approve/:token` — "Job Approved" confirmation shown
6. Mark in progress → Mark completed — `Mark as Invoiced` button appears
7. Create invoice with 2 line items — URL after save is a real UUID
8. Finalize & Send invoice — status badge shows `sent`
9. Open `/pay/:token` — Pay Now button renders without error

No `auth`, `rls`, `unauthorized`, `jwt`, or `403` console errors at any step.

---

## Task 3 — Fix unfiltered console.error on invalid public token pages

### Root cause
When `/jobs/approve/:token` or `/pay/:token` receives an invalid/expired token,
the fetch to the Edge Function or Supabase RPC fails and the error is logged via
`console.error` instead of being caught and shown as a clean UI state.

Exact errors observed in bead_013:
- `/jobs/approve/bogus`: `FunctionsFetchError: Failed to send a request to the Edge Function`
- `/pay/bogus`: `Failed to load resource: the server responded with a status of 404 ()`

### What to fix
- `src/pages/public/JobApprovalPage.tsx` — wrap the token fetch in a try/catch (or
  use the query's `error` state). When the fetch fails or returns no data, render a
  clear error UI (e.g. "This link is invalid or has expired.") instead of logging to
  console. Remove any bare `console.error` calls on the token lookup path.
- `src/pages/public/PublicInvoicePage.tsx` — same pattern. The 404/error from the
  token RPC or Edge Function should set an error state displayed to the user, not
  logged to console.

### Out of scope
- Do not change the Edge Function behaviour
- Do not add retry logic
- Do not change the happy-path flow

### i18n
Add error key to both `en.json` and `fr.json`:
```
"public.invalid_token": "This link is invalid or has expired."
"public.invalid_token": "Ce lien est invalide ou a expiré."
```
(or equivalent keys that match existing namespace conventions — check `en.json` first)

### Acceptance
After the fix, re-run the static suite:
```bash
npx playwright test tests/e2e-bead013-static.spec.ts --reporter=list
```
`/jobs/approve/:bogus-token` and `/pay/:bogus-token` tests must pass on all 3 viewports.
No console.error from token lookup failures.

---

## Stop Hook (all must pass before closing)
```bash
npm run typecheck
npm run build
npm run lint
npm run test
npm run check:i18n
```

## Log
Close bead_014 in `beads.jsonl` with history summary after all tasks complete.
Open bead_015 for next QA cycle or follow-on work.
