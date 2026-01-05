# **SPEC-003: Job Management (MVP1)**

**Version:** 1.2 (Canonical / Offline-Tolerant Aligned)  
 **Status:** APPROVED (Aligned with SPEC-000)  
 **Phase:** 1.3 (Core Mechanics)  
 **Owner:** Codex (Implementation) / Gemini (Audit)  
 **Dependencies:**

* SPEC-000\_Architecture\_Offline

* SPEC-001 (Auth)

* SPEC-002 (Client & Property Registry)

* MVP1\_PRD.md

**Canonical Constraints:**  
 No bidding · No homeowner accounts · No scheduling UI · Email-only semantics · Mobile-first · i18n required

---

## **1\. Feature Summary**

This specification defines the MVP1 **Contractor Job Management** system.

Jobs are internal contractor records used to:

* Track work for a given **Client** and **Property** (Shadow Registry)

* Manage a minimal, canonical lifecycle

* Prepare for future steps (Invoicing, Payments) without introducing those systems yet

**MVP1 Shadow System Rule:**  
 Homeowners do not interact with the database.  
 “Sent” and “Approved” are **contractor-declared states**, not system-verified events.

---

## **2\. Canonical Decisions (Binding)**

### **2.1 Description Field (Allowed with Compliance Warning)**

* **Decision:** Keep free-text `description`

* **Constraint:** UI must display warning microcopy:

  * EN: “Do not include access codes or personal information.”

  * FR-CA: “N’inclus pas de codes d’accès ni de renseignements personnels.”

### **2.2 State Enforcement Layer**

* **Decision:** Application-layer enforcement

* **Mechanism:** `advanceJobStatus(current, target)`

* Database triggers are explicitly forbidden for MVP1

### **2.3 “Sent” & “Approved” Semantics**

* **Decision:** Manual contractor toggles

* **Meaning:**

  * `sent`: contractor indicates details were sent externally

  * `approved`: contractor indicates client approved externally

### **2.4 Archive vs Delete**

* `archived` → valid lifecycle state, visible in History

* `deleted_at` → soft delete, hidden from all product UI

### **2.5 Invoice Linkage**

* **Decision:** No `invoice_id` column

* Invoicing is one-to-many and deferred to SPEC-004

### **2.6 Service Date**

* Optional `service_date`

* Date only (no time)

* Contractor-visible only

* No calendar UI

---

## **3\. Job Lifecycle (Canonical State Machine)**

**Statuses:**

* `draft`

* `sent`

* `approved`

* `in_progress`

* `completed`

* `invoiced` *(future-ready)*

* `paid` *(future-ready)*

* `archived`

**Allowed Transitions (Application-Enforced):**

* draft → sent

* sent → approved

* approved → in\_progress

* in\_progress → completed

* completed → invoiced *(SPEC-004)*

* invoiced → paid *(SPEC-005)*

* paid → archived

* completed → archived

* in\_progress → archived *(requires explicit UI confirmation)*

**Non-reversible:** No backward transitions in MVP1.

---

## **4\. Data Model (Supabase)**

### **4.1 Table: `jobs`**

`create type job_status as enum (`  
  `'draft',`  
  `'sent',`  
  `'approved',`  
  `'in_progress',`  
  `'completed',`  
  `'invoiced',`  
  `'paid',`  
  `'archived'`  
`);`

`create table jobs (`  
  `id uuid primary key default gen_random_uuid(),`

  `contractor_id uuid not null references auth.users(id),`  
  `client_id uuid not null references clients(id),`  
  `property_id uuid not null references properties(id),`

  `title text not null,`  
  `description text,`

  `status job_status not null default 'draft',`

  `service_date date,`  
  `created_at timestamptz not null default now(),`  
  `updated_at timestamptz not null default now(),`  
  `deleted_at timestamptz`  
`);`

`create index jobs_contractor_id_idx on jobs(contractor_id);`  
`create index jobs_client_id_idx on jobs(client_id);`  
`create index jobs_property_id_idx on jobs(property_id);`  
`create index jobs_status_idx on jobs(status);`

