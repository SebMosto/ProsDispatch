# Technology Stack: ProsDispatch MVP1

## App Context
*   **Type:** Web App (PWA capable)
*   **Scale:** MVP
*   **Team Size:** 1 (Solo Developer + AI)
*   **Timeline:** MVP Launch Week 8

## 1. STACK OVERVIEW
*   **Architecture Pattern:** Serverless / Headless
*   **Deployment Strategy:** Static Frontend (Render/Vercel) + Managed Backend (Supabase) + Edge Functions
*   **Justification:** Maximizes development speed, minimizes devops overhead, and ensures scalability/security via managed services (Supabase) and strict typing (TypeScript).

## 2. FRONTEND STACK

*   **Framework:** **React 19.2.3**
    *   *Docs:* [react.dev](https://react.dev)
    *   *License:* MIT
    *   *Reason:* Industry standard, rich ecosystem, required by project mandate.
*   **Language:** **TypeScript ~5.9.3**
    *   *Docs:* [typescriptlang.org](https://www.typescriptlang.org)
    *   *Reason:* Type safety is non-negotiable for financial apps.
*   **Build Tool:** **Vite 7.3.1**
    *   *Docs:* [vitejs.dev](https://vitejs.dev)
    *   *Reason:* Fast HMR, optimized builds.
*   **Styling:** **Tailwind CSS 3.4.15**
    *   *Docs:* [tailwindcss.com](https://tailwindcss.com)
    *   *Reason:* Rapid UI development, consistency.
    *   *Helper:* `tailwind-merge` & `clsx` for dynamic classes.
*   **State Management:** **TanStack Query v5.90.20**
    *   *Docs:* [tanstack.com/query](https://tanstack.com/query)
    *   *Reason:* Handles server state (caching, loading, errors) better than global stores like Redux.
    *   *Local State:* React Context (Auth) + `useState` (UI).
*   **Form Handling:** **React Hook Form 7.71.1**
    *   *Docs:* [react-hook-form.com](https://react-hook-form.com)
    *   *Validation:* **Zod 3.24.1** + `@hookform/resolvers`.
    *   *Reason:* Performance (minimizes re-renders) and strict schema validation.
*   **Routing:** **React Router 7.13.0**
    *   *Docs:* [reactrouter.com](https://reactrouter.com)
    *   *Reason:* Standard for SPA routing.
*   **UI Components:** **Lucide React 0.563.0** (Icons) + Custom Tailwind Components
    *   *Reason:* Lightweight, avoiding bloat of full UI libraries like MUI for MVP.
*   **I18n:** **i18next 25.7.4** + `react-i18next`
    *   *Reason:* Robust bilingual support (EN/FR) required by PRD.

## 3. BACKEND STACK

*   **Platform:** **Supabase**
    *   *Docs:* [supabase.com](https://supabase.com)
    *   *Reason:* All-in-one backend (DB, Auth, Storage, Edge Functions) fits "No Ops" goal.
*   **Database:** **PostgreSQL 15+** (via Supabase)
    *   *Docs:* [postgresql.org](https://www.postgresql.org)
    *   *Reason:* Relational data integrity, powerful extensions, RLS security.
*   **Runtime (Edge Functions):** **Deno**
    *   *Docs:* [deno.land](https://deno.land)
    *   *Reason:* Native TypeScript support, secure by default, Supabase standard.
*   **ORM:** **Supabase JS Client 2.90.1** (Data Mapper)
    *   *Reason:* Strongly typed generated types (`database.types.ts`) matches DB schema 1:1. No heavy ORM needed.
*   **Authentication:** **Supabase Auth** (GoTrue)
    *   *Method:* Email/Password + Magic Link (future).
    *   *Reason:* Handles sessions, security, and RLS integration out of the box.
*   **File Storage:** **Supabase Storage** (S3 compatible)
    *   *Usage:* Invoice PDFs.
*   **Email:** **Resend** (via Edge Functions)
    *   *Docs:* [resend.com](https://resend.com)
    *   *Reason:* Developer-friendly API, reliable delivery.

## 4. DATABASE SCHEMA

*   **Migration Strategy:** **Supabase Migrations** (SQL files)
    *   *Workflow:* Local dev -> `supabase db diff` -> Commit SQL -> Push to Prod.
*   **Seeding:** `supabase/seed.sql` for dev data.
*   **Backup:** Point-in-time recovery (PITR) enabled via Supabase Pro.
*   **Connection:** Transaction pooling (Supavisor) enabled for Edge Functions (Port 6543).

## 5. DEVOPS & INFRASTRUCTURE

*   **Version Control:** GitHub (Trunk-based development).
*   **CI/CD:** GitHub Actions.
    *   *Workflow:* Lint -> Type Check -> Test -> Deploy (Edge Functions) -> Preview (Frontend).
*   **Hosting:**
    *   *Frontend:* **Render** (Static Site).
    *   *Backend:* **Supabase** (Managed).
*   **Monitoring:**
    *   *Frontend:* Sentry (Recommended for Post-MVP).
    *   *Backend:* Supabase Logs / Dashboard.
*   **Testing:** **Vitest 4.0.18** + **React Testing Library**
    *   *Reason:* Fast, compatible with Vite.

## 6. DEVELOPMENT TOOLS

*   **Linter:** **ESLint 9.15.0** (Flat Config).
*   **Formatter:** Prettier (Integrated).
*   **Environment Validation:** `./scripts/hooks/verify-env.sh` (Custom).
*   **IDE:** VS Code.

## 7. ENVIRONMENT VARIABLES

```bash
# Frontend (.env)
VITE_SUPABASE_URL="https://xyz.supabase.co"
VITE_SUPABASE_ANON_KEY="public-anon-key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Backend (Supabase Secrets)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
RESEND_API_KEY="re_..."
SUPABASE_SERVICE_ROLE_KEY="service-role-key" (Internal use only)
```

## 8. PACKAGE.JSON SCRIPTS

*   `dev`: Start local dev server (`vite`).
*   `build`: Type check + build (`tsc -b && vite build`).
*   `test`: Run unit tests (`vitest run`).
*   `lint`: Run linter (`eslint .`).
*   `typecheck`: Run TypeScript compiler check (`tsc --noEmit`).
*   `check:i18n`: Verify translation keys.
*   `check:stack`: Verify forbidden dependencies.

## 9. DEPENDENCIES LOCK

### Frontend (Key Deps)
```json
{
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "react-router-dom": "^7.13.0",
  "react-hook-form": "^7.71.1",
  "zod": "^3.24.1",
  "@tanstack/react-query": "^5.90.20",
  "@supabase/supabase-js": "^2.90.1",
  "@stripe/react-stripe-js": "^5.6.0",
  "@stripe/stripe-js": "^8.6.4",
  "lucide-react": "^0.563.0",
  "i18next": "^25.7.4"
}
```

### Backend (Edge Functions via Deno)
*   `stripe`: ^14.0.0 (via esm.sh)
*   `resend`: ^2.0.0 (via esm.sh)
*   `pdf-lib`: ^1.17.1 (via esm.sh)

## 10. SECURITY CONSIDERATIONS

*   **Authentication:** Supabase Auth (JWT). Tokens expire 1h, refresh token 24h.
*   **Authorization:** Row Level Security (RLS) policies on **ALL** tables. No access without policies.
*   **Payments:** No raw credit card data touches our servers (Stripe Elements + Connect).
*   **CORS:** Restricted to `pro.prosdispatch.ca` (Prod) and `localhost` (Dev).
*   **XSS:** React auto-escaping + `escapeHtml` util for raw HTML.

## 11. VERSION UPGRADE POLICY

*   **Major Versions:** Update only after MVP stability phase (Quarterly review).
*   **Security Patches:** Apply immediately via `npm audit fix`.
*   **Breaking Changes:** Must be documented in `ACTION_PLAN.md` before applying.
