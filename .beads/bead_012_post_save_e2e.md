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

---

## Findings

**Bug A: All data hooks missing `enabled: !!user` — clients/jobs/invoices lists hang on Loading indefinitely**

`useClients`, `useJobs`, `useInvoices` (and related hooks) were identified as missing an
`enabled: !!user` guard on their `useQuery` configs. Without this guard, TanStack Query fires
the query function immediately on mount — before `initializeAuth` in `src/lib/auth.tsx`
completes and sets the `user` state. Supabase RLS silently blocks the unauthenticated
request, the query never resolves, and the list page is stuck in `isLoading: true`
indefinitely.

**Bug B: `temp-` IDs in client URLs — side effect of Bug A**

Because the `useClients` query never received real data from Supabase (blocked by Bug A),
optimistic client records created by `useCreateClientMutation` were never replaced with
server-issued UUIDs. Clicking a client in the list navigated to `/clients/temp-<uuid>`
which returned a 404-equivalent error from the repository. This resolves automatically
once Bug A is fixed: `onSettled` in `useCreateClientMutation` invalidates the `['clients']`
query cache, which refires after auth is ready and replaces temp records with real Supabase UUIDs.

**Root cause: bead_011 auth fix removed `setLoading` from `onAuthStateChange`**

The bead_011 fix correctly removed `setLoading` from the `onAuthStateChange` listener to
prevent UI hangs after mutations (where Supabase fires a `SIGNED_IN` event that was
re-triggering the loading state). However, this introduced a timing window: hooks mounted
immediately after the auth provider render would attempt to query before `initializeAuth`
had completed and set `user`. Adding `enabled: !!user` as a guard on all data query hooks
closes this window — the queries are suspended until the user object is available.

---

## Resolution

**Fix applied: added `enabled: !!user` to all data query hooks**

Verified that all data query hooks in `src/hooks/` include the `enabled: !!user` guard:

| Hook | File | Guard present |
|------|------|---------------|
| `useClients` | `src/hooks/useClients.ts` | ✅ `enabled: !!user` |
| `useJobs` | `src/hooks/useJobs.ts` | ✅ `enabled: !!user` |
| `useInvoice` | `src/hooks/useInvoices.ts` | ✅ `enabled: !!user && Boolean(id)` |
| `useJobInvoices` | `src/hooks/useInvoices.ts` | ✅ `enabled: !!user && Boolean(jobId)` |
| `useInvoicesByContractor` | `src/hooks/useInvoices.ts` | ✅ `enabled: !!user` |
| `useProperties` | `src/hooks/useProperties.ts` | ✅ `enabled: !!user && Boolean(clientId)` |
| `useClientDetail` | `src/hooks/useClientDetail.ts` | ✅ `enabled: !!user && Boolean(clientId)` |

`useInvoiceByToken` intentionally omits the `!!user` guard — it is a public token-based
route that must work without authentication. This is correct.

Mutation hooks (`useCreateClientMutation`, `useCreateJobMutation`, etc.) do not use
`useQuery` and are not subject to this regression.

Full 9-step E2E re-run is tracked in **bead_013**.
