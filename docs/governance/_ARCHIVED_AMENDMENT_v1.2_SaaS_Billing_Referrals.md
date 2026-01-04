# Governance Amendment v1.2: SaaS Billing & Referrals

> **ARCHIVED:** This amendment is retained for historical context only. Referral and commission features were removed from MVP1
> scope and are not active directives.

**Amendment Version:** 1.2  
**Date:** November 2025  
**Status:** Approved  
**Supersedes:** Governance Manifest v1.0  
**Authority:** Enterprise Brief & Product Leadership

---

## Overview

This amendment extends the **Governance Manifest** to include policies and constraints for two new feature areas planned for post-MVP1 releases:

1. **SaaS Billing & Subscription Management**
2. **Contractor Referral Program**

These features are **explicitly out of scope for MVP1** but are codified here to ensure future development adheres to the same governance principles and architectural constraints established in the core manifest.

---

## 1. SaaS Billing & Subscription Management

### 1.1 Scope & Purpose

Post-MVP1, ProsDispatch will introduce subscription tiers for contractors to access premium features. This section defines the mandatory constraints and patterns for implementing SaaS billing.

### 1.2 Core Principles

* **Stripe Billing Integration Only:** All subscription management must use Stripe Billing (not Stripe Checkout for one-time payments). This maintains consistency with our existing Stripe Connect Standard integration.

* **No Custom Billing Logic:** Do not build proprietary subscription tracking, proration, or billing cycle management. Rely entirely on Stripe's built-in subscription engine and webhooks.

* **Transparent Pricing:** All pricing must be clearly displayed in both English and French (FR-CA) with all applicable taxes (GST/HST/QST) calculated and shown upfront per Canadian requirements.

* **Canadian Tax Compliance:** The platform must collect and remit GST/HST/QST as required by Canadian tax law. Use Stripe Tax or equivalent automated tax calculation service.

### 1.3 Architectural Constraints

| Area | Requirement |
|------|-------------|
| **Payment Provider** | Stripe Billing (subscriptions) |
| **Billing Cycles** | Monthly or Annual only (no custom cycles) |
| **Tax Calculation** | Automated via Stripe Tax |
| **Invoice Generation** | Stripe-hosted invoices (no custom PDF generation for subscriptions) |
| **Payment Methods** | Cards only (no ACH, crypto, or alternative payment methods in Phase 2) |
| **Proration** | Use Stripe's built-in proration logic |
| **Trial Periods** | Maximum 14 days free trial (configurable) |

### 1.4 Data Model Requirements

**Minimal Schema Addition:**

```sql
-- contractors table extension
ALTER TABLE contractors ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE contractors ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE contractors ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE contractors ADD COLUMN subscription_expires_at TIMESTAMPTZ;

-- Create partial unique index to handle NULL values and prevent duplicates
CREATE UNIQUE INDEX idx_contractors_stripe_customer_id 
  ON contractors(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;
```

**No Additional Tables:** Do not create custom subscription_plans, billing_history, or invoice tables. Query Stripe API for this data when needed. Cache only what's necessary for feature gating.

### 1.5 Feature Gating Rules

* Free Tier: Up to 5 active jobs, basic invoice generation, email notifications
* Pro Tier: Unlimited jobs, advanced analytics, priority support
* Enterprise Tier: Multi-user teams, API access, custom branding

**Enforcement:** Feature gates must be implemented at the API level (Supabase RLS policies or Edge Functions), not just in the UI.

### 1.6 Forbidden Patterns

* ❌ **Custom billing engines or "credits" systems**
* ❌ **Storing payment card details directly** (always use Stripe)
* ❌ **Billing cycles other than monthly/annual**
* ❌ **Offering "lifetime" plans** (violates sustainability model)
* ❌ **Usage-based billing** (too complex for MVP2 scope)

### 1.7 Testing Requirements

* All subscription flows must have automated E2E tests using Stripe Test Mode
* Test cases must cover: signup, upgrade, downgrade, cancellation, failed payment recovery
* Tax calculation accuracy must be verified for all Canadian provinces

---

## 2. Contractor Referral Program

### 2.1 Scope & Purpose

A referral program allowing existing contractors to invite new contractors in exchange for credits or discounts. This is **not** a marketplace feature—it's purely an acquisition incentive.

### 2.2 Core Principles

* **Simple Referral Links:** Each contractor gets a unique referral code/link. New contractors who sign up via this link are tracked.

* **Transparent Rewards:** Rewards must be clearly stated in both EN and FR-CA. No hidden terms or complex point systems.

* **Anti-Fraud Measures:** Implement basic fraud detection (e.g., same IP/email patterns, suspicious signup velocity).

* **No Cash Payouts:** Referral rewards are credits toward subscription fees only. No cash transfers or external payments.

### 2.3 Architectural Constraints

