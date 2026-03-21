# Bead: QA Run #1 Findings — Supabase Env + FAB + Auth Guard

**Bead ID:** bead_011  
**Status:** Ready to Build  
**Type:** Infrastructure fix + UI  
**Assigned To:** Cursor  
**Source:** QA Agent Run #1 — 2026-03-20  
**Report:** `docs/qa/reports/QA_RUN_2026-03-20.md`

---

## 1. FINDING-001 (P0) — Supabase client not initializing in production

### Symptom
After login, every authenticated route (`/dashboard`, `/clients`, `/jobs/new`, etc.)
shows a full-screen `Processing…` spinner that never resolves. No Supabase API
calls are made after the JS bundle loads. The app is completely non-functional
beyond the initial login redirect.

### Network evidence
Zero requests to `nctjhybvdkmyxanqiphi.supabase.co` observed after bundle load.
Only static assets (JS, CSS, fonts) are fetched.

### Root cause
`VITE_SUPABASE_URL` and/or `VITE_SUPABASE_ANON_KEY` are missing or empty in the
Vercel production environment. Vite bakes these variables into the bundle at
build time. If absent during the bead_008 production deploy, the Supabase client
initialises with `undefined` values and silently hangs on `getSession()` forever.

### Fix (no code change required)
1. Open Vercel dashboard → Project → Settings → Environment Variables → Production
2. Confirm `VITE_SUPABASE_URL` is set to `https://nctjhybvdkmyxanqiphi.supabase.co`
3. Confirm `VITE_SUPABASE_ANON_KEY` is set (value from Supabase dashboard → Settings → API → anon/public key)
4. Trigger a Redeploy from Vercel (Deployments → … → Redeploy)

### Acceptance criteria
- [ ] `/clients` loads and at least one Supabase REST request fires (visible in DevTools network tab)
- [ ] `/dashboard` renders job and invoice summary sections with live data
- [ ] Hard reload on any authenticated route no longer shows the spinner
- [ ] QA Flows 2–8 can be executed in full

---

## 2. FINDING-002 (P1) — No FAB on Dashboard or Jobs pages

### Symptom
“New job” and “New client” are plain text links in the dashboard header area.
No fixed-position floating action button exists on either `/dashboard` or `/jobs`.
On a 390px mobile screen, these links are not immediately discoverable as the
primary action for a contractor arriving at the app between jobs.

### Spec reference
`QA_CONTEXT.md` — Mobile Behaviour Expectations:
> FAB (Floating Action Button) for primary action on Dashboard and Jobs — P1 if missing

### Fix
Add a fixed-position FAB to `DashboardPage.tsx` and `JobsListPage.tsx`.

Requirements:
- Position: fixed, bottom-right, above bottom nav (`z-20`, `bottom-20`, `right-4`)
- Size: minimum 44×44px touch target
- Colour: `bg-[#FF5C1B]` (primary orange), `text-white`, `border-2 border-[#0F172A]`, `shadow-brutal`
- Label: “Nouveau travail” (FR) / “New job” (EN) — use `t('jobs.new')` i18n key
- On tap: navigate to `/jobs/new`

### Acceptance criteria
- [ ] FAB visible on `/dashboard` at 390px viewport
- [ ] FAB visible on `/jobs` at 390px viewport
- [ ] Touch target ≥ 44px height confirmed
- [ ] Correct `--primary` orange token applied
- [ ] Label uses i18n key (no hardcoded string)

---

## 3. FINDING-003 (P0 pending) — Unauthenticated auth guard needs incognito retest

### Context
During QA Run #1, the unauthenticated redirect test was inconclusive because both
test tabs shared the same Supabase auth session cookie. It could not be confirmed
whether the route guard fires for a truly unauthenticated visitor.

### Required action
After FINDING-001 is resolved, open an incognito/private browsing window (no
active session) and navigate directly to `https://pro.prosdispatch.com/dashboard`.

- **If redirected to `/login`:** guard is working. Mark FINDING-003 closed.
- **If `/dashboard` loads content:** this is a confirmed P0 auth bypass.
  Add an explicit unauthenticated redirect in the `ProtectedRoute` component.

### Acceptance criteria
- [ ] Tested in incognito with no active session
- [ ] `/dashboard` redirects to `/login` when unauthenticated
- [ ] Same test passes for `/clients`, `/jobs`, `/invoices`, `/settings`

---

## Scope

| In scope | Out of scope |
|----------|-------------|
| Vercel production env var config | Business logic |
| FAB component in `DashboardPage.tsx` and `JobsListPage.tsx` (className + JSX only) | Data fetching, schemas |
| Incognito auth guard retest | Routing restructure |

**If a change requires touching a repository, hook, schema, or service file — stop and flag it.**

---

## Definition of Done

- [ ] FINDING-001: Vercel env vars confirmed set, app loads data on all authenticated routes
- [ ] FINDING-002: FAB present and tappable on Dashboard and Jobs at 390px
- [ ] FINDING-003: Auth guard confirmed in incognito (or fix applied if bypass found)
- [ ] QA agent re-runs Flow 1 + Flow 2 minimum to verify — update `bead_011` status to `closed`
- [ ] Regression table in `QA_PASS_FAIL_CRITERIA.md` updated with this run date
