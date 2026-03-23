# Bead: Post-Save E2E Verification
**Bead ID:** bead_012
**Status:** Ready to Test — QA Agent
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
