# Bead: Launch hygiene bundle — secrets, duplicate function, debug noise cleanup

**Bead ID:** bead_025
**Status:** open
**Type:** security hygiene + dead code removal + debug-log cleanup
**Depends on:** none
**ROLES:** Mayor=claude.ai Cowork (Seb), Polecat=Cursor or Claude Code Terminal, Auditor=Gemini + Codex PR review + Stop Hook + manual key rotation by Seb
**Created:** 2026-04-29

---

## Context

Pre-marketing audit (claude.ai Cowork, 2026-04-29) surfaced four discrete launch-hygiene issues that are individually small but together signal "this codebase is not ready to be seen by paying customers, investors, or auditors." Bundling them into one bead because they ride the same Stop Hook and have non-overlapping scope:

1. **Live Stripe TEST keys committed to `.env.example`** — `pk_test_...`, `sk_test_...`, `whsec_...`. Test mode (no real money), but TruffleHog in CI security-scanning will flag them, and "we publish our test secrets" is the wrong signal during fundraise/sales conversations. Replace with placeholders. **Seb must rotate the keys in the Stripe Dashboard separately as an ops step (out of scope for the Polecat).**

2. **Duplicate Edge Function: `supabase/functions/create-portal-session/`** is dead code, superseded by `create-billing-portal-session/`. Confirmed via grep (2026-04-29) that no frontend code references it. The duplicate also contains a sloppy nested env-var check block. Delete the directory and any references in `supabase/config.toml`.

3. **Emoji-prefixed debug `console.*` calls in `src/hooks/useSubscription.ts`** lines 22, 27, 30, 35: `🔴 Supabase Function Error`, `🟢 Success! Redirecting to:`, `🔴 No URL returned`, `🔴 Checkout Exception`. Fires on every checkout. Must be removed before launch.

4. **Stray `console.*` calls** in `src/hooks/useClientMutations.ts:39,61`, `src/components/properties/useCreatePropertyForm.ts:93`, `src/pages/StripeConnectPage.tsx:25,50,58,69`. Originally added during bead_011 debugging (per bead_011 history) but no longer needed. Convert to silent rethrow or surface via existing `RepositoryError` channel — do not introduce a new logging library.

**Out of scope (not in this bead):**
- `src/i18n/index.ts:30` `console.error` for i18n init failure — arguably legitimate operator-visible logging, leave for now.
- `src/lib/googleMaps.ts:23,43` and `src/lib/stripe.ts:7` `console.warn` for missing API keys — operator-visible config warnings, leave.
- Stripe key rotation in the Dashboard — Seb's ops responsibility.

---

## Scope (file allowlist — no edits outside this list)

**Edits:**
- `.env.example` — replace live test-mode Stripe keys with placeholders matching the existing comment style (e.g., `pk_test_xxxxxxxxxxxxxxxxxxxxxxxx`); leave Supabase publishable key and the commented webhook secret as placeholders too
- `src/hooks/useSubscription.ts` — remove all emoji-prefixed `console.*` calls; preserve error state setting, just drop the logs
- `src/hooks/useClientMutations.ts` — remove `console.error` calls at lines 39 and 61; convert to silent rethrow (the error already propagates to the mutation's `error` state which the UI consumes)
- `src/components/properties/useCreatePropertyForm.ts` — remove `console.error` at line 93; same pattern (silent rethrow)
- `src/pages/StripeConnectPage.tsx` — remove `console.error` calls at lines 25, 50, 58, 69; surface the error in component state if not already (it likely is — verify during Audit)
- `supabase/config.toml` — remove any entry for `create-portal-session` if present (verify during Audit)

**Deletions:**
- `supabase/functions/create-portal-session/` — entire directory removed via `git rm -r`

**No edits expected:**
- Any `src/components/`, `src/pages/` not listed above
- Any `src/repositories/`
- Any `src/i18n/locales/`
- Any test files (no test changes; existing test suite must continue passing)

---

## Acceptance criteria

- [ ] `.env.example` contains zero live keys — only placeholders. Verify via `grep -E 'sk_test_|sk_live_|pk_test_51|whsec_[a-f0-9]{20}' .env.example` returns no matches (the literal string `pk_test_xxxxxxxx` is OK as placeholder)
- [ ] `supabase/functions/create-portal-session/` directory does not exist
- [ ] `supabase/config.toml` has no `create-portal-session` entry
- [ ] Frontend can still invoke `create-billing-portal-session` from `BillingSettingsPage.tsx` and `SubscribePage.tsx` (no regression)
- [ ] Zero `console.*` in `useSubscription.ts`
- [ ] Zero `console.*` in `useClientMutations.ts`
- [ ] Zero `console.*` in `useCreatePropertyForm.ts`
- [ ] Zero `console.*` in `StripeConnectPage.tsx`
- [ ] Error states in those four files still surface to the UI via existing channels (mutation `error`, component state) — verify by reading the consuming components/pages
- [ ] Subscription checkout flow still works end-to-end in dev preview (manual check)
- [ ] All Stop Hook checks pass: typecheck, build, lint, test, check:i18n
- [ ] TruffleHog CI scan (security-scanning job in `ci-guardrails.yml`) finds zero secrets

---

## Regression checks

- [ ] `BillingSettingsPage` opens billing portal successfully
- [ ] `SubscribePage` checkout button works
- [ ] Create-client form still surfaces errors to the user when the repository call fails
- [ ] Create-property form still surfaces errors to the user when the repository call fails
- [ ] Stripe Connect onboarding flow still works
- [ ] No new TypeScript `any` introduced

---

## Stop Hook requirements

Run in order, paste output into `## Run Results — [date]` section at the bottom of this bead file:

1. `npm run typecheck`
2. `npm run build`
3. `npm run lint`
4. `npm run test`
5. `npm run check:i18n`
6. `grep -rE 'sk_test_|sk_live_|whsec_[a-f0-9]{20}' .env.example` — must return no matches

Plus **operator (Seb) action — out of Polecat scope**:
- Rotate the Stripe test keys in the Stripe Dashboard immediately after merge
- Update the production Supabase Edge Function secrets if any test keys were leaking there

---

## Notes for the executing Polecat

- These four issues are bundled because they're all small, all P0/P1, and they all benefit from a single Stop Hook run rather than four separate ones.
- Do NOT add a logging library to replace the `console.*` calls. The fix is *removal*, not replacement. Errors already propagate through React Query's mutation state and component-local state.
- The `console.warn` calls in `googleMaps.ts` and `stripe.ts` are out of scope. Do NOT touch them.
- The `console.error` in `i18n/index.ts:30` is out of scope. Do NOT touch it.
- Stripe key rotation is Seb's ops responsibility. Mention it in the PR description as a reminder.

---

## Mayor handoff log

- 2026-04-29: Bead authored by claude.ai Cowork acting as Mayor. Awaits Polecat assignment.
