# Product Requirements Document (PRD): ProsDispatch MVP1

## 1. PROBLEM STATEMENT
Canadian independent service contractors (e.g., HVAC, plumbing, electrical) struggle with fragmented business operations. They rely on disjointed tools for client management, job tracking, and invoicing, often leading to lost revenue, administrative overhead, and poor customer experiences. Existing solutions are either too complex (enterprise software), US-centric (ignoring Canadian tax/data laws), or focused on lead generation rather than operational efficiency. There is no simple, mobile-first, compliant platform that handles the core "job-to-payment" lifecycle without the bloat of a full CRM or marketplace.

## 2. GOALS & OBJECTIVES
1.  **Launch a Compliant Canadian Platform:** Deliver a fully functional SaaS platform that strictly adheres to Canadian data privacy (PIPEDA, Law 25) and tax regulations (GST/HST/QST) by Q4 2024.
2.  **Streamline Job-to-Payment:** Enable contractors to go from "Job Draft" to "Money in Bank" using Stripe Connect Direct Charges, reducing administrative time by 50%.
3.  **Enforce strict Scope Discipline:** Deploy MVP1 with zero "feature creep" (no marketplace, no bidding, no homeowner accounts), ensuring a stable, focused product.
4.  **Achieve Technical Stability:** Maintain >99.9% uptime and <2s page load times on mobile networks to support field usage.
5.  **Monetize Effectively:** successfully enroll contractors in a $20/month SaaS subscription plan using Stripe Billing.

## 3. SUCCESS METRICS
1.  **Time-to-Payment:** Average time from "Job Completed" to "Payment Received" < 48 hours.
2.  **Adoption Rate:** >75% of registered contractors complete at least one paid job within 14 days of onboarding.
3.  **Support Volume:** < 1 support ticket per 50 completed jobs (indicating intuitive UX).
4.  **System Reliability:** 0 critical bugs related to payment processing or data loss in the first 30 days.
5.  **Subscription Conversion:** >40% of trial users convert to paid monthly subscriptions.

## 4. TARGET PERSONAS

### Persona A: The Independent Contractor (Primary)
*   **Demographics:** Male/Female, 25-55, Canadian resident, English or French speaker.
*   **Role:** Owner-operator or small team lead (1-5 employees).
*   **Technical Proficiency:** Moderate. Comfortable with smartphones/apps but dislikes complex desktop software.
*   **Pain Points:**
    *   Chasing clients for payments.
    *   losing track of job details in text messages.
    *   Complicated tax calculations.
    *   Fear of "marketplace" apps taking a cut of their hard-earned money.
*   **Goals:** Get paid faster, look professional, spend less time on paperwork.

### Persona B: The Homeowner (Secondary/Guest)
*   **Demographics:** Canadian homeowner, 30-70.
*   **Role:** Service recipient.
*   **Technical Proficiency:** Varied (Low to High).
*   **Pain Points:**
    *   Unclear invoices.
    *   Sketchy payment methods (cash/e-transfer requests without receipts).
    *   Lack of communication about job status.
*   **Goals:** Easy approval of work, secure payment, clear digital record of service.

## 5. FEATURES & REQUIREMENTS

### P0 (Must-Have - MVP1)
1.  **Contractor Authentication & Profile:**
    *   *Description:* Secure email/password login and profile management (Business Name, Tax ID).
    *   *User Story:* As a contractor, I want to create an account and set up my business profile so I can start managing jobs.
    *   *Acceptance Criteria:* Email verification required; Profile data persists; "Business Name" appears on invoices.
    *   *Metric:* 100% successful sign-ups.

2.  **Client & Property "Shadow Registry":**
    *   *Description:* Backend-only storage of client/property data linked to contractors.
    *   *User Story:* As a contractor, I want to save client addresses so I don't have to re-type them for every job.
    *   *Acceptance Criteria:* Address validation (Google Maps); Multiple properties per client; No "Homeowner Account" creation.
    *   *Metric:* < 5% address entry errors.

3.  **Job Lifecycle Management:**
    *   *Description:* State machine handling Draft -> Sent -> Approved -> In Progress -> Completed -> Invoiced -> Paid -> Archived.
    *   *User Story:* As a contractor, I want to track the status of my jobs so I know what needs attention.
    *   *Acceptance Criteria:* Strict state transitions; Visual badges for states; Filtering by "Active" vs "History".
    *   *Metric:* 100% of jobs follow valid state transitions.

4.  **Stripe Connect & Direct Charges:**
    *   *Description:* Integration with Stripe for contractor onboarding (KYC) and direct payment processing.
    *   *User Story:* As a contractor, I want to link my bank account so payments go directly to me.
    *   *Acceptance Criteria:* Successful Stripe Connect onboarding; Payments routed correctly; Application fee deduction supported.
    *   *Metric:* 100% payment success rate.

