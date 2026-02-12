# Implementation Plan: ProsDispatch MVP1

## OVERVIEW
*   **Project:** ProsDispatch MVP1
*   **Target Date:** MVP Launch (Week 8)
*   **Status:** Mid-Build (Foundation & Auth Complete, Core Features In Progress)
*   **Build Philosophy:** Documentation-First / Ralph Loop (Audit -> Plan -> Execute -> Verify). This plan bridges the current codebase with the target state defined in `MVP1_PRD.md`.

## PHASE 1: PROJECT SETUP & FOUNDATION [COMPLETED/VERIFY]

### Step 1.1: Verify Project Structure
*   **Goal:** Ensure codebase matches `TECH_STACK.md` standards.
*   **Status:** **COMPLETED**
*   **Verification:**
    *   [x] Vite + React 19 + TypeScript setup.
    *   [x] Supabase project initialized (`supabase/`).
    *   [x] `package.json` scripts aligned (`dev`, `build`, `test`, `lint`).
*   **Action Items:** None.

### Step 1.2: Environment Setup
*   **Goal:** Ensure developer environment is consistent.
*   **Status:** **COMPLETED**
*   **Verification:**
    *   [x] `.env` file structure defined in `TECH_STACK.md`.
    *   [x] `verify-env.sh` hook exists and runs.
*   **Action Items:** Ensure CI secrets match local `.env` variables.

### Step 1.3: Database Setup
*   **Goal:** Database schema matches `BACKEND_STRUCTURE.md`.
*   **Status:** **COMPLETED**
*   **Verification:**
    *   [x] `profiles` table with RLS.
    *   [x] `clients`, `properties` (Shadow Registry).
    *   [x] `jobs` with Enum status.
    *   [x] `invoices` with immutability triggers.
*   **Action Items:** Run `supabase db diff` to ensure no local drift.

## PHASE 2: DESIGN SYSTEM IMPLEMENTATION [VERIFY]

### Step 2.1: Verify Design Tokens
*   **Goal:** Tailwind config matches `FRONTEND_GUIDELINES.md`.
*   **Status:** **PARTIAL**
*   **Tasks:**
    1.  Audit `tailwind.config.js` against `FRONTEND_GUIDELINES.md`.
    2.  Update colors (`--color-primary-*`) and font families if mismatch found.
