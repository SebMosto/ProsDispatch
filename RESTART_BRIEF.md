# Restart Brief

## Why the Restart Is Required
The audit determined that the existing repository contains fundamental architectural conflicts that are impractical to untangle, including Next.js patterns inside a Vite app, hardcoded Supabase credentials, and a deeply embedded proposals/bidding system that violates the canonical "no marketplace" constraint. These findings, combined with deprecated dependencies and mixed data-fetching patterns, mean refactoring would consume 45-60 hours with high risk for regressions. Restarting from a clean Vite + React + Supabase template enables compliance with the audit’s recommendation while avoiding inherited technical debt.

Additionally, the absence of meaningful PRDs and the presence of marketplace-oriented flows (proposals, escrow placeholders, homeowner scope creep) show that the current codebase was built without enforceable guardrails. A fresh repository lets us rebuild only the contractor-focused MVP1, enforce environment-driven configuration from day one, and preserve only the audited modules that are safe to reuse.

## Salvage List (Copy Into New Repo)
- `src/components/ui/`
- `src/utils/security/`
- `src/i18n/`
- `src/schemas/`
- `docs/ACCESSIBILITY.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`

## Forbidden List (Never Copy Into New Repo)
- `src/integrations/supabase/`
- `src/utils/jobs/proposals/`
- `src/components/jobs/proposals/`
- `src/contexts/jobs/hooks/proposals/`
- `src/payments/` (escrow patterns)
- `supabase/migrations/` (marketplace schema)
- Any file referencing proposals, bidding, or escrow flows
- Hardcoded API keys
- Next.js-specific code in a Vite app
- Old `package.json` dependency set

## Canonical Constraints for New Repo
- No escrow
- No bidding
- No marketplace flows
- Stripe Connect Standard only (Direct Charges)
- React + Vite + Supabase JS only
- Contractor SaaS only (MVP1)
- EN/FR i18n
- Canadian compliance constraints

## Migration Checklist for New Repo
- Copy UI components
- Copy schemas
- Copy security utilities
- Rebuild Supabase migrations from scratch
- Do NOT copy any forbidden files
- Validate no marketplace code exists
- Validate no Next.js code exists
- Validate no escrow/payment vaulting exists
