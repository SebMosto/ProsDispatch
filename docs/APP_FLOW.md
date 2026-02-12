# Application Flow: ProsDispatch MVP1

## Context
ProsDispatch MVP1 is a mobile-first SaaS platform for Canadian service contractors (HVAC, plumbing, etc.) to manage jobs, clients, and invoicing in a compliant, bilingual (EN/FR) environment. It features a "Shadow Registry" for client data and uses Stripe Connect for Direct Charges.

## 1. ENTRY POINTS
*   **Direct URL Access:**
    *   `pro.prosdispatch.ca` (Landing/Login)
    *   `pro.prosdispatch.ca/register` (New Contractor)
*   **Deep Links (Email Notifications):**
    *   **Homeowner:** "Approve Job" link (`/jobs/:id/approve?token=xyz`)
    *   **Homeowner:** "Pay Invoice" link (`/pay/:invoice_id?token=abc`)
    *   **Contractor:** "Job Update" notifications (links to `/jobs/:id`)
*   **Search Engines:** SEO-optimized landing page (Public).
*   **Stripe Redirects:** Returning from Stripe Onboarding or Billing Portal.

## 2. CORE USER FLOWS

### Flow A: Contractor Registration & Onboarding (Happy Path)
1.  **Landing Page:** User clicks "Get Started".
2.  **Sign Up:** Enter Email, Password.
    *   *Validation:* Valid email, strong password.
    *   *System:* Creates Auth User.
3.  **Profile Setup:** Enter Business Name, Tax ID (GST/HST), Address.
    *   *System:* Creates `profiles` row.
4.  **Stripe Connect:** User clicks "Connect Bank".
    *   *Action:* Redirects to Stripe Hosted Onboarding.
    *   *Return:* Redirects back to `/settings` with `stripe_account_id`.
5.  **SaaS Subscription:** User clicks "Subscribe ($20/mo)".
    *   *Action:* Redirects to Stripe Checkout (Subscription).
    *   *Return:* Redirects to `/dashboard`.
    *   *State:* Profile is now "Active".

### Flow B: Job Lifecycle (Draft -> Paid)
1.  **Create Job:** Contractor clicks "New Job" (Floating Action Button).
    *   *UI:* Select Client (or add new via Shadow Registry), Property, Service Date, Description.
    *   *System:* Creates Job in `draft` state.
2.  **Send to Homeowner:** Contractor reviews draft, clicks "Send for Approval".
    *   *System:* Generates unique token, sends email to Homeowner via Resend.
    *   *State:* Job -> `sent`.
3.  **Homeowner Approval (Guest):** Homeowner clicks email link.
    *   *UI:* Read-only Job Summary. Buttons: "Approve" / "Decline".
    *   *Action:* Click "Approve".
    *   *System:* Updates Job -> `approved`. Notifies Contractor.
4.  **Execution:** Contractor performs work.
    *   *Action:* Contractor marks job `in_progress`, then `completed`.
5.  **Invoicing:** Contractor clicks "Generate Invoice".
    *   *System:* Generates PDF, sends email to Homeowner.
    *   *State:* Job -> `invoiced`.
6.  **Payment:** Homeowner clicks "Pay Now" in email.
    *   *UI:* Stripe Checkout (hosted).
    *   *Action:* Homeowner pays via Credit Card.
    *   *System:* Webhook triggers -> Job `paid`. Funds sent to Contractor (Direct Charge).

### Error States & Edge Cases
*   **Stripe Connect Fail:** User returns from Stripe with error.
    *   *Display:* "Connection failed. Please try again."
    *   *Recovery:* Retry button.
*   **Token Expired:** Homeowner clicks old link.
    *   *Display:* "This link has expired. Please contact the contractor."
*   **Offline Mode:** User tries to save job without internet.
    *   *Display:* "No connection. Changes will serve when online." (Optimistic UI where possible, else block).

## 3. NAVIGATION MAP

*   **(Public)**
    *   `/` (Landing)
    *   `/login`
    *   `/register`
    *   `/pay/:invoice_id` (Guest Invoice)
    *   `/jobs/:id/approve` (Guest Approval)
*   **(Authenticated - Contractor)**
    *   `/dashboard` (Main)
        *   Tabs: Active / History
    *   `/jobs` (List)
        *   `/jobs/new`
        *   `/jobs/:id` (Detail)
            *   Action: Edit, Send, Invoice
    *   `/clients` (Shadow Registry List)
        *   `/clients/new`
        *   `/clients/:id` (Detail)
            *   `/clients/:id/properties/new`
    *   `/invoices` (List)
        *   `/invoices/:id` (Detail/PDF View)
    *   `/settings`
        *   Profile (Business Info)
        *   Billing (Stripe SaaS)
        *   Preferences (Language EN/FR)

## 4. SCREEN INVENTORY

| Route | Auth | Purpose | Key UI | Actions |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | Public | Entry | Email/Pass Form | Login -> Dashboard |
| `/register` | Public | Entry | Email/Pass Form | Sign Up -> Profile |
| `/dashboard` | Auth | Overview | Stats, Active Jobs List | FAB (New Job) |
| `/jobs/new` | Auth | Creation | Client Select, Date Picker | Save Draft |
| `/jobs/:id` | Auth | Management | Status Badge, Line Items | Send, Complete, Invoice |
| `/pay/:id` | Public | Payment | Invoice Summary, Stripe Element | Pay Now -> Success |
| `/settings` | Auth | Config | Profile Form, Stripe Status | Connect Stripe, Save |

## 5. DECISION POINTS

*   **IF** User is not logged in **THEN** Redirect to `/login` (except Public routes).
*   **IF** Contractor has not completed Stripe Connect **THEN** Show banner "Payments Disabled" on Dashboard.
*   **IF** Job is in `draft` **THEN** Allow "Edit".
*   **ELSE IF** Job is `sent` or `approved` **THEN** Lock critical fields (Client/Property).
*   **IF** Browser Language is `fr-CA` **THEN** Default UI to French **ELSE** English.

## 6. ERROR HANDLING

*   **404 Not Found:**
    *   *Display:* "Page not found" (Bilingual).
    *   *Action:* Button "Go to Dashboard".
*   **500 Server Error:**
    *   *Display:* "Something went wrong. Support has been notified."
    *   *Recovery:* Auto-retry for idempotent actions.
*   **Network Offline:**
    *   *Display:* Toast "You are offline. Check connection."
    *   *Constraint:* Disable "Send Email" and "Pay Now" actions.
*   **Permission Denied (RLS):**
    *   *Display:* "You do not have permission to view this resource."
    *   *Action:* Redirect to Dashboard.

## 7. RESPONSIVE BEHAVIOR

*   **Mobile:**
    *   Navigation: Bottom Tab Bar (Dashboard, Jobs, Clients, Settings).
    *   Lists: Card view (vertical scroll).
    *   Actions: Floating Action Button (FAB) for primary tasks.
*   **Tablet:**
    *   Navigation: Sidebar (Collapsible).
    *   Dashboard: 2-column grid (Stats + List).
*   **Desktop:**
    *   Navigation: Fixed Sidebar.
    *   Layout: Centered content max-width 1280px.
    *   Data Tables: Full columns for Job Lists.

## 8. ANIMATIONS & TRANSITIONS

*   **Page Transitions:** Instant (React Router default) or subtle Fade-in (0.2s ease-out).
*   **Modals:** Slide-up from bottom (Mobile) / Fade-in center (Desktop).
*   **Loading:** Skeleton loaders for Lists; Spinner for Buttons (during async actions).
*   **Success:** Toast notification (Top-right desktop, Bottom-center mobile) with checkmark animation.
