**SPEC-004: Invoicing & Payments (MVP1)**

Version: 1.0  
Status: APPROVED (Auditor-Validated)  
Phase: 1.4 — Core Revenue  
Owner: Codex (Implementation) / Gemini (Audit)  
Dependencies:

* SPEC-000\_Architecture\_Offline  
* SPEC-003\_Job\_Management

\-----**0\. Canonical Summary**

This specification defines **Invoice creation, immutable PDF generation, and payment collection** for ProsDispatch MVP1.

This is the **highest-risk spec in the system**. Errors here can cause:

* Legal exposure  
* Tax non-compliance  
* Stripe account termination  
* Loss of contractor trust

Accordingly, the following principles are **NON-NEGOTIABLE**.

**Non-Negotiables**

1. **Money Direction**  
   * Dispatch **never** holds or touches funds.  
   * Homeowners pay **Contractors directly** via **Stripe Connect Standard (Direct Charges)**.  
2. **Invoice Immutability**  
   * Once an invoice is marked **SENT**, it is **locked forever**.  
   * No edits. No silent changes. No re-calculation.  
   * Errors are corrected by **VOID \+ DUPLICATE** only.  
3. **Shadow System**  
   * Homeowners do **not** have user accounts.  
   * Access is via **secure, expiring magic links**.  
4. **Online-Only Payments**  
   * Draft invoices may be created offline.  
   * **Payment state changes require online verification** (Stripe webhooks).

\-----**1\. Data Model**

**1.1 Table: `invoices`**

| Column | Type | Notes |
| ----- | ----- | ----- |
| id | uuid | Primary Key |
| job\_id | uuid | FK → jobs.id (One Job → Many Invoices) |
| contractor\_id | uuid | FK → auth.users.id (RLS owner) |
| invoice\_number | text | Sequential per contractor (e.g. INV-001) |
| status | enum | `draft`, `sent`, `paid`, `void`, `overdue` |
| date\_issued | date | Set at transition to SENT |
| date\_due | date | Default: Due on Receipt (Net-0) |
| subtotal | integer | Amount in **cents (CAD)** |
| tax\_data | jsonb | `[{ label, rate, amount }]` |
| total\_amount | integer | Final total in cents (CAD) |
| pdf\_url | text | Supabase Storage URL (immutable) |
| stripe\_payment\_intent\_id | text | Stripe PI reference |
| created\_at | timestamptz |  |

**Critical Constraint:**

* No `price`, `budget`, or `estimate` fields exist on Jobs.  
* All money lives **only** on Invoices.

\-----**1.2 Table: `invoice_items`**

| Column | Type | Notes |
| ----- | ----- | ----- |
| id | uuid | Primary Key |
| invoice\_id | uuid | FK → invoices.id |
| description | text | Line item description |
| quantity | numeric | Supports fractional units (e.g. 1.5 hours) |
| unit\_price | integer | Cents |
| amount | integer | quantity × unit\_price |

\-----**1.3 Table: `invoice_tokens` (Security Layer)**

| Column | Type | Notes |
| ----- | ----- | ----- |
| token | text | PK — High-entropy (UUIDv4 or NanoID) |
| invoice\_id | uuid | FK → invoices.id |
| expires\_at | timestamptz | Default: 30 days |
| opened\_at | timestamptz | First view timestamp |

**Purpose:**  
Allows public, unauthenticated invoice access **without leaking user data**.-----**2\. State Machine (Strict & Enforced)**

**2.1 DRAFT (Editable)**

* Contractor creates invoice  
* Line items editable  
* Offline-safe  
* Stored locally until sync

\-----**2.2 SENT (Locked / Immutable)**  
**Trigger:** Contractor clicks **“Finalize & Send”**

**Actions (Server-Side):**

1. Validate invoice data  
2. Calculate totals & taxes  
3. Generate PDF (Edge Function)  
4. Upload PDF to Supabase Storage  
5. Create secure invoice\_token  
6. Send email via Resend

