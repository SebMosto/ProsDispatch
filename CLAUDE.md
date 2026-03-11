# CLAUDE.md — ProsDispatch AI Assistant Guide

This file provides context for AI assistants working in this repository. Read it before making any changes.

---

## Project Overview

**ProsDispatch** is a SaaS MVP for independent contractors to manage jobs, clients, invoices, and payments. It was deliberately restarted from a clean Vite template to eliminate architectural conflicts from a prior iteration.

**Stack:**
- Frontend: Vite + React 19 + TypeScript + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + Edge Functions via Deno)
- Payments: Stripe Connect Standard (direct charges, no escrow)
- i18n: i18next (English + French Canadian)
- Testing: Vitest (unit) + Playwright (E2E)

---

## Directory Structure

```
src/
├── components/         # React UI components
│   ├── jobs/           # Job-specific components
│   ├── clients/        # Client-specific components
│   ├── invoices/       # Invoice components
│   ├── properties/     # Property components
│   ├── ui/             # Reusable primitives
│   ├── Layout/         # Sidebar, BottomNav
│   └── system/         # OfflineBanner, SyncBadge
├── hooks/              # TanStack Query custom hooks
├── pages/              # Lazy-loaded page components
│   ├── auth/
│   ├── jobs/
│   ├── clients/
│   ├── invoices/
│   └── public/         # Token-based pages (no auth required)
├── repositories/       # Data access layer (Supabase calls)
├── schemas/            # Zod validation schemas
├── lib/                # Utilities and shared logic
├── i18n/               # Translation files (en.json, fr.json)
├── persistence/        # IndexedDB form persistence
├── types/              # TypeScript type definitions
└── test/               # Test setup and shared utilities

supabase/
├── migrations/         # 11 SQL migration files (ordered by timestamp)
└── functions/          # 16 Deno Edge Functions

tests/                  # Playwright E2E tests
scripts/                # CI and governance scripts
.github/workflows/      # 6 GitHub Actions pipelines
docs/                   # PRD, specs, guidelines, governance docs
```

---