5.  **PDF Invoicing & Email Notifications:**
    *   *Description:* Auto-generated PDF invoices sent via email (Resend) with "Pay Now" links.
    *   *User Story:* As a contractor, I want to send professional invoices to clients so I look trustworthy.
    *   *Acceptance Criteria:* PDF includes tax breakdown; Emails are bilingual (EN/FR); "Pay Now" link works.
    *   *Metric:* < 2% bounce rate on emails.

### P1 (Should-Have - Post-MVP)
1.  **Dashboard Analytics (Basic):** Simple charts for revenue and job volume.
2.  **Expense Tracking:** Basic logging of material costs per job.
3.  **Customer Import:** CSV upload for bulk client addition.

### P2 (Nice-to-Have - Future)
1.  **Homeowner Portal:** Dedicated account for homeowners to view service history.
2.  **Scheduling/Calendar:** Drag-and-drop job scheduling.
3.  **Team Management:** Multi-user accounts for larger crews.

## 6. EXPLICITLY OUT OF SCOPE
1.  **Marketplace/Lead Gen:** No browsing for contractors or posting "help wanted" ads.
2.  **Bidding/Proposals:** No competitive bidding process.
3.  **Escrow:** No holding funds; payments are direct.
4.  **In-App Messaging/Chat:** Communication is via email notifications only.
5.  **Scheduling:** No calendar view or booking engine.
6.  **Mobile App (Native):** Web-only (PWA capable) for MVP1.
7.  **Inventory Management:** No tracking of parts/stock.
8.  **Offline Mode (Full):** MVP1 requires internet connection.

## 7. USER SCENARIOS

### Scenario 1: The "Quick Fix" Job
*   **Context:** Contractor is at a client's house for an emergency repair.
*   **Action:** Contractor opens app -> Creates "Draft" job with client details -> Adds line items -> Clicks "Send".
*   **System:** Sends email to Homeowner with "Approve" link.
*   **Action:** Homeowner clicks link -> Reviews details -> Taps "Approve".
*   **System:** Updates job to "Approved" -> Notifies Contractor.
*   **Action:** Contractor completes work -> Marks job "Completed" -> Generates Invoice -> Sends.
*   **Outcome:** Homeowner pays via Stripe; Contractor receives funds; Job archived.

### Scenario 2: Onboarding a New Contractor
*   **Context:** A plumber hears about ProsDispatch and wants to try it.
*   **Action:** Visits sign-up page -> Enters email/password -> Verifies email.
*   **System:** Creates account -> Prompts for "Business Profile".
*   **Action:** Enters business name, address, tax ID -> Clicks "Connect Stripe".
*   **System:** Redirects to Stripe Connect -> Returns on success -> Enrolls in SaaS Subscription.
*   **Outcome:** Contractor is fully active and ready to create first job.

### Scenario 3: French-Speaking User
*   **Context:** A contractor in Quebec uses the app.
*   **Action:** Selects "Français" in settings.
*   **System:** UI updates to French -> Tax settings default to GST/QST.
*   **Action:** Sends job to Anglophone client.
*   **System:** Detects client preference (if set) or allows manual toggle -> Sends email in English.
*   **Outcome:** Seamless bilingual experience compliant with language laws.

## 8. NON-FUNCTIONAL REQUIREMENTS
1.  **Performance:** API response time < 200ms; Dashboard load < 1s.
2.  **Security:** RLS (Row Level Security) on all database tables; No PII in logs; SOC2 compliant infrastructure (Supabase/Stripe).
3.  **Accessibility:** WCAG 2.1 AA compliance (contrast, touch targets, screen reader support).
4.  **Scalability:** Architecture supports 10,000 concurrent users without degradation.
5.  **Localization:** Hard constraint on EN/FR-CA support for all UI and notifications.

## 9. DEPENDENCIES & CONSTRAINTS
*   **Tech Stack:** React, Vite, Tailwind (Frontend); Supabase (Backend/Auth/DB); Deno (Edge Functions).
*   **External APIs:** Stripe (Payments/Connect/Billing); Resend (Email); Google Maps (Address Autocomplete).
*   **Legal:** PIPEDA (Data Privacy); Law 25 (Quebec Privacy); CRA (Tax compliance).
*   **Device:** Must function on iOS Safari and Android Chrome (Mobile Web).

## 10. TIMELINE
*   **Phase 1 (Weeks 1-2):** Auth, Profiles, Shadow Registry (Client/Property).
*   **Phase 2 (Weeks 3-4):** Job Lifecycle Engine, State Machine, Invoicing Logic.
*   **Phase 3 (Weeks 5-6):** Stripe Integration (Connect + Billing), Payments.
*   **Phase 4 (Week 7):** Notifications, i18n, Polish.
*   **MVP Launch:** Week 8.