**Constraints:**

* Invoice row becomes **READ-ONLY**  
* PDF is **frozen forever**

\-----**2.3 PAID (Final)**  
**Trigger:** Stripe webhook (`payment\_intent.succeeded`)

* Status updated server-side  
* UI reflects confirmed payment  
* Cannot be reversed

\-----**2.4 VOID (Dead Record)**  
**Trigger:** Contractor action

* Used to correct mistakes  
* Cannot be edited or revived  
* Must duplicate to create a new invoice

\-----**3\. Tax Logic (MVP1 — Explicit & Conservative)**

**3.1 Configuration (Contractor Settings)**  
Contractor must store:

* `tax\_gst\_rate` (e.g. 0.05)  
* `tax\_qst\_rate` (e.g. 0.09975)  
* Tax registration numbers (future display)

\-----**3.2 Calculation Algorithm**  
**Subtotal-Level Taxation (MANDATED)**

1. Sum all `invoice\_items.amount` → `subtotal`  
2. Apply tax rates to subtotal  
3. Round **half-up** to 2 decimals  
4. Store results in `tax\_data`  
5. Compute `total\_amount`

**Why:**  
Avoids penny-rounding drift that occurs with per-line taxation.-----**3.3 Tax Storage Rule**

* Taxes are **stored**, not recomputed  
* Historical invoices remain accurate even if rates change

\-----**4\. PDF Generation (Server-Side Only)**

**Strategy**

* **Client-side PDF generation is FORBIDDEN**  
* Mobile browsers are unreliable  
* Legal artifacts must be stable

**Implementation**

* Supabase **Edge Function**: `generate-invoice-pdf`  
* Generates PDF once, at SENT transition  
* Uploads to `storage/invoices/`  
* Returns immutable `pdf\_url`

\-----**5\. Stripe Integration (Direct Charges)**

**5.1 Platform Rule**

* Stripe Connect **Standard Accounts**  
* PaymentIntents created **on the Connected Account**  
* Funds go **directly to Contractor**

stripe.paymentIntents.create(  
  { ... },  
  { stripeAccount: contractor\\\_stripe\\\_id }  
)  
**5.2 Webhooks**

* Listen on Connect webhook endpoint  
* Verify Stripe signature  
* Idempotency enforced:  
* Ignore if invoice already marked PAID

\-----**6\. Security & RLS**

**6.1 Contractor Access**

* SELECT / INSERT / UPDATE invoices where:

auth.uid() \= contractor\\\_id

* UPDATE forbidden once status \!= draft

**6.2 Public Access (Homeowners)**

* No direct table access  
* Access only via token-based function

get\\\_invoice\\\_by\\\_token(token text)

* Validates token  
* Checks expiry  
* Returns invoice \+ items

\-----**7\. Offline & Sync Constraints**

* Draft invoices may be created offline  
* SENT / PAID transitions require online connectivity  
* UI must surface sync status clearly  
* No “fake paid” states allowed

\-----**8\. Implementation Plan (Codex)**

**8.1 Database**

* Create tables: invoices, invoice\_items, invoice\_tokens  
* Enable RLS  
* Add indexes on contractor\_id, job\_id, status

**8.2 Repository Layer**

* InvoiceRepository  
  * createDraft  
  * addItem  
  * finalizeAndSend (RPC)  
  * voidInvoice

**8.3 Edge Function**

* generate-invoice-pdf  
* Uses shared calculation logic  
* Produces identical HTML \+ PDF output

**8.4 UI**

* CreateInvoiceForm  
* InvoicePreview  
* PublicInvoiceView  
* Stripe “Pay Now” button (hosted checkout or Payment Element)

\-----**9\. Final Auditor Statement**

This specification:

* Eliminates silent invoice mutation  
* Avoids tax rounding errors  
* Removes escrow & treasury risk  
* Matches real-world accounting behavior  
* Keeps MVP scope contained

SPEC-004 is now GREEN.

End of Spec

