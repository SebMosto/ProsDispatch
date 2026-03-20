# QA Workflow Flows — ProsDispatch
**Execute in order. Refer to `QA_PASS_FAIL_CRITERIA.md` for pass/fail definitions.**

---

## Pre-Flight Check

Before running any flow, confirm:
- [ ] You have read `QA_AGENT_README.md` Step 1 (repo sync completed)
- [ ] You have your test contractor account credentials from the operator
- [ ] You are simulating a 390px mobile viewport throughout
- [ ] You know which beads were recently closed (from `beads.jsonl`)

---

## Flow 0 — Contractor Registration (run only if explicitly requested)

> **When to run:** Only when the operator asks you to test the onboarding flow from scratch. Skip if using the pre-provisioned test account.

**Spec reference:** [`docs/APP_FLOW.md` — Flow A](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md)

**Steps:**

1. Navigate to `https://pro.prosdispatch.com/register`
2. Enter a new test email and strong password. Click "Sign Up" (EN) or the equivalent FR button.
3. **Check:** Does the page redirect to a profile setup screen?
4. Enter: Business Name = "Plomberie Test", Address = "123 Rue de la Montagne, Montréal, QC H3G 1Z2", a fake Tax ID.
5. **Check:** Does the form validate postal code format (e.g. H3G 1Z2)?
6. Submit the profile form.
7. **Check:** Is there a Stripe Connect prompt / "Connect Bank" CTA?
8. **Check:** Is there a subscription prompt?
9. **Check:** Does the contractor end up at `/dashboard` after completing setup?

**Note on Stripe during registration:** Do NOT attempt to complete Stripe Connect or subscription checkout. These flows involve Stripe redirect and require live credentials. Just verify the CTAs exist and the UI does not error.

**Pass criteria:** Account created, profile saved, dashboard accessible, no broken states.

---

## Flow 1 — Login & Dashboard

**Spec reference:** [`docs/APP_FLOW.md` — Screen Inventory](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md)

**Steps:**

1. Navigate to `https://pro.prosdispatch.com/login`
2. Enter test account credentials (provided by operator). Submit.
3. **Check:** Redirected to `/dashboard` without error?
4. **Check:** Is the Bottom Tab Bar visible with 4 items: Dashboard / Jobs / Clients / Settings (or FR equivalents)?
5. **Check:** Is a Floating Action Button (FAB) visible for creating a new job?
6. **Check:** Does the dashboard show any existing jobs in an "Active" section?
7. **Check:** Is the overall background colour `#F9FAFB` (light grey), not white or another colour?
8. If a "Payments Disabled" banner appears (Stripe not connected), note it as expected behaviour. Do not file as a bug.
9. **Check language:** Is copy in the correct language (EN or FR per test account setting)?

**Unauthenticated redirect check:**
10. In a new tab, navigate to `https://pro.prosdispatch.com/dashboard` without logging in.
11. **Check:** Does the app redirect to `/login`?

---

## Flow 2 — Client & Property Creation (Shadow Registry)

