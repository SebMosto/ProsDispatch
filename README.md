# ProsDispatch

ProsDispatch is a mobile-first, bilingual (EN/FR-CA) contractor SaaS built with Vite, React 18, TypeScript, Supabase, and Stripe Connect Standard (direct charges only). This restart repository ships with i18n, responsive layout scaffolding, and a single Supabase client entry point.

## Getting started

1. Copy `.env.example` to `.env` and provide your Supabase project credentials:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Key paths

- `src/i18n/` — i18next configuration plus EN/FR locale files for all UI text.
- `src/lib/supabase.ts` — the single Supabase client factory; requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/pages/HomePage.tsx` — mobile-first landing layout with bilingual content and touch-friendly controls.

## Accessibility & responsiveness

Layouts follow the UX-Responsive-01 pattern: single-column mobile-first flow that progressively enhances on larger screens while keeping touch targets at least 44px tall.
