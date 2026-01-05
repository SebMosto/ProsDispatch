# **ARCHIVED_SPEC-002: Client & Property Registry (Shadow System) <ARCHIVED>** 

**Status:** APPROVED (Post-Audit Patch v1.2)  
 **Phase:** 1.2  
 **Owner:** Codex (Implementation) / Gemini (Audit)  
 **Dependencies:** SPEC-001 (Auth)

---

## **1\. Feature Summary**

This specification defines the **Shadow Registry** system. It allows **Contractors** to manage their own private database of **Clients** and **Properties**.

**Crucial Distinction:** In MVP1, **Homeowners do not have user accounts.** A “Client” is a record **owned entirely by the Contractor**. If Contractor A and Contractor B both work for the same Homeowner, they will create **two separate, isolated records** in the database.

---

## **2\. Canonical Constraints**

* **Isolation:** Data is strictly siloed. `auth.uid()` must match `contractor_id` on every row.

* **Deletion Policy:** **Soft Deletes Only (`deleted_at`)**. Hard deletes are forbidden to ensure tax integrity and audit trails (provenance for invoices).

* **Localization:** Clients must have a `preferred_language` (`'en'` or `'fr'`) to ensure Law 25 compliance for future automated communications.

* **Entity Types:** Must distinguish between `individual` (B2C) and `business` (B2B) for future tax handling.

* **Data Minimization:**

  * Allowed: **Name, Email (optional), Address**

  * **FORBIDDEN:** Phone numbers (MVP1 scope/privacy restriction)

---

## **3\. Data Model (Schema)**

### **3.1 SQL Definitions (Patched)**

`-- 1. Create Enums for strict typing`  
`create type client_type as enum ('individual', 'business');`  
`create type supported_locale as enum ('en', 'fr');`

`-- 2. Clients Table (With Soft Delete & Language)`  
`create table clients (`  
  `id uuid primary key default gen_random_uuid(),`  
  `contractor_id uuid not null references auth.users(id),`  
  `type client_type not null default 'individual',`  
  `name text not null,`  
  `email text,`  
  `preferred_language supported_locale not null default 'en',`

  `created_at timestamptz not null default now(),`  
  `updated_at timestamptz not null default now(),`  
  `deleted_at timestamptz -- Soft Delete for Tax Integrity`  
`);`

`-- 3. Properties Table (With Soft Delete & Future Proofing)`  
`create table properties (`  
  `id uuid primary key default gen_random_uuid(),`  
  `contractor_id uuid not null references auth.users(id),`  
  `client_id uuid not null references clients(id),`

  `address_line1 text not null,`  
  `address_line2 text,`  
  `city text not null,`  
  `province text not null, -- No DB Constraint (handled in App/Zod)`  
  `postal_code text not null,`  
  `nickname text,`

  `created_at timestamptz not null default now(),`  
  `updated_at timestamptz not null default now(),`  
  `deleted_at timestamptz -- Soft Delete for Tax Integrity`  
`);`

`-- 4. Indexes`  
`create index clients_contractor_id_idx on clients(contractor_id);`  
`create index properties_contractor_id_idx on properties(contractor_id);`  
`create index properties_client_id_idx on properties(client_id);`

---

## **4\. Security & RLS (Row Level Security)**

**Security Doctrine:** A Contractor must **NEVER** see data belonging to another Contractor.

### **4.1 Policies**

* **Enable RLS:** `ALTER TABLE clients ENABLE ROW LEVEL SECURITY;`

* **Enable RLS:** `ALTER TABLE properties ENABLE ROW LEVEL SECURITY;`

* **Standard Policy (Isolation):**

`USING (auth.uid() = contractor_id)`  
`WITH CHECK (auth.uid() = contractor_id)`

**Applies to:** SELECT, INSERT, UPDATE, DELETE

**Note on Soft Deletes:** The application query layer (Supabase JS) is responsible for filtering `deleted_at IS NULL` by default, unless the user is viewing “Archived/Deleted” records.