*   **Success Criteria:** `bg-primary-500` matches Brand Orange (#FF5C1B).

### Step 2.2: Core Components
*   **Goal:** Reusable UI components exist.
*   **Status:** **IN PROGRESS**
*   **Tasks:**
    1.  Verify `Button`, `Input`, `Card` in `src/components/ui/`.
    2.  Ensure Accessibility (Focus rings, Aria labels) per Guidelines.
*   **Success Criteria:** All form inputs use `React Hook Form` wrappers.

## PHASE 3: AUTHENTICATION SYSTEM [COMPLETED]

### Step 3.1: Backend Auth
*   **Goal:** Secure user management.
*   **Status:** **COMPLETED**
*   **Verification:**
    *   [x] Supabase Auth enabled.
    *   [x] `profiles` trigger on signup (`20241004...migration`).
    *   [x] RLS policies enforce isolation.

### Step 3.2: Frontend Auth
*   **Goal:** Login/Register flows.
*   **Status:** **COMPLETED** (Ref `APP_FLOW.md`)
*   **Verification:**
    *   [x] `useAuth` hook (fixed in recent pass).
    *   [x] Protected Routes (`/dashboard`, `/settings`).
    *   [x] Public Routes (`/login`, `/register`).

## PHASE 4: CORE FEATURES [IN PROGRESS]

### Step 4.1: Job Lifecycle Engine
*   **Goal:** Full State Machine (Draft -> Paid) per `MVP1_PRD.md`.
*   **Status:** **IN PROGRESS**
*   **Tasks:**
    1.  **Backend:** Verify `job_status` enum transitions.
    2.  **Frontend:** Connect `CreateJobForm` to `jobs` table (Optimistic Updates).
    3.  **Edge Function:** Implement `send-job-approval` (Email via Resend).
*   **Success Criteria:** Job created -> Email Sent -> Token generated -> Guest approves -> Status updates to `approved`.

### Step 4.2: Invoice Generation & Payment
*   **Goal:** Monetization flow (Stripe Connect).
*   **Status:** **PENDING**
*   **Tasks:**
    1.  **Edge Function:** `create-invoice-checkout` (Stripe Direct Charge).
    2.  **Frontend:** "Pay Now" button on Guest Invoice Page (`/pay/:id`).
    3.  **Webhook:** Handle `payment_intent.succeeded` -> Update Invoice to `paid`.
*   **Success Criteria:** Test payment in Stripe Mock -> DB updates to `paid` automatically.

### Step 4.3: SaaS Subscription
*   **Goal:** $20/mo Contractor Subscription.
*   **Status:** **PENDING**
*   **Tasks:**
    1.  **Edge Function:** `create-checkout-session` (Subscription mode).
    2.  **Frontend:** Billing Settings panel.
    3.  **Gate:** Middleware/RLS to block usage if `subscription_status != active` (Post-MVP refinement, but hooks needed now).

## PHASE 5: TESTING & REFINEMENT [URGENT]

### Step 5.1: Unit Test Stabilization
*   **Goal:** Green CI pipeline.
*   **Status:** **FAILING (SettingsPage)**
*   **Tasks:**
    1.  Fix `SettingsPage.test.tsx` (Mocking issue with `react-hook-form` reset).
    2.  Ensure `useAuth` mocks are robust.
*   **Success Criteria:** `npm test` returns 100% pass.

### Step 5.2: Integration Tests
*   **Goal:** E2E Critical Paths.
*   **Tools:** Playwright.
*   **Flows:**
    1.  Register -> Onboard -> Create Job.
    2.  Guest Approval Flow.
*   **Success Criteria:** Automated nightly run passes.

## PHASE 6: DEPLOYMENT

### Step 6.1: Staging Deployment
*   **Platform:** Render (Frontend) + Supabase (Backend Staging Project).
*   **Tasks:**
    1.  Connect GitHub Repo to Render.
    2.  Set Environment Variables (Staging Keys).
    3.  Deploy Edge Functions to Supabase Staging.
*   **Smoke Test:** Login and create a dummy job.

### Step 6.2: Production Launch
*   **Tasks:**
    1.  Promote Staging -> Prod (Supabase DB Migration).
    2.  Switch Stripe to Live Mode.
    3.  Domain mapping (`pro.prosdispatch.ca`).

## MILESTONES & TIMELINE

1.  **Foundation & Auth:** [DONE] - Week 1-2.
2.  **Core Job Engine:** [IN PROGRESS] - Week 3-4.
3.  **Payments & Invoicing:** [NEXT] - Week 5-6.
4.  **Testing & Polish:** Week 7.
5.  **MVP Launch:** Week 8.

## RISK MITIGATION

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Stripe Connect Verification** | Contractors can't receive funds. | Start verification UI early (Step 3.1). Use Test Mode extensively. |
| **Email Deliverability** | Homeowners don't get invites. | Use Resend + Verified Domain. Fallback to "Copy Link" UI. |
| **Schema Drift** | Production breaks on deploy. | Strict Migration Workflow (`supabase db diff`). No manual SQL. |

## SUCCESS CRITERIA (MVP)
*   [ ] Contractor can Sign Up & Connect Stripe.
*   [ ] Job can be created, sent, and approved by guest.
*   [ ] Invoice can be paid via Credit Card (Funds land in Connected Account).
*   [ ] CI/CD pipeline is green.
*   [ ] 0 Critical Security Vulnerabilities (audit `npm audit`).