### **4.2 Referential Integrity (Application Layer)**

The database does **not** enforce cross-ownership checks beyond FKs.  
 The application **must** enforce:

* client belongs to contractor

* property belongs to contractor

* property.client\_id matches job.client\_id

---

## **5\. Security & RLS**

**Doctrine:** A contractor must never see another contractor’s data.

`alter table jobs enable row level security;`

`create policy "jobs_select_own"`  
`on jobs for select`  
`using (auth.uid() = contractor_id);`

`create policy "jobs_insert_own"`  
`on jobs for insert`  
`with check (auth.uid() = contractor_id);`

`create policy "jobs_update_own"`  
`on jobs for update`  
`using (auth.uid() = contractor_id)`  
`with check (auth.uid() = contractor_id);`

`create policy "jobs_delete_own"`  
`on jobs for delete`  
`using (auth.uid() = contractor_id);`

**Soft Delete Rule:**  
 All default queries must filter `deleted_at IS NULL`.

---

## **6\. Validation Logic (Zod \+ Helpers)**

### **6.1 Job Input Rules**

* `title`: required, min 2 chars, max 80

* `description`: optional, max 2,000 chars

* `status`: controlled only via helper

* `service_date`: optional `YYYY-MM-DD`

* `client_id`, `property_id`: required UUIDs

### **6.2 Status Transition Helper**

All status transitions must go through `advanceJobStatus()`.

---

## **7\. UX Specification (Mobile-First)**

### **7.1 Job List**

* **Active:** draft, sent, approved, in\_progress, completed

* **History:** invoiced, paid, archived

### **7.2 Job Detail View**

Displays:

* Client & Property

* Title

* Description

* Status pill

* Service date (if present)

Contextual actions only (no free-form status edits).

### **7.3 Description Warning**

Warning microcopy must appear on create/edit forms.

---

## **8\. Testing Protocol**

### **8.1 Unit Tests**

* Status transitions reject illegal moves

* Zod validation coverage

### **8.2 Integration Tests**

* Ownership enforcement

* RLS isolation

### **8.3 i18n**

* EN \+ FR-CA key parity enforced

---

## **9\. Edge Cases & Notes**

* Duplicate jobs allowed

* Soft-deleted jobs invisible everywhere

* No “Cancel” status in MVP1

---

## **10\. Implementation Notes**

* No pricing on jobs

* No invoices yet

* No homeowner access

* Follow UX-Responsive-01

---

## **11\. Technical Implementation Mandates (Offline-Tolerant)**

**This section is binding and overrides any implicit online-only assumptions.**

### **11.1 Repository Pattern (Mandatory)**

* UI components **MUST NOT** call Supabase directly.

* All Job data access **MUST** go through `JobRepository`.

* Direct `supabase.from('jobs')` calls in components are **FORBIDDEN**.

### **11.2 Draft Persistence (Mandatory)**

* The Create/Edit Job flows **MUST** use `usePersistentForm`.

* Draft data must persist in IndexedDB.

* Browser refresh or tab close **MUST NOT** lose data.

### **11.3 Optimistic UI (Mandatory)**

* Status transitions must use React Query optimistic mutations.

* UI updates immediately on user action.

* Network latency must not block state changes.

### **11.4 UX Sync Indicators (Mandatory)**

* Job Create, Edit, and Detail views **MUST** display `<SyncBadge />`.

* States:

  * “Saved to device”

  * “Synced to cloud”

### **11.5 Conflict Strategy (MVP1)**

* **Last-Write-Wins** is canonical.

* No conflict resolution modals.

* No server diffing.

* Explicit Draft vs Cloud distinction must remain visible.

### **11.6 Business Logic Preservation**

* Field definitions remain unchanged.

* Status lifecycle remains unchanged.

* Shadow Registry rules remain unchanged.

* Only the **technical execution** has evolved.

