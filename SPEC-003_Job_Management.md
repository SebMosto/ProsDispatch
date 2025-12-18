# **✅ docs/specs/SPEC-003\_Job\_Management.md**

\# SPEC-003: Job Management (MVP1)

\*\*Version:\*\* 1.1 (Canonical / Post-Auditor Decisions)  
\*\*Status:\*\* APPROVED for Implementation  
\*\*Phase:\*\* 1.3 (Core Mechanics)  
\*\*Owner:\*\* Codex (Implementation) / Gemini (Audit)  
\*\*Dependencies:\*\* SPEC-001 (Auth), SPEC-002 (Client & Property Registry), MVP1\_PRD.md  
\*\*Canonical Constraints:\*\* No bidding, no homeowner accounts, no scheduling UI, email-only, mobile-first, i18n required

\---

\#\# 1\. Feature Summary

This specification defines the MVP1 \*\*Contractor Job Management\*\* system.

Jobs are internal contractor records used to:  
\- Track work for a given \*\*Client\*\* and \*\*Property\*\* (Shadow Registry)  
\- Manage a minimal, canonical lifecycle  
\- Prepare for future steps (Invite/Assign, Invoicing, Payments) without introducing those systems yet

\*\*MVP1 Shadow System Rule:\*\* Homeowners do not interact with the database. “Sent” and “Approved” are contractor-driven toggles.

\---

\#\# 2\. Canonical Decisions (Binding)

