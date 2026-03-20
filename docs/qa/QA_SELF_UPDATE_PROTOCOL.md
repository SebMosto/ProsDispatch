# QA Self-Update Protocol — ProsDispatch
**This document tells the QA agent how to keep its own documentation current.**  
**Run this protocol at the end of every test session before delivering your report.**

---

## Why This Exists

These QA docs are living documents. The codebase moves fast. Beads close. Issues get fixed. New stubs appear. If the QA agent doesn't update its own docs after each run, it will re-file known issues, miss confirmed fixes, and drift out of sync with the repo.

This protocol is the QA equivalent of the Ralph Loop's Audit step — applied to the QA docs themselves.

---

## When to Run This Protocol

Run this protocol:
1. **At the end of every test session**, before delivering the report
2. **Immediately** if a bead closes mid-session that changes a "known stub" to "should work now"
3. **When a new issue is discovered** that is clearly systemic (not a one-time fluke)

---

## Step 1 — Check for Closed Beads

Fetch the current `beads.jsonl` from the repo:

```
https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/beads.jsonl
```

For each bead with `status: closed` that you haven't verified yet:

1. Read the bead's acceptance criteria or fix description
2. Check if it corresponds to an entry in the **Known Issues Registry** in `QA_PASS_FAIL_CRITERIA.md`
3. If yes: **remove that entry from the Known Issues Registry** (or mark it `Resolved — bead BEAD-XXX`)
4. Add it to the **Regression Table** in `QA_PASS_FAIL_CRITERIA.md` with the run date

**Example edit to `QA_PASS_FAIL_CRITERIA.md` Known Issues Registry:**

Before:
```
| KI-001 | Stripe payment frontend not wired | PublicInvoicePage.tsx ~line 106 | Open stub | — |
```

After BEAD-009 closes it:
```
| KI-001 | Stripe payment frontend | PublicInvoicePage.tsx | Resolved — BEAD-009 | BEAD-009 |
```

---

## Step 2 — Add New Known Issues

If you found a new issue during testing that is clearly a systemic, persistent problem (not a one-time fluke):

1. Assign it a new `KI-XXX` ID (increment from the last entry in the Known Issues Registry)
2. Add it to the **Known Issues Registry** table in `QA_PASS_FAIL_CRITERIA.md`
3. Note the exact location, description, and severity

**Do not add to the Known Issues Registry:**
- Regressions that are already tracked in an open bead
- One-time rendering glitches
- Issues that you are confident will be fixed in the next deploy cycle

**Format:**
```
| KI-XXX | [Brief description] | [File or screen] | Open | [Bead ID if one exists, else —] |
```

---

## Step 3 — Update the Regression Table

At the bottom of `QA_PASS_FAIL_CRITERIA.md` there is a **Regression Table**. After each run, add a row for any item that changed state (was failing, now passing — or was passing, now failing).

```
| [Run Date] | [What was tested] | [Previously failing?] | [Now passing?] | [Bead that closed it] |
```

This table is the QA history. Over time it becomes the proof that the app is stabilising.

---

## Step 4 — Update the Known Stubs Table in `QA_AGENT_README.md`

The **Known Standing Issues** table at the bottom of `QA_AGENT_README.md` lists features that are intentional stubs. Keep this in sync.

When a stub is implemented:
1. Remove it from the "Known Standing Issues" table in `QA_AGENT_README.md`
2. Add it to the "In Scope — test these" list in `QA_CONTEXT.md`
3. Add the corresponding test steps to the relevant flow in `QA_WORKFLOW_FLOWS.md`

**Example: When Stripe payment frontend is wired (BEAD-009 hypothetical):**

In `QA_AGENT_README.md`, remove:
```
| Stripe payment frontend not wired | PublicInvoicePage.tsx line ~106 | Intentional stub |
```

In `QA_WORKFLOW_FLOWS.md`, update Flow 5 Step 6:
```
~~6. **KNOWN STUB:** Do NOT tap "Pay Now."~~
6. Tap "Pay Now."
7. **Check:** Stripe Checkout page opens (Stripe hosted, not our page)?
8. Use Stripe test card: 4242 4242 4242 4242, any future expiry, any CVC.
9. Complete payment.
10. **Check:** Return to app. Invoice status updated to `paid`?
11. **Check:** Job status also updated to `paid`?
```

In `QA_PASS_FAIL_CRITERIA.md`, update Flow 5 table:
```
| Stripe Checkout triggered | `/pay/:id` opens Stripe hosted page | P0 |
| Payment completes | Invoice status → `paid` | P0 |
| Webhook processed | Job status → `paid` | P0 |
```

---

## Step 5 — Check for New Routes or Features

After major deploys, check `docs/APP_FLOW.md` and `IMPLEMENTATION_PLAN.md` for any new routes or phase completions:

```
https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md
https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/IMPLEMENTATION_PLAN.md
```

If a phase moved from `PENDING` to `COMPLETED` in `IMPLEMENTATION_PLAN.md`:
1. Add the corresponding screens/flows to `QA_WORKFLOW_FLOWS.md`
2. Add pass/fail criteria to `QA_PASS_FAIL_CRITERIA.md`
3. Move the feature from "Out of scope" to "In scope" in `QA_CONTEXT.md`

---

## What NOT to Change

Do not modify:
- The **Severity Definitions** table in `QA_PASS_FAIL_CRITERIA.md` — these are governance-level decisions
- The **Brand & Tone Rules** in `QA_CONTEXT.md` — these come from `COPY-001` (canonical style guide)
- The **Global Pass/Fail Rules** table — change requests must go through Seb

---

## Self-Update Checklist

Before delivering your report, run through this:

```
[ ] Fetched latest beads.jsonl — compared to Known Issues Registry
[ ] Removed/resolved entries for closed beads
[ ] Added new KI-XXX entries for new systemic issues
[ ] Updated Regression Table with this run's results
[ ] Checked if any stubs moved to implemented — updated docs accordingly
[ ] Checked IMPLEMENTATION_PLAN.md for phase status changes
[ ] Confirmed QA_AGENT_README.md Known Standing Issues is current
```

If all boxes are checked: deliver the report.

---

## Repo Links for This Protocol

| Resource | URL |
|----------|-----|
| `beads.jsonl` | `https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/beads.jsonl` |
| `IMPLEMENTATION_PLAN.md` | `https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/IMPLEMENTATION_PLAN.md` |
| `APP_FLOW.md` | `https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md` |
| `COLD_READ_AUDIT_REPORT.md` | `https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/COLD_READ_AUDIT_REPORT.md` |
| `GOVERNANCE_MANIFEST.md` | `https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/governance/GOVERNANCE_MANIFEST.md` |
