# CANONICAL CONSTRAINTS

This file defines the non-negotiable architectural constraints for this repository.
These rules are mechanically enforced by `npm run check:canonical`.

**DO NOT MODIFY THIS FILE WITHOUT EXPLICIT APPROVAL.**

---

## 1. Stripe & Billing
*   **Backend:** All Stripe operations must be encapsulated in `supabase/functions/_shared/stripe.ts`.
    *   Direct `import Stripe from 'stripe'` is BANNED in individual Edge Functions.
    *   Direct `new Stripe(...)` instantiation is BANNED in individual Edge Functions.
    *   Use helper functions exported from `_shared/stripe.ts`.
*   **Frontend:** No direct Stripe calls allowed in UI components or hooks (except for Stripe Elements).
    *   All billing operations must go through `src/services/billing.ts`.
    *   `import { loadStripe } from '@stripe/stripe-js'` is allowed only in specific payment providers.

## 2. Routing Structure (Dual-CRM)
*   **Role-Scoped Routers:** The application routing is strictly split into:
    *   `src/routes/PublicRouter.tsx`: Publicly accessible routes.
    *   `src/routes/ProviderRouter.tsx`: Protected routes for Providers (Contractors).
    *   `src/routes/ClientRouter.tsx`: Protected routes for Homeowners/Clients.
    *   `src/routes/AppRouter.tsx`: Composes the above routers.
*   `App.tsx` must delegate to `AppRouter`, not define routes directly.

## 3. Schemas & Entities
*   **MVP1 vs Future:**
    *   MVP1 schemas live in `src/schemas/mvp1/`.
    *   Future schemas live in `src/schemas/future/`.
    *   **Rule:** MVP1 code must NOT import from `src/schemas/future/`.
*   **Migrations:**
    *   Migrations for future features must be prefixed with `future__` (e.g., `20250101000000_future__create_messages.sql`).
    *   MVP1 migrations cannot create tables for future entities (e.g., `materials`, `messages`, `reviews`, `inventory`).

## 4. State Machines
*   **Explicit Lifecycle:**
    *   Job and Invoice status transitions are strictly enforced.
    *   **Backend:** Database triggers (`validate_job_status_transition`, `validate_invoice_status_transition`) reject illegal updates.
    *   **Frontend:** `src/lib/stateMachines.ts` defines valid transitions. UI must check validity before attempting updates.

---

## Enforcement
Run the following command to verify compliance:
```bash
npm run check:canonical
```
This check is required before merging any code.
