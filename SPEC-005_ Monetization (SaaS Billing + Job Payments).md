# **SPEC-005: Monetization (SaaS Billing \+ Job Payments)**

**Version:** 1.0
**Status:** APPROVED (Canonical)
**Phase:** MVP1
**Owner:** Product / Architecture
**Dependencies:**

* SPEC-000\_Architecture\_Offline
* SPEC-001\_Auth\_and\_Profiles
* SPEC-003\_Job\_Management
* SPEC-004\_Invoicing

---

## **1\. Purpose & Scope**

This specification defines **all monetization mechanisms** in MVP1.

MVP1 supports **two strictly separated revenue flows**:

1. **SaaS Subscription Billing**
   *Contractor → ProsDispatch*
   (Platform paywall)
2. **Job Payments (Direct Charges)**
   *Homeowner → Contractor*
   (Invoice-based, no homeowner accounts)

⚠️ **This spec is intentionally narrow.**
Anything not explicitly defined here is **out of scope**.

---

## **2\. Core Principles (Non-Negotiable)**

### **2.1 Revenue Stream Separation (Hard Law)**

| Stream | Who Pays | Who Receives | Stripe Product |
| ----- | ----- | ----- | ----- |
| SaaS Billing | Contractor | ProsDispatch | Stripe Billing |
| Job Payments | Homeowner | Contractor | Stripe Connect (Direct Charges) |

**Forbidden (Forever):**

* Escrow logic
* Platform-held funds
* Wallets or balances
* Homeowner payment method storage
* Sharing Stripe Customers across streams

---

### **2.2 Shadow Registry Alignment**

* Homeowners **never** have accounts
* Homeowners pay via a **public invoice link** (`invoice_token`)
* Contractors are the **only authenticated users**

---

## **3\. SaaS Subscription (Contractor Paywall)**

### **3.1 Subscription Model**

* **Product:** ProsDispatch SaaS
* **Billing Type:** Monthly subscription
* **Initial Price:** $20 / month
* **Trial:** 14 days (configurable in Stripe)
* **Checkout Tool:** Stripe Checkout (Subscription Mode)

💡 Pricing **must be adjustable in the Stripe Dashboard** without code changes.

---

### **3.2 Price Resolution Strategy (Canonical)**

**Method:** Stripe `lookup_key`

One active Price must exist with:
lookup\_key \= "prosdispatch\_monthly"

*

**Resolution Rules:**

* Backend fetches Prices by `lookup_key`
* If multiple active prices exist:
  * Select the **most recently created active price**
* Cache resolved Price ID **per request only**
* ❌ No hardcoded Price IDs in the codebase

---

### **3.3 Subscription Enforcement (The Paywall)**

#### **Gate Logic**

On every authenticated route load:

profiles.subscription\_status ∈ { "active", "trialing" }

If false:

* Redirect to `/subscribe`
* Block access to all app features except:
  * Billing
  * Logout

---

### **3.4 Subscription Status Source of Truth**

* **Stripe is canonical**
* Database mirrors Stripe via webhooks

#### **`profiles` Table (Additions)**

| Column | Type | Notes |
| ----- | ----- | ----- |
| stripe\_customer\_id | text | Stripe Billing customer |
| subscription\_status | text | trialing | active | past\_due | canceled |
| subscription\_end\_date | timestamptz | Nullable |

---

### **3.5 Stripe Webhooks (Billing)**

Handled via Edge Function:

* `checkout.session.completed`
* `customer.subscription.created`
* `customer.subscription.updated`
* `customer.subscription.deleted`
* `invoice.payment_failed`

**Rule:**
Webhook events **overwrite** local subscription state (LWW).

---

## **4\. Job Payments (Homeowner → Contractor)**

### **4.1 Payment Model**

* **Mechanism:** Stripe Connect (Standard Accounts)
* **Charge Type:** Direct Charges
* **Flow:** Homeowner pays Contractor directly

ProsDispatch **never touches funds**.

---

### **4.2 Public Payment Flow**

1. Contractor sends Invoice
2. Invoice contains `invoice_token`
3. Homeowner opens `/invoice/:token`
4. Stripe Payment Element renders
5. Payment completes
6. Invoice marked `paid`

---

### **4.3 Stripe Architecture (Payments)**

* Each Contractor:
  * Owns a Stripe Connect Standard account
* Homeowner:
  * Pays via Checkout / Payment Element
  * No saved payment methods
* Platform:
  * Supplies `application_fee_amount = 0` (MVP1)

---

### **4.4 Payment Intent Creation**

**Backend:** Edge Function
**Action:** `create-payment-intent`

Inputs:

* `invoice_id`
* `amount`
* `currency`
* `connect_account_id`

Outputs:

* `client_secret`

---

### **4.5 Payment Webhooks**

Handled events:

* `payment_intent.succeeded`
* `payment_intent.payment_failed`

Effects:

* Update invoice status (`paid` / `failed`)
* Timestamp payment completion

---

## **5\. Offline-Tolerant Integration**

### **5.1 SaaS Billing**

* Billing actions require connectivity
* Offline behavior:
  * Display “Billing requires connection”
  * Retry allowed once online

---

### **5.2 Job Payments**

* Public invoice page:
  * Detect offline state
  * Disable payment button
  * Show “Connect to internet to pay”

No payment attempts are queued offline.

---

## **6\. UX Requirements**

### **6.1 Contractor UX**

* Clear paywall messaging
* Trial countdown visible
* Graceful past-due messaging
* No surprise lockouts (24h buffer allowed)

---

### **6.2 Homeowner UX**

* Zero account creation
* Mobile-first payment flow
* Clear invoice summary
* No upsells, no branding clutter

---

## **7\. Security & Compliance**

* Stripe keys stored server-side only
* Public invoice access via unguessable token
* Tokens expire when invoice is paid or voided
* No PCI scope leakage to frontend

---

## **8\. Explicit Non-Goals (MVP1)**

The following are **out of scope**:

* Referral programs
* Revenue sharing / commissions
* Wallet balances
* Partial payments
* Deposits / retainers
* Subscriptions for homeowners
* Discounts / coupons

---

## **9\. Future Hooks (Informational Only)**

* SaaS tier expansion (SPEC-007+)
* Application fees (post-MVP1)
* Partial / milestone invoicing
* Contractor revenue analytics

⚠️ **No implementation implied.**

---

## **End of Spec**
