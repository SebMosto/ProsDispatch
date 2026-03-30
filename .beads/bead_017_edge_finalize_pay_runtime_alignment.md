# Bead: Preview / prod edge finalize + pay-token runtime alignment

**Bead ID:** bead_017  
**Status:** Open  
**Depends on:** bead_014 (blocked — follow-on work)

## Context

Authenticated 9-step E2E (`tests/e2e-bead013.spec.ts`) against `vite preview` (dist on `localhost:4173`) now runs deep into the lifecycle but fails at **invoice finalize → public `/pay/:token`** because:

- `finalize-and-send-invoice` edge function may fail in preview/prod-like runs (missing Resend/PDF/Stripe secrets, or transport errors).
- A **dev-only** client fallback was added in `useInvoices` finalize; **preview builds are not `import.meta.env.DEV`**, so the fallback does not run and the flow stops with function errors or invalid pay links.
- `useInvoiceByToken` / `get_invoice_by_token` RPC parameter naming must match deployed migrations (`p_token` vs legacy `access_token`) or public invoice pages show “expired” even when tokens exist.

This bead closes that gap in a governed way: either align runtime secrets and edge behavior, or add a **safe, explicit** preview/test path that does not ship unsafe fallbacks to production.

---

## Goals

1. **Finalize path:** Running `npm run build && npm run preview`, then executing the full 9-step E2E with `E2E_EMAIL` / `E2E_PASSWORD` set, completes Step 8 (finalize & send) without spurious failures when Supabase edge functions are correctly configured locally or in CI.

2. **Public pay path:** After finalize, `/pay/:token` loads invoice data (no false “expired” when token is valid) and the Pay UI reaches a stable state (Stripe Element or explicit “configure Stripe” message — match existing product behavior).

3. **No silent prod bypass:** Any fallback for missing email/PDF must be gated by `import.meta.env.DEV`, a dedicated `VITE_*` flag, or CI-only — not unconditional in production bundles.

---

## Tasks

### Task 1 — Audit runtime contract

- Read `supabase/functions/finalize-and-send-invoice` and document required secrets (`RESEND_API_KEY`, Stripe, etc.).
- Confirm `get_invoice_by_token` RPC signature in latest migration matches `useInvoiceByToken` (`p_token`).
- Document expected env for local preview: `.env.local` + Supabase CLI linked project vs remote functions.

### Task 2 — Fix RPC / client mismatch (if any)

- If RPC name or args differ, update `src/hooks/useInvoices.ts` `useInvoiceByToken` to call the correct RPC with correct parameter name.
- Add or adjust unit test that mocks RPC response shape.

### Task 3 — Preview / CI alignment for finalize

Choose one (document in bead history):

- **A)** Require operators to set edge secrets and run against deployed functions; document in `docs/` or `.env.example` comments only.
- **B)** Add optional `VITE_ALLOW_INVOICE_FINALIZE_FALLBACK=true` (or similar) read only in non-production builds or explicit E2E profile, implementing the same DB transition + `invoice_tokens` insert as today’s dev path — **never default on in prod**.

### Task 4 — Verify

- Stop Hook: `npm run typecheck && npm run build && npm run lint && npm run test && npm run check:i18n`
- E2E: `npm run preview` + `npx playwright test tests/e2e-bead013.spec.ts --reporter=list` with credentials set (Desktop minimum; all three viewports if time allows).

### Task 5 — Log

- Close bead_017 in `.beads/beads.jsonl` with history.
- Unblock or close bead_014 if full 9-step passes; else leave bead_014 blocked with pointer to remaining issue.

---

## Out of scope

- Changing Stripe Connect business rules or invoice immutability triggers in DB.
- Removing edge functions entirely.

---

## References

- `src/hooks/useInvoices.ts` — finalize mutation, `useInvoice`, `useInvoiceByToken`
- `supabase/migrations/*get_invoice_by_token*`
- `supabase/functions/finalize-and-send-invoice/`
- `tests/e2e-bead013.spec.ts` — Steps 8–9
