# Canonical Constraints

This repository enforces strict architectural patterns to prevent drift and ensure security.
These rules are mechanically enforced by `scripts/check-canonical.cjs` in CI.

## 1. Stripe & Billing Isolation
- **Backend**: All Stripe writes must go through `supabase/functions/_shared/stripe.ts`.
  - Direct imports of the `stripe` SDK in other edge functions are prohibited.
- **Frontend**: All billing operations must go through `src/services/billing.ts`.
  - Direct usage of Stripe SDKs in components is prohibited (except for UI elements like `CardElement`).

## 2. Routing Structure
- Application routing is split into strict role-based scopes:
  - `src/routes/PublicRouter.tsx`
  - `src/routes/ClientRouter.tsx`
  - `src/routes/ProviderRouter.tsx`
- `AppRouter.tsx` composes these routers.

## 3. MVP vs Future Separation
- **Schemas**:
  - MVP1 schemas live in `src/schemas/mvp1/`.
  - Future schemas live in `src/schemas/future/`.
  - MVP1 code cannot import from Future schemas.
- **Migrations**:
  - Must use naming convention: `YYYYMMDDHHMMSS_mvp1__name.sql` or `YYYYMMDDHHMMSS_future__name.sql`.
  - MVP1 migrations cannot create "future" tables (materials, messages, reviews, inventory).

## 4. State Machines
- Critical entities (Jobs, Invoices) have explicit state machines enforced at:
  - **Frontend**: `src/lib/stateMachines.ts`
  - **Database**: SQL Triggers/Functions (e.g., `validate_job_status_transition`).

## 5. RLS & Security
- All RLS policies must be tested with smoke tests in `supabase/tests/database/rls_smoke_test.sql`.
