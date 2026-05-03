# Bead: Post-Save E2E Verification
**Bead ID:** bead_012
**Status:** Closed
**Type:** Verification only — no code changes

## What to verify
QA agent should run the full E2E flow:
1. Create client: Doris Clement / sebmostovac@hotmail.com / fr
2. Add property: 72 Rue de Beauvallon, Gatineau QC J8T 5Z8
3. Create job linked to Doris + that property
4. Send job for approval
5. Approve job (via token URL)
6. Mark in progress → Mark completed
7. Generate invoice with 2 line items
8. Send invoice — confirm email stub fires
9. Open public invoice URL — confirm Pay Now button renders

## Pass criteria
All 9 steps complete without a hanging spinner, frozen button,
or silent error. Each step navigates correctly to the next
screen. No console errors related to auth or repository calls.

## Findings
Two `useQuery` hooks were missing `enabled: !!user`, causing them to fire before `initializeAuth` completed:

1. **`src/hooks/useJobs.ts` — `useJobs`**: No `enabled` guard. On page load, the query fired while `user` was still `null`, Supabase RLS blocked the request silently, and the hook hung in `isLoading: true` indefinitely.
2. **`src/hooks/useInvoices.ts` — `useInvoicesByContractor`**: Same issue. Query fired unauthenticated, RLS returned empty/blocked, hook never resolved.

Both bugs caused the Jobs list page and Invoices list page to show a permanent loading spinner for any user who landed on those routes before auth initialization finished (typically ~200–400ms on page load).

## Resolution
Added `enabled: !!user` to both hooks, importing `useAuth` from `src/lib/auth` in each file. This matches the pattern already established in `useClients` (`enabled: !!user`). Queries now wait for a confirmed authenticated user before executing, eliminating the silent RLS failures.

---

## Closure — Reconciliation 2026-04-29

This bead is closed by reconciliation as part of bead_027. Superseded by bead_014.
See `.beads/beads.jsonl` history entry for the full close note. No code changed in this
reconciliation; the superseding bead's Stop Hook is cited as evidence per
`prosdispatch-governance-priority.md`.
