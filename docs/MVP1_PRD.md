# **📘 MVP1 MASTER PRD — ProsDispatch**

**Version:** 1.1  
 **Status:** Canonical & Binding  
 **Prepared by:** PRD Architect v1.5  
 **Audited by:** Gemini (Chief Architect & Risk Auditor)  
 **Aligned With:**

* RESTART\_BRIEF\_ENTERPRISE.md

* SpecDoctrine (NCWAS)

* ACTION\_PLAN.md

* AUDIT\_README.md

* MultiAgentProtocol

* UX-Responsive-01

* Canada-Only \+ PIPEDA \+ Law 25

---

# **1\. Feature Summary**

ProsDispatch MVP1 is a **mobile-first SaaS platform for Canadian service providers**, focused on:

* Contractor account creation

* Client & property tracking (backend only via Shadow Registry)

* Job lifecycle management

* Homeowner invite \+ approval flow

* Direct Charges via Stripe Connect Standard

* Invoice generation (PDF)

* Email notifications (EN/FR-CA)

* Bilingual UI (EN/FR-CA)

**No homeowner accounts. No marketplace. No bidding. No escrow. No scheduling.**

---

# **2\. Non-Negotiable Constraints**

### **2.1 Canonical Architectural Constraints**

| Area | Requirement |
| ----- | ----- |
| Payments | Stripe Connect Standard — Direct Charges only |
| Amount of PII | Minimal; contractor \= controller, platform \= processor |
| Data Residency | Supabase (Canadian region not required for MVP1) |
| Frontend | React \+ Vite \+ Tailwind |
| Backend | Supabase (DB \+ Auth \+ RLS \+ Functions) |
| Notification Layer | Email only (Resend) |
| UX | Mobile-first → Tablet → Desktop (per UX-Responsive-01) |
| i18n | EN \+ FR-CA mandatory |
| Accessibility | WCAG 2.1 AA |
| Forbidden Features | Marketplace, Bidding, Proposals, Escrow, Wallets, Stored Payment Methods, Scheduling, SMS, Chat |

### **2.2 Legal & Privacy Boundaries**

* Only store data essential for:

  * Job execution

  * Record keeping

  * Tax compliance

* No silent analytics

* No intrusive tracking

* Consent screens must appear on onboarding

---

# **3\. In-Scope / Out-of-Scope Grid**

### **3.1 In Scope (MVP1)**

| Feature | Included |
| ----- | ----- |
| Contractor Signup/Login | ✔ |
| Contractor Profile | ✔ |
| Client \+ Property Schema (backend) | ✔ |
| Job Lifecycle (Draft → Archived) | ✔ |
| Homeowner Invite Link | ✔ |
| Homeowner Accept/Decline (guest token) | ✔ |
| Stripe Direct Charges (Pay Invoice) | ✔ |
| PDF Invoice Generation | ✔ |
| Contractor Dashboard (Active \+ History) | ✔ |
| Settings Page | ✔ (minimal) |
| Email Notifications | ✔ |
| i18n & A11y | ✔ |
| Admin Portal (placeholder only) | ✔ (minimal stub) |

---

### **3.2 Out of Scope (MVP1)**

These features are **explicitly forbidden**, per Auditor mandate:

| Feature | Status |
| ----- | ----- |
| Marketplace | ❌ |
| Contractor Discovery | ❌ |
| Proposals / Bidding | ❌ |
| Escrow / Wallets / Stored Payment Methods | ❌ |
| Invoicing builder UI | ❌ |
| Homeowner Accounts | ❌ |
| Homeowner Dashboard | ❌ |
| Scheduling / Calendar | ❌ |
| Chat / Messaging | ❌ |
| File uploads (photos, PDFs, docs) | ❌ |
| SMS notifications | ❌ |
| Advanced analytics | ❌ |
| Multi-provider workflows | ❌ |
| Contractor teams / roles | ❌ |
| Subscriptions & billing plans | ❌ |
| Inventory management | ❌ |

---

# **4\. User Roles**

### **4.1 Contractor (Primary MVP1 user)**

Capabilities:

* Create and manage profile

* Add clients & properties

* Create/edit jobs

* Send homeowner approval requests

* Generate invoices

* Take payments

* View job history

* Manage settings

### **4.2 Homeowner (Lightweight, token-based)**

Capabilities:

* View job summary (public token)

* Approve/Decline

* Complete payment (Stripe checkout)

No login, no dashboard, no profile.

### **4.3 Admin (Internal Only)**

MVP1 permits:

* Login via magic link

* View minimal metrics (active users, jobs)

* No actions beyond read-only

---

# **5\. MVP1 User Stories (Gherkin)**

### **Contractor Registration**

Given I am a new contractor    
When I provide my email, password, and business name    
Then my account is created    
And I am prompted to complete my profile  

### **Create Job**