## Common Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Type-check + Vite build → dist/
npm run preview      # Serve built dist/ (port 4173, for E2E tests)
npm run test         # Vitest unit tests
npm run lint         # ESLint (flat config, ESLint 9)
npm run typecheck    # TypeScript compiler check only (no emit)
npm run check:i18n   # Validate EN/FR translation parity
npm run check:stack  # Scan for forbidden Next.js imports
npm run typegen      # Regenerate Supabase TypeScript types from local schema
```

---

## Architecture Patterns

### Repository Pattern
All Supabase data access goes through repositories in `src/repositories/`. Never call `supabase` directly from components or hooks.

- `base.ts` — Abstract `BaseRepository` with error handling and network detection
- `jobRepository.ts`, `clientRepository.ts`, `invoiceRepository.ts`, `propertyRepository.ts`, `profileRepository.ts`

Repository errors use a typed `RepositoryError` with a `reason` field: `network | server | validation | unknown`.

### Data Fetching (TanStack Query)
Custom hooks in `src/hooks/` wrap repositories and expose TanStack Query results. Stale time is 5 minutes by default.

```
Component → Hook (TanStack Query) → Repository → Supabase
```

Always use query hooks for reads and mutation hooks for writes. Do not fetch data inside components directly.

### Form Handling
- **React Hook Form** for performance
- **Zod** schemas in `src/schemas/` for validation
- **`@hookform/resolvers/zod`** to connect them
- Localized error messages via `src/schemas/helpers.ts`
- `usePersistentForm` (IndexedDB) for draft persistence across sessions

### Job Status State Machine
Jobs follow a strict linear lifecycle defined in `src/lib/stateMachines.ts`:

```
draft → sent → approved → in_progress → completed → invoiced → paid → archived
```

Never mutate job status directly — use the `transition_job_state` Supabase RPC. Valid transitions are in the `JOB_TRANSITIONS` map.

### Auth & Subscription Gating
- `AuthProvider` (`src/lib/auth.tsx`) provides: `user`, `profile`, `session`, `subscriptionStatus`, `isSubscribed`, `trialDaysRemaining`
- `ProtectedRoute` enforces both authentication and active subscription
- Exceptions: `/subscribe`, `/settings/billing`, `/settings/stripe` are accessible to unauthenticated-ish users

### Public Token-Based Routes
Two routes bypass auth entirely:
- `/jobs/approve/:token` — Homeowner job approval
- `/pay/:token` — Invoice payment page

These use Supabase RPCs and Edge Functions that bypass RLS via service-role key.

### Routing & Code Splitting
All pages are `React.lazy()`-loaded. Route definitions live in `src/App.tsx`. Do not add routes in other files.

---

## Strict Governance Rules (CI-Enforced)

The following are **hard blockers** in CI. Violations will fail the pipeline:

1. **No Next.js** — This is a Vite app. Never import from `next/*`.
2. **No marketplace patterns** — No bidding, escrow, proposals, contractor-matching, or homeowner accounts.
3. **No hardcoded secrets** — No API keys, tokens, or credentials in source files.
4. **No inline styles** — Use Tailwind utility classes only.
5. **EN/FR parity** — Every i18n key in `en.json` must exist in `fr.json` and vice versa.
6. **80% test coverage** — Coverage thresholds enforced by Vitest.

Run `npm run check:stack` and `npm run check:forbidden` before pushing.

---

## Internationalization (i18n)

All user-facing strings must use i18next. Never hardcode English (or French) text in components.

```tsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// Then: t('some.key')
```

Both `src/i18n/locales/en.json` and `src/i18n/locales/fr.json` must be updated together. The CI job `Localization Check` is a **P0 blocker** — it will fail the build if keys are missing.

---

## Database (Supabase)

### Migrations
All schema changes go through timestamped SQL files in `supabase/migrations/`. Never alter the database manually or via the Supabase Studio for persistent changes.

Migration naming: `YYYYMMDDHHMMSS_description.sql`

### Row-Level Security (RLS)
Every table has RLS enabled. The standard policy pattern:
```sql
auth.uid() = contractor_id
```
Public endpoints (token-based flows) use service-role keys in Edge Functions, not RLS bypass in migrations.

### Key Tables
| Table | Purpose |
|---|---|
| `profiles` | Contractor profile, subscription state, Stripe IDs |
| `clients` | Client registry (contractor-scoped) |
| `properties` | Property addresses (linked to clients) |
| `jobs` | Job records with status enum, soft delete |
| `invoices` | Invoice records linked to jobs |
| `job_tokens` | Public tokens for job sharing/approval |

Soft deletes use a `deleted_at` timestamp — never use hard deletes on jobs.

### Edge Functions
16 Deno-based Edge Functions in `supabase/functions/`. Shared utilities are in `supabase/functions/_shared/`. Functions are deployed separately from the frontend.

---

## Testing

### Unit Tests (Vitest)
```bash
npm run test
```
- Environment: jsdom
- Setup: `src/test/setup.ts` (mocks Supabase env vars)
- Coverage: 80% threshold on lines/functions/branches/statements
- Test files live alongside source files as `*.test.ts` / `*.test.tsx`

### E2E Tests (Playwright)
```bash
npm run preview  # Must be running first
npx playwright test
```
Viewports tested: Mobile (375×667), Tablet (768×1024), Desktop (1920×1080).

### What to Test
- All Zod schemas
- Repository CRUD methods (mock Supabase)
- State machine transitions
- Tax and currency utilities
- Auth flows
- Form validation

---

## Styling Conventions

- **Tailwind CSS** only — no CSS modules, no styled-components, no inline styles
- Mobile-first responsive design
- Minimum **44px touch targets** for interactive elements
- WCAG 2.1 AA accessibility — include `aria-label` on icon-only buttons
- Use `cn()` (clsx + tailwind-merge) for conditional class merging

---

## TypeScript Conventions

- Strict mode is enabled — no `any` unless unavoidable and documented
- All Supabase types are auto-generated via `npm run typegen` from the local schema
- Prefer `interface` for object shapes, `type` for unions/aliases
- Export types from `src/types/` when shared across features

---

## Environment Variables

All env vars are prefixed `VITE_` for frontend access:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

Copy `.env.example` to `.env.local` for local development. Never commit `.env` files.

Backend secrets (Stripe secret key, Resend API key, service-role key) are stored only in Supabase Edge Function secrets — never in the frontend or repository.

---

## CI/CD Pipelines

Six GitHub Actions workflows:

| Workflow | Trigger | Purpose |
|---|---|---|
| `pr-validation.yml` | PR open/update | Lint + type check |
| `ci-guardrails.yml` | Push to main/PR | Full 10-job CI suite |
| `supabase-sync.yml` | Push to main | Sync migrations to Supabase |
| `ai-agent-audit.yml` | Schedule | AI governance compliance |
| `dependency-security.yml` | Schedule | npm audit + vulnerability scan |
| `release-gating.yml` | Release tag | Release qualification |

The `ci-guardrails.yml` suite includes a final `All Checks Complete` gate job — all 10 jobs must pass before merging.

---

## What NOT To Do

- Do not call Supabase directly from components — use repositories
- Do not add routes outside `src/App.tsx`
- Do not use Next.js APIs, conventions, or imports
- Do not add bidding, escrow, proposals, or homeowner registration features
- Do not hardcode user-facing strings — use i18n keys
- Do not write inline styles — use Tailwind
- Do not commit `.env` files or API keys
- Do not hard-delete job records — use `deleted_at` soft delete
- Do not transition job status directly — use the `transition_job_state` RPC
- Do not add keys to `en.json` without adding the same key to `fr.json`

---

## Key Files for Quick Navigation

| File | Purpose |
|---|---|
| `src/App.tsx` | All routes and layout structure |
| `src/lib/auth.tsx` | Auth context and subscription state |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/stateMachines.ts` | Job status transitions |
| `src/repositories/base.ts` | BaseRepository pattern |
| `src/schemas/job.ts` | Job validation schemas |
| `src/i18n/locales/en.json` | English translation keys |
| `src/i18n/locales/fr.json` | French translation keys |
| `supabase/migrations/` | All database migrations |
| `docs/MVP1_PRD.md` | Product requirements |
| `docs/FRONTEND_GUIDELINES.md` | Component patterns |