| Area | Requirement |
|------|-------------|
| **Tracking Method** | Unique referral codes stored in database |
| **Reward Type** | Subscription credits only (applied to Stripe invoices) |
| **Payout Threshold** | Minimum 2 successful referrals before rewards activate |
| **Fraud Detection** | Basic duplicate detection (email, IP, device fingerprint) |
| **Reward Expiry** | Credits expire after 12 months of inactivity |

### 2.4 Data Model Requirements

**Minimal Schema Addition:**

```sql
-- contractors table extension
ALTER TABLE contractors ADD COLUMN referral_code TEXT;
ALTER TABLE contractors ADD COLUMN referred_by UUID REFERENCES contractors(id);
ALTER TABLE contractors ADD COLUMN referral_credits DECIMAL DEFAULT 0.00;

-- Create unique index on non-NULL referral codes
CREATE UNIQUE INDEX idx_contractors_referral_code 
  ON contractors(referral_code) 
  WHERE referral_code IS NOT NULL;

-- referral_events table (for audit trail)
CREATE TABLE referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES contractors(id) NOT NULL,
  referred_id UUID REFERENCES contractors(id) NOT NULL,
  event_type TEXT NOT NULL, -- 'signup', 'credited', 'redeemed'
  credit_amount DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 Referral Workflow

1. Contractor generates referral link from dashboard
2. New contractor signs up using referral link
3. System tracks `referred_by` relationship
4. After new contractor completes first paid job (verification of legitimate use), referrer earns credit
5. Credits automatically apply to referrer's next subscription invoice

### 2.6 Fraud Prevention Rules

* **Same Email Domain Block:** If 3+ referrals from same email domain within 7 days, flag for manual review
* **IP Address Clustering:** If 5+ signups from same IP within 24 hours, block referral credits
* **Velocity Limits:** Maximum 10 successful referrals per contractor per month
* **Verification Requirement:** Referred contractor must complete at least one paid job before credit is awarded

### 2.7 Forbidden Patterns

* ❌ **Cash or external reward payouts** (Stripe transfers, PayPal, etc.)
* ❌ **Multi-level marketing (MLM) structures** (referrals cannot refer others for additional rewards)
* ❌ **Public referral marketplaces** (referrals are direct contractor-to-contractor only)
* ❌ **Unlimited or uncapped rewards** (must have reasonable caps to prevent abuse)

### 2.8 Testing Requirements

* Unit tests for referral code generation and validation
* Integration tests for credit calculation and application
* E2E tests for complete referral flow (signup → job completion → credit award)
* Fraud detection rules must be tested with simulated attack scenarios

---

## 3. Implementation Priority

Both features are **post-MVP1** and should be implemented in the following order:

1. **Phase 2.1:** SaaS Billing (required for revenue model)
2. **Phase 2.2:** Referral Program (growth acceleration)

**Rationale:** Billing must be in place before referral credits have any value. Implementing in reverse order would create dead code.

---

## 4. Compliance & Legal Requirements

### 4.1 Canadian Consumer Protection

* All subscription terms must comply with Quebec's Consumer Protection Act (automatic renewal disclosures)
* Cancellation must be possible at any time with no penalty (beyond end of current billing period)
* Clear refund policy required (pro-rated refunds for annual plans)

### 4.2 Privacy (PIPEDA & Law 25)

* Referral tracking must be disclosed in Privacy Policy
* Contractors must consent to referral program participation (opt-in)
* Referred contractors must be informed they were referred (transparency)

### 4.3 Tax Implications

* Referral credits are considered discounts, not taxable income for referrers
* Platform must issue receipts for all subscription charges showing tax breakdown

---

## 5. Governance Enforcement

### 5.1 CI/CD Checks

The following automated checks will be added to the CI pipeline when these features are developed:

* **No hardcoded subscription prices** (must come from Stripe Product Catalog)
* **No direct database mutations for subscription status** (must sync from Stripe webhooks)
* **No referral reward code outside designated modules** (centralized logic only)

### 5.2 Code Review Requirements

Pull requests implementing SaaS Billing or Referrals must:

1. Include explicit references to this amendment document
2. Pass all security scans (no payment data leakage)
3. Include bilingual UI strings (EN/FR-CA)
4. Include comprehensive test coverage (minimum 80% for billing logic)

### 5.3 Audit Trail

All subscription changes and referral credits must be logged to an audit table for financial reconciliation and compliance purposes.

---

## 6. Amendment History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.2 | 2025-11-23 | Initial version covering SaaS Billing & Referrals | Product Leadership |

---

## 7. Revision Process

This amendment may be updated as requirements evolve. Changes require:

1. Written proposal with rationale
2. Technical lead review
3. Product owner approval
4. Update to this document with version increment

---

**This amendment is binding and must be followed when implementing SaaS Billing or Referral features. Any deviation requires explicit written approval from Product Leadership.**