\#\#\# 2.1 Description Field (Allowed with Compliance Warning)  
\- \*\*Decision:\*\* Keep free-text \`description\` field  
\- \*\*Constraint:\*\* UI must display microcopy warning:  
  \- EN: “Do not include access codes or personal information.”  
  \- FR-CA: “N’inclus pas de codes d’accès ni de renseignements personnels.”

\#\#\# 2.2 State Enforcement Layer  
\- \*\*Decision:\*\* Application-layer enforcement (TypeScript/Zod helper)  
\- \*\*Mechanism:\*\* \`advanceJobStatus(current, target)\` with strict transition rules

\#\#\# 2.3 “Sent” & “Approved” Semantics  
\- \*\*Decision:\*\* Manual contractor toggle simulation  
\- \*\*Meaning:\*\*  
  \- \`sent\`: contractor indicates they sent details externally (email/text outside app)  
  \- \`approved\`: contractor indicates client verbally/externally approved

\#\#\# 2.4 Archive vs Delete  
\- \`archived\` is a valid job status and appears in History  
\- \`deleted\_at\` is a soft-delete timestamp and is hidden from all product UI (except raw DB/audits)

\#\#\# 2.5 Invoice Linkage  
\- \*\*Decision:\*\* Remove \`invoice\_id\` column entirely (defer to SPEC-004)

\#\#\# 2.6 Service Date  
\- Optional \`service\_date\` (date only, no time)  
\- Contractor-visible only  
\- No calendar UI

\---

\#\# 3\. Job Lifecycle (Canonical State Machine)

Statuses:  
\- \`draft\`  
\- \`sent\`  
\- \`approved\`  
\- \`in\_progress\`  
\- \`completed\`  
\- \`invoiced\` (exists for future readiness; not fully implemented in MVP1)  
\- \`paid\` (exists for future readiness; not fully implemented in MVP1)  
\- \`archived\`

Allowed transitions (application-enforced):

\- draft → sent  
\- sent → approved  
\- approved → in\_progress  
\- in\_progress → completed  
\- completed → invoiced (placeholder for SPEC-004)  
\- invoiced → paid (placeholder for SPEC-005)  
\- paid → archived  
\- completed → archived (allowed for “manual closeout”)  
\- in\_progress → archived (allowed only if explicitly confirmed in UI as “canceled/closed” in MVP1; see Edge Case Note)

\*\*Non-reversible rule:\*\* No backward transitions in MVP1.

\---

\#\# 4\. Data Model (Supabase)

\#\#\# 4.1 Table: \`jobs\`

\*\*Ownership:\*\* Contractor-owned records only.

\`\`\`sql  
\-- Enums  
create type job\_status as enum (  
  'draft',  
  'sent',  
  'approved',  
  'in\_progress',  
  'completed',  
  'invoiced',  
  'paid',  
  'archived'  
);

\-- Jobs table  
create table jobs (  
  id uuid primary key default gen\_random\_uuid(),

  contractor\_id uuid not null references auth.users(id),

  client\_id uuid not null references clients(id),  
  property\_id uuid not null references properties(id),

  title text not null,                \-- short label e.g., "Kitchen faucet"  
  description text,                   \-- allowed; UI must warn against PII

  status job\_status not null default 'draft',

  service\_date date,                  \-- optional; no time  
  created\_at timestamptz not null default now(),  
  updated\_at timestamptz not null default now(),  
  deleted\_at timestamptz              \-- soft delete only  
);

\-- Indexes  
create index jobs\_contractor\_id\_idx on jobs(contractor\_id);  
create index jobs\_client\_id\_idx on jobs(client\_id);  
create index jobs\_property\_id\_idx on jobs(property\_id);  
create index jobs\_status\_idx on jobs(status);

### **4.2 Referential Integrity (App-layer)**

Database does not enforce cross-table ownership beyond FK constraints.  
Application must enforce:

* property belongs to contractor  
* client belongs to contractor  
* property.client\_id matches selected client\_id

---

## **5\. Security & RLS**

**Doctrine:** Contractor must never see another contractor’s rows.

### **5.1 Enable RLS**

* Enable RLS on `jobs`  
* Policies follow `auth.uid() = contractor_id`

alter table jobs enable row level security;

create policy "jobs\_select\_own"  
on jobs for select  
using (auth.uid() \= contractor\_id);

create policy "jobs\_insert\_own"  
on jobs for insert  
with check (auth.uid() \= contractor\_id);

create policy "jobs\_update\_own"  
on jobs for update  
using (auth.uid() \= contractor\_id)  
with check (auth.uid() \= contractor\_id);

create policy "jobs\_delete\_own"  
on jobs for delete  
using (auth.uid() \= contractor\_id);

**Soft Delete Note:** UI and hooks must filter `deleted_at is null` by default.

---

## **6\. Validation Logic (Zod \+ Helpers)**

### **6.1 Job Input Rules**

* `title`: required, min 2 chars, max 80  
* `description`: optional, max 2,000 chars  
* `status`: controlled by helper transitions (not arbitrary)  
* `service_date`: optional; if present must be valid date string (YYYY-MM-DD)  
* `client_id`, `property_id`: required UUIDs  
* Ownership verification is required before insert/update (see Hooks)

### **6.2 Status Transition Helper**

All status changes must go through `advanceJobStatus()`.

---

## **7\. UX Specification (Mobile-first)**

### **7.1 Job List (Contractor)**

* Tabs:  
  * Active \= draft, sent, approved, in\_progress, completed  
  * History \= invoiced, paid, archived  
* Empty state: localized, with CTA “Create Job”

### **7.2 Job Detail**

* Shows:  
  * Client \+ Property  
  * Title  
  * Description (with warning shown on edit form, not on read view)  
  * Status pill  
  * Service date (optional)  
* Status action buttons (contextual):  
  * Draft: “Mark as Sent”  
  * Sent: “Mark as Approved”  
  * Approved: “Start Job”  
  * In Progress: “Mark as Completed”  
  * Completed: “Archive” (and later “Create Invoice” in SPEC-004)

### **7.3 Description Field Warning (Required Microcopy)**

Must show on edit/create form near description:

* `jobs.description_warning` (EN/FR-CA)

---

## **8\. Testing Protocol (Minimum)**

### **8.1 Unit Tests**

* `advanceJobStatus()` rejects illegal transitions  
* Zod schema rejects invalid title/description

### **8.2 Integration Tests**

* Insert job with client/property that belong to contractor succeeds  
* Insert job with client belonging to another contractor fails (RLS)  
* Update job status via helper only

### **8.3 RLS Tests**

* Contractor A cannot select Contractor B jobs (0 rows)  
* Contractor A cannot update Contractor B job

### **8.4 i18n Tests**

* Required keys exist in EN and FR-CA for Job UI strings

---

## **9\. Edge Cases & Notes**

* Duplicate jobs are allowed (contractor-defined)  
* Soft delete hides jobs everywhere in UI (Active \+ History)  
* “Cancel” is not a status in MVP1; if needed, allow `in_progress → archived` with an explicit UI confirmation (“Close job early”)

---

## **10\. Implementation Notes**

* No invoice\_id field  
* No homeowner access  
* No calendar UI  
* Strictly follow `UX-Responsive-01`

