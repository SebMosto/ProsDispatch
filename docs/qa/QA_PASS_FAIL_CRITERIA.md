# QA Pass/Fail Criteria — ProsDispatch
**Reference during and after test execution. Updated by QA agent per `QA_SELF_UPDATE_PROTOCOL.md`.**

---

## Severity Definitions

| Level | Label | Meaning | Blocks release? |
|-------|-------|---------|-----------------|
| P0 | Blocker | App cannot ship. Core flow broken, data integrity at risk, or complete feature failure. | Yes |
| P1 | Serious | Significant UX, accessibility, or compliance issue. Likely to cause contractor abandonment or legal exposure. | Yes (before pilot) |
| P2 | Minor/Polish | Visual inconsistency, copy drift, or minor UX roughness that doesn't break a flow. | No (but track) |

---

## Global Pass/Fail Rules

These apply to every single flow. A violation at any point is filed at the severity shown.

| Check | Severity |
|-------|---------|
| Horizontal scroll on any non-table mobile screen | P0 |
| Authentication not enforced — protected route accessible without login | P0 |
| French UI contains raw English strings | P0 |
| Job status transition allows a backward move (e.g. sent → draft) | P0 |
| RLS violation — contractor sees another contractor's data | P0 |
| App crashes or throws unhandled JS error | P0 |
| Required field accepts empty submission without validation | P1 |
| Touch target below 44px height for any interactive element | P1 |
| Body text below 16px on mobile | P1 |
| SyncBadge missing from Job Create / Edit / Detail | P1 |
| Bottom Tab Bar missing or non-functional on mobile | P1 |
| Error message uses emoji, "Oops!", or exclamation in functional context | P1 |
| French copy uses forbidden anglicismes from style guide | P1 |
| French text overflow (truncated labels, overflowing buttons) | P1 |
| Brand Orange button colour deviates from `#FF5C1B` | P2 |
| Generic font (Arial, Roboto) in place of Inter | P2 |
| Inconsistent border radius (not 12px) | P2 |
| Consumer/startup aesthetic in component (purple gradient, bubbly UI) | P2 |

---

## Flow-Specific Criteria

### Flow 0 — Registration

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| `/register` route loads | Page renders, form visible | P0 |
| Form validation on email field | Invalid email rejected | P1 |
| After profile submit, profile row created | No DB error, redirect occurs | P0 |
| Stripe Connect CTA present | Button or link visible | P1 |
| Subscription CTA present | Button or link visible | P1 |
| End state is `/dashboard` | Redirected after full onboarding | P0 |

**PASS:** All P0 checks pass, P1 checks pass.  
**FAIL:** Any P0 fails.  
**CONDITIONAL PASS:** P0s pass, 1–2 P1s found (flag, do not block if pilot is imminent).

---

### Flow 1 — Login & Dashboard

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| Login with valid credentials | Redirect to `/dashboard` | P0 |
| Invalid credentials rejected | Error message shown, no access | P0 |
| Unauthenticated access to `/dashboard` | Redirect to `/login` | P0 |
| Bottom Tab Bar: 4 items visible | Dashboard, Jobs, Clients, Settings | P1 |
| FAB visible on dashboard | Button present and tappable | P1 |
| Background colour correct | `#F9FAFB` or `#F8FAFC` | P2 |
| "Payments Disabled" banner (if Stripe not connected) | Banner present, non-blocking | Expected — not a bug |

**PASS:** All P0 and P1 checks pass.

---

### Flow 2 — Client & Property Creation

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| Client list loads at `/clients` | Page renders | P0 |
| Empty state message if no clients | Friendly message in correct language | P2 |
| Client form: email field present and required | Field exists, required validation | P0 (email required for job approval) |
| Preferred language field present (EN/FR) | Field exists on client form | P1 (Law 25) |
| Client saved successfully | Appears in list | P0 |
| Property form accessible from client detail | CTA visible, form loads | P0 |
| Property address accepts Canadian postal code | H3G 1Z2 format accepted | P1 |
| Property saved and visible under client | Property listed | P0 |

**PASS:** All P0 and P1 checks pass.

---

### Flow 3 — Job Lifecycle

This is the most critical flow. Multiple P0 checks.

#### 3a — Create Draft

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| `/jobs/new` loads | Form renders | P0 |
| Client selector populated | Test client visible in dropdown | P0 |
| Property selector populated | Test property visible after client selected | P0 |
| Title field: min 2 chars, max 80 chars enforced | Validation works | P1 |
| Description field: max 2,000 chars | Validation works | P1 |
| SyncBadge present on form | "Saved to device" shown | P1 |
| Draft saved successfully | Status = `draft`, visible in list | P0 |
| Status badge colour: neutral (not green/red) | Correct colour token | P2 |

#### 3b — Send for Approval

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| "Send for Approval" button visible on draft | Button present | P0 |
| Status updates to `sent` after action | Optimistic update, then confirmed | P0 |
| Client and Property fields locked after send | Fields read-only | P1 |
| Toast/notification appears | Copy follows RBQ voice | P1 |
| No "back" option to draft status | No regression button | P0 |