---

## **5\. TypeScript & Validation (Zod)**

### **5.1 Zod Schemas (Patched)**

`import { z } from 'zod';`

`// Full list for DB validity, UI can filter to ['QC', 'ON']`  
`export const CANADIAN_PROVINCES = [`  
  `'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'`  
`] as const;`

`export const ClientSchema = z.object({`  
  `type: z.enum(['individual', 'business']).default('individual'),`  
  `name: z.string().min(1, "Name is required"),`  
  `email: z.string().email("Invalid email").optional().or(z.literal('')),`  
  `preferred_language: z.enum(['en', 'fr']).default('en'),`  
`});`

`export const PropertySchema = z.object({`  
  `address_line1: z.string().min(5, "Address too short"),`  
  `address_line2: z.string().optional(),`  
  `city: z.string().min(2, "City required"),`  
  `province: z.enum(CANADIAN_PROVINCES),`  
  `postal_code: z.string().regex(`  
    `/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,`  
    `"Invalid Format (A1A 1A1)"`  
  `),`  
  `nickname: z.string().optional(),`  
`});`

`// Composite for "Add New Client & Property" flow`  
`export const ClientAndPropertySchema = ClientSchema.merge(PropertySchema);`

---

## **6\. UX/UI Strategy (Mobile-First)**

### **6.1 Scenario A: New Client (The "Rolodex" Flow)**

* **Entry:** “Clients” Tab → FAB “+”

* **Screen:** `CreateClientPage`

* **Fields:**

  * **Type:** Segmented Control `[Individual | Business]` (Default: Individual)

  * **Name:** “John Doe” or “Acme Inc”

  * **Language:** Dropdown `[English | Français]` (Default: English)

  * **Address:** Standard fields (manual entry only)

  * **Province:** Dropdown restricted to `QC` and `ON` **in UI only** for MVP1; schema remains Canada-wide.

**Address Auto-complete:** OUT OF SCOPE for MVP1.

### **6.2 Scenario C: The "Lazy" Flow (Job Creation Context)**

* **Component:** `ClientPropertySelector.tsx`

* **Interaction:**

  1. User types “Robert” in client field

  2. No results

  3. Selects “Create new client ‘Robert’”

  4. **Sheet/Drawer Opens:** minimal required fields (Name, Language, Address)

  5. **Save:** returns new `client_id` and `property_id` to Job Form

---

## **7\. Edge Cases & Integrity**

### **7.1 Duplicate Prevention (The Shadow Rule)**

* **Scenario:** Contractor A adds “123 Main St”. Contractor B adds “123 Main St”.

* **Resolution:** Both inserts **succeed**. We are a processor, not a controller of the “truth” of the house.

* **Internal Duplicates:** UI should warn if a Contractor creates a duplicate address, but DB allows it.

### **7.2 Deletion Logic (Soft Deletes)**

* **Scenario:** Contractor deletes a Client who has paid Invoices.

* **Mechanism:** `UPDATE clients SET deleted_at = NOW() WHERE id = ...`

* **Outcome:**

  * Client disappears from “Active Clients”

  * Job/Invoice history remains intact (the “Ghost” record)

  * Invoice PDF still renders the client name/address because the row exists

  * Satisfies tax audit requirements where source documents must not vanish

---

## **8\. Implementation Plan**

1. **DB Migration:** Create enums (`client_type`, `supported_locale`) and tables (`clients`, `properties`) with `deleted_at`.

2. **Types:** Run `supabase gen types` to generate strict TypeScript definitions.

3. **Store:** Create `useClients` hook with default filter `.is('deleted_at', null)`.

4. **UI:** Build `ClientForm` with Language \+ Type selectors.

5. **Validation:** Ensure Zod schemas match strict types.

<THIS DOCUMENT HAS BEEN ARCHIVED AND REPLACED WITH: SPEC-002: Client & Property Registry>