**Spec reference:** [`docs/APP_FLOW.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md) — `/clients` routes

**Steps:**

1. From the Bottom Tab Bar, tap "Clients" (or FR: "Clients").
2. **Check:** Client list page loads at `/clients`. Empty state message visible if no clients exist?
3. Tap the "New Client" button (or FAB equivalent).
4. Enter:
   - Name: `Isabelle Gagnon`
   - Email: a valid test email address (required for job approval and invoice delivery)
   - Preferred language: `fr`
5. **Check:** Is there a preferred language field (EN/FR)? This is required for Law 25 compliance.
6. Submit the form.
7. **Check:** Client saved, appears in list, no error?
8. Open the new client. Tap "Add Property" (or equivalent).
9. Enter:
   - Address: `456 Avenue du Parc, Montréal, QC H2V 4E8`
10. **Check:** Does the address field validate or accept Canadian postal code format?
11. Submit. **Check:** Property saved and visible under the client?

**Note:** Client email is required for the job approval email flow in Flow 3. If the client has no email, note it as a blocker.

---

## Flow 3 — Job Lifecycle (Core Flow)

**Spec reference:** [`SPEC-003`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/SPEC-003_%20Job%20Management%20%28MVP1%29.md) — State Machine

This is the most critical flow. A failure here is always P0 or P1.

**State machine to verify:** `draft → sent → approved → in_progress → completed`

### 3a — Create a Draft Job

1. From the Dashboard or Jobs tab, tap the FAB or "New Job" button.
2. **Check:** Navigated to `/jobs/new`?
3. Fill in the form:
   - Client: Select `Isabelle Gagnon` (created in Flow 2)
   - Property: Select the Montréal property
   - Title: `Réparation robinet salle de bain`
   - Description: `Robinet qui goutte dans la salle de bain principale. Remplacement du joint nécessaire.`
   - Service date: Set to tomorrow's date
4. **Check:** Is a `<SyncBadge />` visible on this form? (Should show "Saved to device" or FR equivalent)
5. Submit (save as draft).
6. **Check:** Job appears in the Jobs list with status badge `Draft` (or FR: `Brouillon`)?
7. **Check:** Status pill colour matches design tokens (neutral, not green/red)?

### 3b — Send for Approval

1. Open the draft job from the Jobs list.
2. **Check:** Is the "Send for Approval" button (or FR equivalent) visible?
3. **Check:** Are critical fields (Client, Property) editable at this stage?
4. Tap "Send for Approval."
5. **Check:** Job status updates to `Sent` (or FR: `Envoyé`)? This should happen immediately (optimistic UI).
6. **Check:** Are Client and Property fields now locked (read-only)?
7. **Check:** Is there a success toast/notification? Does it follow brand voice (no "Great!" or emoji)?

### 3c — Homeowner Approval (Simulate)

> The actual approval happens via an email link to the homeowner. Since we are not accessing a real email inbox in this flow, **simulate the approval via the public URL**.

1. Check if there is an approval URL visible in the job detail (some implementations show the token URL for contractor reference). If yes, open it in a new tab.
2. Navigate to: `https://pro.prosdispatch.com/jobs/[job-id]/approve?token=[token]`
   - If you cannot find the token, note this as a P2 (contractor visibility of approval link is a UX consideration) and skip to 3c-manual.
3. **Check (as homeowner):** Does the page load showing a read-only job summary?
4. **Check:** Are "Approve" and "Decline" buttons present?
5. **Check:** Is the page accessible without login?
6. Tap "Approve."
7. **Check:** Confirmation shown to homeowner?
8. Return to the contractor view. Refresh the job.
9. **Check:** Job status updated to `Approved`? Contractor notified?

**3c-manual (if token not accessible):** Note inability to simulate approval and mark this step as SKIP with reason. Continue from 3d assuming approved status.

### 3d — Mark In Progress

1. Open the approved job.
2. **Check:** Is an "Mark In Progress" action available (and no other status options)?
3. Tap the action.
4. **Check:** Status updates to `In Progress` (FR: `En cours`)?
5. **Check:** Optimistic UI — does the badge update immediately without a full page reload?

### 3e — Mark Completed

1. From the `In Progress` job, tap "Mark Completed."
2. **Check:** Status updates to `Completed` (FR: `Terminé`)?
3. **Check:** Is a "Generate Invoice" CTA now visible?
4. **Check:** Is there any way to move the status backward? (There should not be — no backward transitions in MVP1.)

---

## Flow 4 — Invoice Creation & Send

**Spec reference:** [`SPEC-004`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/SPEC-004_%20Invoices%20%28MVP1%29.md) / [`docs/APP_FLOW.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md)

1. From the completed job, tap "Generate Invoice."
2. **Check:** Navigated to invoice creation screen?
3. Add at least 2 line items:
   - Item 1: `Main-d'œuvre`, quantity 2h, rate $85/h
   - Item 2: `Joint de remplacement`, quantity 1, rate $12
4. **Check:** Does the total calculate correctly? (2×85 + 12 = $182)
5. **Check:** Is GST/QST tax calculation visible? (Quebec contractors)
6. **Check:** Tax rates applied correctly: GST 5% + QST 9.975%?
7. Submit / "Create Invoice."
8. **Check:** Job status updates to `Invoiced`?
9. **Check:** Invoice appears in the Invoices list?
10. Open the invoice detail. Tap "Send Invoice."
11. **Check:** Confirmation that invoice was emailed to the client?
12. **Check:** Toast/notification copy follows RBQ brand voice?

---

## Flow 5 — Public Invoice View (Homeowner Perspective)

**Spec reference:** [`docs/APP_FLOW.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md) — `/pay/:invoice_id`

1. If the invoice has a token URL, navigate to: `https://pro.prosdispatch.com/pay/[invoice_id]?token=[token]`
2. **Check:** Page loads without requiring login?
3. **Check:** Invoice summary visible — line items, totals, tax breakdown?
4. **Check:** Contractor business name visible (professional presentation)?
5. **Check:** A "Pay Now" button is present?
6. **KNOWN STUB:** Do NOT tap "Pay Now." Per `COLD_READ_AUDIT_REPORT.md`, the Stripe Checkout integration is a placeholder (`console.log`). Tapping it will do nothing. Note this as a known stub, not a bug.
7. **Check:** Page is readable and professional on a 390px viewport? No horizontal scroll?
8. **Check:** Law 25 / data privacy language present somewhere on the page or footer?

---

## Flow 6 — Bilingual Check (FR)

**Spec reference:** [`Dispatch Language Style Guide`](https://raw.githubusercontent.com/SebMosos/ProsDispatch/main/Dispatch%20Language%20Style%20Guide%20%26%20Samples.md) / [`docs/governance/GOVERNANCE_MANIFEST.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/governance/GOVERNANCE_MANIFEST.md)

Bilingual support is a P0 requirement. Any untranslated English string in the French UI is a P0 finding.

1. Navigate to Settings. Find the language toggle.
2. **Check:** Is there a language preference field (EN / FR)?
3. Switch to French.
4. **Check:** UI updates to French throughout — navigation labels, button text, form labels, status badges?
5. Walk through the following screens in French and check copy:
   - Dashboard
   - Jobs list
   - Job detail (an existing job)
   - Clients list
   - Settings
6. For each screen, check:
   - **No raw English strings visible** in a French session
   - **No anglicismes** from the forbidden list: "jobs" (as a French word), "leads", "optimiser", "plateforme innovante"
   - **Correct French vocabulary**: travaux, dossiers, tableau de bord, entrepreneur
   - **Tone check**: No "Oups!", no emoji in system messages, no exclamation marks in functional copy
7. Check error states in French:
   - Try submitting a form with a missing required field.
   - **Check:** Error message is in French and follows the pattern: "Une information est manquante. Veuillez vérifier le formulaire." (not "Oops!")
8. Switch back to English. **Check:** UI restores to English fully?

**French text overflow check:**
9. On the Jobs list and any screen with status badges, **check for text overflow**. French text is typically 20–30% longer than English. Truncated labels or overflowing buttons are P1.

---

## Flow 7 — Offline / Network Behaviour

**Spec reference:** [`docs/APP_FLOW.md` — Error Handling](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md) / `SPEC-003` Section 11

> Simulate offline by using browser DevTools → Network → Offline (or equivalent).

1. Log in and navigate to the Jobs list.
2. Enable offline mode in the browser.
3. **Check:** Does an offline banner appear? (`OfflineBanner` component)
4. Try to open or interact with the Job Create form.
5. **Check:** Does the SyncBadge show "Saved to device" state?
6. Try to tap "Send for Approval" on a draft job.
7. **Check:** Is the Send action disabled or blocked with a clear message? (Sending email requires internet — this action should be blocked.)
8. Re-enable network.
9. **Check:** Does the app recover gracefully? Does the SyncBadge update to "Synced to cloud"?

---

## Flow 8 — Settings & Profile

**Spec reference:** [`docs/APP_FLOW.md` — `/settings`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md)

1. Navigate to Settings via the Bottom Tab Bar.
2. **Check:** The following sections are present:
   - Profile (Business Info) — business name, address, tax ID
   - Billing (Stripe status) — shows Connect status or "Not connected"
   - Preferences — language EN/FR toggle
3. Edit the business name. Save.
4. **Check:** Name updated without page reload? Toast confirmation?
5. **Check:** Is there any export / data download option (Law 25 requirement)?
6. **Check:** Is Stripe Connect status clearly communicated? (Connected / Not Connected / Action required)
7. **Check:** No broken layouts, no overflowing text on mobile?

---

## Regression Check — Recently Closed Beads

After completing Flows 1–8, return to your pre-test repo state note and verify each recently-closed bead specifically.

For each closed bead:
1. Identify what the fix was (PR description or bead acceptance criteria)
2. Find the relevant screen/flow
3. Confirm the fix is live on `pro.prosdispatch.com`
4. Record: `BEAD-XXX: VERIFIED` or `BEAD-XXX: NOT VERIFIED — [reason]`