Given I am logged in    
When I create a new job    
And specify client, property, service date, and description    
Then the job is saved in Draft state

### **Send Job to Homeowner**

Given a job is in Draft    
When I click "Send to Homeowner"    
Then an email link is sent via Resend    
And the job moves to Sent state

### **Homeowner Approval**

Given I receive an invite link    
When I open the link    
Then I can Approve or Decline    
And no login is required

### **Invoice Payment**

Given a job is Invoiced    
When the homeowner clicks "Pay Invoice"    
Then Stripe Checkout opens    
And funds go directly to the contractor

---

# **6\. UX Architecture (Per UX-Responsive-01)**

### **General Rules**

* Mobile-first

* Single-column core pages

* Tablet adds 2-column layouts for dashboard & job details

* Desktop uses centered container (max-width 1280px)

* Admin Portal \= Desktop-Optimized

### **Screens**

* Login/Register

* Dashboard (Active / History tabs)

* Job Create

* Job Detail

* Client/Property Select

* Invoice Preview

* Settings

---

# **7\. Data Architecture (Includes SHADOW REGISTRY)**

### **7.1 Core Entities**

* **contractors**

* **clients**

* **properties** ← SHADOW REGISTRY

* **jobs**

* **job\_events** (state transitions)

* **invoices**

### **7.2 Shadow Registry Definition**

A backend-only structure storing:

* Property ID

* Owner Name (string only, no profile)

* Address

* Metadata:

  * last\_service\_date

  * material notes

  * job count

  * contractor\_id

Used in MVP2 for "Claim Home Profile".

### **7.3 Job States (Canonical)**

Draft → Sent → Approved → In Progress → Completed → Invoiced → Paid → Archived

### **7.4 Minimal PII**

* homeowner\_name (string)

* homeowner\_email (string)

* address

* no phone numbers

* no photos/files

---

# **8\. API / RPC Requirements**

### **Required Supabase Functions:**

* `create_job()`

* `transition_job_state(job_id, new_state)`

* `create_invoice(job_id)`

* `record_payment(intent_id)`

### **Required Stripe Calls:**

* `stripe.paymentIntents.create` (connected account)

* `stripe.paymentIntents.confirm`

* **No customer creation**

* **No setup intents**

* **No saved cards**

---

# **9\. Validation Logic**

### **Jobs**

* description: required

* service\_date: required

* client\_id & property\_id: required

### **Properties**

* address\_line\_1: required

* city, province, postal\_code: required

* homeowner\_email optional but recommended

### **Billing**

* amount \>= 1

* currency \= CAD only

---

# **10\. Error Handling**

* User-facing errors must be localized (EN/FR-CA)

* Stripe errors: Show friendly fallback message

* Expired homeowner token: Show "Link expired" screen

---

# **11\. i18n Rules**

* All strings in `/i18n/en.json` and `/i18n/fr-CA.json`

* Notifications use `recipient_language` field

* FR-CA uses Quebecois phrasing per memory

---

# **12\. Security Model**

* RLS enabled on **every** table

* Contractors can only access rows they own

* Homeowner token access \= SELECT only via signed URL policies

* No admin bypass tables

---

# **13\. Compliance Boundary**

### **Store Only:**

* Name

* Email

* Address

* Job details

* Invoice details

### **Prohibited:**

* Photos

* IDs

* Payment card details

* Phone numbers (unless specifically allowed later)

* Behavioral analytics

---

# **14\. Future Roadmap (Not MVP1)**

* Homeowner Accounts

* Full Home Profile Dashboard

* In-app messaging

* Calendar/scheduling

* AI job estimator

* Contractor mobile app wrapper

* Reviews & ratings

* Team roles

* Contractor marketplace

* Material catalog

* Smart home integrations

---

# **15\. Risks**

| Risk | Mitigation |
| ----- | ----- |
| Overbuilding | Strict NCWAS enforcement |
| Scope creep | Explicit Out-of-Scope list |
| i18n drift | CI parity scripts |
| Stripe misuse | API surface constraints |
| Data bloat | Minimal PII rules |
| Homeowner confusion | Simplified UI \+ email first |

---

# **16\. Implementation Order (MVP1 Execution)**

1. Auth \+ Profile

2. Client \+ Property (Shadow Registry)

3. Job Engine \+ State Machine

4. Invite Flow

5. Invoice Generator

6. Stripe Checkout

7. Email Notifications

8. Dashboard (Active/History)

9. Settings

10. Admin Portal (read-only)

11. i18n

12. A11y

13. Final Audit

---

# **🚀 MVP1 Master PRD Completed**

This is now the **canonical root document** for the entire build.

Next steps:

1. Auditor (Gemini) validates this PRD

2. We proceed with the first SPEC: **Auth & Profiles**

3. Codex begins implementation

4. Lovable handles UI scaffolding where PRDs permit

Whenever you're ready:

**"Begin SPEC: Auth & Profiles."**