#### 3c — Homeowner Approval

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| Public approval URL accessible without login | Page loads | P0 |
| Read-only job summary visible | Job details shown | P0 |
| Approve + Decline buttons present | Both CTAs visible | P0 |
| After approval, job status = `approved` | Status updated | P0 |
| No backward transition available | Cannot move from approved → sent | P0 |

#### 3d — Mark In Progress

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| "Mark In Progress" action available | Button/CTA visible | P0 |
| Status updates to `in_progress` | Optimistic update | P0 |
| Only contextually valid actions shown | No jump-to-paid option | P1 |

#### 3e — Mark Completed

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| "Mark Completed" action available | Button/CTA visible | P0 |
| Status updates to `completed` | Confirmed | P0 |
| "Generate Invoice" CTA appears | Visible after completion | P0 |
| No backward transitions available | Cannot undo completion | P0 |

**PASS:** All P0 checks pass across all 3a–3e sub-flows.  
**FAIL:** Any P0 check fails.

---

### Flow 4 — Invoice Creation & Send

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| Invoice creation screen accessible | From completed job | P0 |
| Line items: add/edit/remove works | At least 2 items, editable | P0 |
| Total calculates correctly | 2×85 + 12 = $182 | P0 |
| GST 5% calculated | $182 × 0.05 = $9.10 | P1 |
| QST 9.975% calculated | $182 × 0.09975 = $18.15 | P1 |
| Grand total correct | $182 + $9.10 + $18.15 = $209.25 | P0 |
| Invoice saved, job status → `invoiced` | Status updated | P0 |
| "Send Invoice" triggers email confirmation | Toast/confirmation shown | P1 |
| Invoice appears in Invoices list | Visible under `/invoices` | P0 |

**PASS:** All P0 and tax calculation checks pass.

---

### Flow 5 — Public Invoice View

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| Public invoice page loads without login | `/pay/:id?token=` accessible | P0 |
| Invoice summary: line items visible | All items shown | P0 |
| Tax breakdown visible | GST + QST shown separately | P1 |
| Contractor business name visible | Professionalism requirement | P1 |
| "Pay Now" button present | Button renders | P0 |
| Stripe Checkout NOT wired (known stub) | Button does nothing | Known — not a bug |
| No horizontal scroll on mobile | 390px viewport clean | P0 |
| Law 25 / privacy language present | Footer or note visible | P1 |

---

### Flow 6 — Bilingual Check

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| Language toggle in Settings | FR/EN switch present | P0 |
| Full UI updates to French | All visible strings translated | P0 |
| No raw English strings in FR mode | Zero English fragments | P0 |
| No forbidden anglicismes | "jobs", "leads", "optimiser" absent | P1 |
| Correct FR vocabulary | travaux, dossiers, tableau de bord | P1 |
| Error messages in FR follow RBQ tone | No "Oups!", no emoji | P1 |
| FR text no overflow | Labels, badges, buttons intact | P1 |
| Switch back to EN restores English | Complete restoration | P0 |

**PASS:** All P0 checks pass. P1 tone/vocabulary checks pass (at least 80% of screens reviewed).

---

### Flow 7 — Offline Behaviour

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| Offline banner appears when network disabled | `OfflineBanner` component visible | P1 |
| "Send for Approval" disabled offline | Action blocked with message | P1 |
| Job form accessible offline | Form renders from cache/IDB | P1 |
| SyncBadge shows "Saved to device" offline | Correct state indicator | P1 |
| App recovers when network restored | No manual refresh required | P1 |
| SyncBadge updates to "Synced to cloud" after restore | State confirmed | P1 |

**Note:** Full offline capability is infrastructure-ready but not fully tested in MVP1. P1 findings here are important for pilot but not ship-blockers if the core flows work online.

---

### Flow 8 — Settings & Profile

| Check | Expected | Severity if failed |
|-------|----------|-------------------|
| Settings page loads | All 3 sections visible | P0 |
| Profile edit + save works | Name updates, toast shown | P1 |
| Language preference visible | EN/FR toggle present | P0 |
| Stripe Connect status shown | Connected/Not connected clear | P1 |
| No horizontal scroll on settings mobile | Clean 390px layout | P0 |
| Export / data download option exists | Somewhere in settings | P1 (Law 25) |

---

## Known Issues Registry

Track known open issues here so they are not re-filed as new bugs each run. Update this table per `QA_SELF_UPDATE_PROTOCOL.md`.

| ID | Description | Location | Status | Bead |
|----|-------------|----------|--------|------|
| KI-001 | Stripe payment frontend not wired — `console.log` only | `PublicInvoicePage.tsx` ~line 106 | Open stub | — |
| KI-002 | SaaS subscription checkout pending | `/subscribe` | Pending — Phase 4.3 | — |

---

## Regression Table

After each run, update this table to show which previously-failed items are now resolved.

| Run Date | Item | Was Failing | Now Passing | Bead Closed |
|----------|------|-------------|-------------|-------------|
| [first run] | [populate after first test] | — | — | — |
