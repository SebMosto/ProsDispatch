## Cursor Context Files to Load

> Attach the following files as context in Cursor before working on this spec:

- `src/repositories/clientRepository.ts`
- `src/repositories/propertyRepository.ts`
- `src/hooks/useClients.ts`
- `src/hooks/useClientMutations.ts`
- `src/hooks/useProperties.ts`

---

# **SPEC-002: Client & Property Registry (Shadow System)**

**Version:** 1.2 (Canonical / Offline-Tolerant Aligned)  
**Status:** APPROVED (Aligned with SPEC-000)  
**Phase:** 1.2 (Foundational Data Layer)  
**Owner:** Codex (Implementation) / Gemini (Audit)  
**Dependencies:**

* SPEC-000\_Architecture\_Offline  
* SPEC-001 (Auth)  
* MVP1\_PRD.md

**Canonical Constraints:**  
No homeowner accounts · No phone numbers · No free-text notes · Soft deletes only · Mobile-first · i18n required · Data minimization enforced

---

## **1\. Feature Summary**

This specification defines the **Shadow Registry** system for **Clients** and **Properties**.

A Shadow Registry allows a **Contractor** to privately store client and property information required to perform work, **without creating Homeowner user accounts**.

**Shadow Doctrine (Binding):**

* All Client and Property records are:  
  * Owned exclusively by the Contractor  
  * Invisible to all other Contractors  
* If two Contractors work for the same homeowner, **two separate records will exist**.  
* Dispatch is a *processor*, not a canonical source of truth about people or buildings.

---

## **2\. Canonical Constraints (Binding)**

### **2.1 Data Isolation**

* Every row **MUST** include `contractor_id`  
* `auth.uid()` **MUST** equal `contractor_id` for all operations

### **2.2 Deletion Policy**

* **Soft deletes only** using `deleted_at`  
* Hard deletes are forbidden  
* Rationale: Tax integrity, audit trails, invoice provenance

### **2.3 Data Minimization (Privacy)**

* **Allowed:** Name, Email (optional), Address  
* **FORBIDDEN in MVP1:**  
  * Phone numbers  
  * Free-text notes  
  * Access codes or health information

### **2.4 Localization**

* Clients **MUST** store `preferred_language` (`en`, `fr`)  
* Required for Law 25–compliant automated communications later

### **2.5 Entity Types**

* Client type **MUST** distinguish:  
  * `individual` (B2C)  
  * `business` (B2B)  
* Required for future tax handling

---

## **3\. Data Model (Supabase)**

### **3.1 Enums**

create type client\_type as enum ('individual', 'business');  
create type supported\_locale as enum ('en', 'fr');

### **3.2 Table: `clients`**

create table clients (  
  id uuid primary key default gen\_random\_uuid(),

  contractor\_id uuid not null references auth.users(id),

  type client\_type not null default 'individual',  
  name text not null,  
  email text,  
  preferred\_language supported\_locale not null default 'en',

  created\_at timestamptz not null default now(),  
  updated\_at timestamptz not null default now(),  
  deleted\_at timestamptz  
);

create index clients\_contractor\_id\_idx on clients(contractor\_id);

### **3.3 Table: `properties`**

create table properties (  
  id uuid primary key default gen\_random\_uuid(),

  contractor\_id uuid not null references auth.users(id),  
  client\_id uuid not null references clients(id),

  address\_line1 text not null,  
  address\_line2 text,  
  city text not null,  
  province text not null,  
  postal\_code text not null,  
  country text not null default 'CA',

  nickname text,

  created\_at timestamptz not null default now(),  
  updated\_at timestamptz not null default now(),  
  deleted\_at timestamptz  
);

create index properties\_contractor\_id\_idx on properties(contractor\_id);  
create index properties\_client\_id\_idx on properties(client\_id);

**Note:**  
Province and postal code validation is enforced at the **application/Zod layer**, not the DB.

---

## **4\. Security & RLS (Row Level Security)**

**Doctrine:** Contractors must never see data belonging to others.

alter table clients enable row level security;  
alter table properties enable row level security;

create policy "clients\_isolation"  
on clients  
using (auth.uid() \= contractor\_id)  
with check (auth.uid() \= contractor\_id);

