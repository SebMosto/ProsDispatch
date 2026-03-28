# Bead: Post-Fix E2E Verification
**Bead ID:** bead_013
**Status:** Ready to Test — QA Agent
**Type:** Verification only — no code changes

## Context
Re-run of the full 9-step E2E flow from bead_012 after the auth-gating regression fix (bead_012 findings). The fix added `enabled: !!user` to `useJobs` and `useInvoicesByContractor`. Confirm the Jobs and Invoices pages no longer hang on load.

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

Special attention:
- `/jobs` page must load the jobs list (no infinite spinner) immediately after login
- `/invoices` page must load the invoices list (no infinite spinner) immediately after login
- Network tab: no Supabase queries should fire on these routes before the session is established