create policy "properties\_isolation"  
on properties  
using (auth.uid() \= contractor\_id)  
with check (auth.uid() \= contractor\_id);

**Soft Delete Rule:**  
All default queries **must** filter `deleted_at IS NULL`.

---

## **5\. Validation & Types (Zod)**

### **5.1 Client Validation**

* `name`: required, min 1 char  
* `email`: optional, valid email if present  
* `preferred_language`: `en` | `fr`  
* `type`: `individual` | `business`

### **5.2 Property Validation**

* `address_line1`: min 5 chars  
* `city`: required  
* `province`: one of Canadian provinces  
* `postal_code`: strict Canadian format (`A1A 1A1`)  
* `nickname`: optional

---

## **6\. UX Strategy (Mobile-First)**

### **6.1 Client Creation (Rolodex Flow)**

* Entry: “Clients” tab → FAB "+"  
* Screen: `CreateClientPage`  
* Fields:  
  * Type (Individual / Business)  
  * Name  
  * Preferred Language  
* **Address:** Google Places Autocomplete **with manual fallback**  
  * Address fields **must be populated via Google Places API selection where possible** to ensure billing accuracy.  
     Manual entry is permitted only as a fallback when autocomplete fails or is unavailable.  
* Province dropdown restricted to QC / ON **in UI only**

### **6.2 Inline Creation (Lazy Flow)**

* Used during Job creation  
* Component: `ClientPropertySelector`  
* If no match:  
  * “Create new client ‘X’”  
  * Drawer opens with minimal required fields  
  * On save → returns `client_id`, `property_id`

---

## **7\. Edge Cases & Integrity**

### **7.1 Duplicate Handling**

* Duplicate addresses **allowed**  
* UI may warn, DB must not block  
* We do not deduplicate across contractors

### **7.2 Soft Delete Behavior**

* Deleted clients/properties:  
  * Removed from active UI  
  * Remain for invoice/job history rendering  
* Required for tax audit compliance

---

## **8\. Testing Protocol**

### **8.1 Isolation Tests**

* Contractor A cannot see Contractor B’s clients or properties

### **8.2 Validation Tests**

* US ZIP codes rejected  
* Invalid province codes rejected

### **8.3 XSS Safety**

* Output must escape client names and addresses

---

## **9\. Implementation Notes**

* No homeowner claims in MVP1  
* No messaging  
* **Google Places Autocomplete (Required)**  
  * Address inputs must use Google Places Autocomplete to reduce billing errors and ensure professional invoice quality.  
  * Manual override is allowed to support edge cases (new builds, rural addresses, incomplete listings).  
* No phone numbers  
* Follow UX-Responsive-01

---

## **10\. Technical Implementation Mandates (Offline-Tolerant)**

**This section is binding and overrides any implicit online-only assumptions.**

### **10.1 Repository Pattern (Mandatory)**

* UI components **MUST NOT** call Supabase directly  
* All Client and Property access **MUST** go through:  
  * `ClientRepository`  
  * `PropertyRepository`  
* Direct `supabase.from('clients' | 'properties')` calls in components are **FORBIDDEN**

### **10.2 Draft Persistence (Mandatory)**

* Client and Property creation forms **MUST** use `usePersistentForm`  
* Draft inputs must persist in IndexedDB  
* Browser refresh **MUST NOT** lose user input

### **10.3 Optimistic UI (Mandatory)**

* Create / Update flows **MUST** use optimistic mutations  
* UI reflects success immediately  
* Network latency must not block form completion

### **10.4 Sync Status Indicators (Mandatory)**

* Client & Property forms **MUST** display `<SyncBadge />`  
* States:  
  * “Saved to device”  
  * “Synced to cloud”

### **10.5 Conflict Strategy (MVP1)**

* **Last-Write-Wins** is canonical  
* No conflict resolution UI  
* No server diffing  
* Draft vs Cloud distinction must be visible

### **10.6 Business Logic Preservation**

* Field definitions remain unchanged  
* Shadow Registry doctrine remains unchanged  
* Only the **technical execution path** has evolved

---

**End of Spec**

