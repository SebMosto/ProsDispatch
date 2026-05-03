# Bead: Privacy Policy + Terms of Service for Quebec Law 25 launch readiness

**Bead ID:** bead_018
**Status:** open
**Type:** feature + content + governance
**Depends on:** bead_014 (closed), bead_016 (closed)
**Mayor:** claude.ai Cowork (Seb)
**Owner:** Polecat (Cursor) — to be assigned
**Created:** 2026-04-29

---

## Context

Pre-marketing audit (claude.ai Cowork, 2026-04-29) found that `src/pages/HomePage.tsx` lines 278–282 render the `terms`, `privacy`, and `contact` footer items as plain `<button>` elements with no `onClick` and no destination routes. ProsDispatch is a Quebec-first SaaS that processes contractor PII and their clients' contact and address data — which puts it squarely under *An Act respecting the protection of personal information in the private sector* ("Law 25").

Without a published Privacy Policy, Terms of Service, and explicit consent capture at sign-up, the application cannot ship to pilot or paying customers without exposing Seb (as data controller) to enforcement risk from the Commission d'accès à l'information (CAI).

This bead delivers **Tier 1** of legal page coverage: the contractor-facing Privacy Policy and Terms of Service, plus consent capture in the sign-up flow.

**Out of scope (separate beads):**
- `bead_019` — Activate dead Pilot CTA on HomePage
- `bead_020` — Data Processing Agreement annex covering the contractor's clients' data flowing through the system (ProsDispatch as processor, contractor as controller)
- `bead_021` — Cookie banner / non-essential tracking consent (only required if/when analytics or ad tech is added; current stack has none)
- Final legal counsel review — Seb's responsibility before public launch. This bead delivers a defensible boilerplate, **not** final published copy.

---

## Scope (file allowlist — no edits outside this list)

**New files:**
- `src/pages/legal/PrivacyPolicyPage.tsx`
- `src/pages/legal/TermsPage.tsx`
- `src/pages/legal/PrivacyPolicyPage.test.tsx`
- `src/pages/legal/TermsPage.test.tsx`

**Edits:**
- `src/App.tsx` — add `/privacy` and `/terms` routes inside `PublicLayout`, lazy-loaded like other pages
- `src/pages/HomePage.tsx` — replace footer button stubs (lines 278–282) with `react-router-dom` `Link` components pointing to `/privacy` and `/terms`; `contact` link can route to `mailto:` for now
- `src/pages/auth/SignUpPage.tsx` — add two required consent checkboxes (privacy + terms) blocking submit until both checked, with link-out to `/privacy` and `/terms`
- `src/i18n/locales/en.json` — add `legal.privacy.*`, `legal.terms.*`, `auth.signUp.consent.*` keys
- `src/i18n/locales/fr.json` — full FR-CA parity for all keys above

**Read-only references (no edits):**
- `docs/COPY_STYLE_GUIDE.md` — for tone alignment
- `docs/governance/AGENTS.md` and `TASK_PROTOCOL.md` — for Ralph Loop compliance

---

## Content requirements — Privacy Policy

Must include the following Law 25-mandated sections:

1. **Identity of the data controller** — "ProsDispatch" with named privacy officer (Seb Mostovac) and contact email
2. **Purposes of collection** — account creation, service delivery, payment processing, billing, transactional email
3. **Categories of personal information collected** — email, name, business name, RBQ number (if provided), payment information (processed by Stripe, not stored), invoice and job content
4. **Third parties with whom information is shared** — Supabase (hosting / database, ca-central-1), Stripe (payments), Resend (transactional email), Vercel (frontend hosting + edge)
5. **Cross-border transfer disclosure** — Supabase ca-central-1 keeps data in Canada; Stripe and Resend may process in the United States; explicit user notice required by Law 25 § 17
6. **Retention period** — concrete duration (recommend: "for the life of the account, plus seven years for tax records as required under federal and Quebec tax law")
7. **Data subject rights** — access, rectification, deletion, portability (mandatory since Sept 2024), withdrawal of consent
8. **How to exercise those rights** — email contact + 30-day response commitment per Law 25 § 32
9. **Complaint mechanism** — Commission d'accès à l'information (CAI) named explicitly with contact info
10. **Privacy officer contact** — name and email
11. **Effective date and last updated date**

---

## Content requirements — Terms of Service

1. Service description (job management, client/property records, invoicing, payments)
2. Account eligibility — Canadian contractors, age 18+
3. Subscription and payment terms — pilot pricing during pilot period, post-pilot tier structure, refund policy
4. Acceptable use — explicit no-bidding / no-escrow / no-marketplace clause to match repository governance
5. Contractor's responsibilities for their own clients' data — placeholder pointing to future DPA (bead_020)
6. Stripe Connect terms — direct charge model, contractor is merchant of record
7. Limitation of liability — capped at fees paid in trailing 12 months
8. Governing law — Quebec, Canada
9. Dispute resolution — Quebec courts; arbitration optional clause
10. Termination — by user (any time), by ProsDispatch (with cause + 30 days notice except for breach), data export window (30 days post-termination)
11. Modifications — 30-day notice for material changes via email and in-app banner
12. Effective date and last updated date

---

## Critical Law 25 implementation notes

- **French is canonical.** Per Charter of the French Language § 51, FR copy is the version that legally binds; EN is the translation. The published page must default to FR for users with `Accept-Language: fr-*` (already handled by `i18next-browser-languagedetector`); the EN version must include a footer note acknowledging FR is canonical: *"This English version is provided for convenience. The French version is the legally binding text."*
- **Privacy Policy must be linked from sign-up, landing footer, and the dashboard footer.** This bead covers sign-up + landing; dashboard footer link should already exist via the AppShell footer — verify during Audit.
- **Consent must be explicit and granular.** A single "I agree to everything" checkbox is the legal minimum but the CAI prefers separate checkboxes. Implement two: one for ToS, one for Privacy Policy. Both required.
- **No telemetry on legal pages.** They should be static load-once content with no analytics, no pixels, no third-party scripts. Defense in depth.
- **All substantive legal claims must be marked.** Wrap any sentence making a binding legal commitment in an HTML comment in the i18n source: `<!-- LEGAL_REVIEW_REQUIRED -->`. This lets `grep -rn 'LEGAL_REVIEW_REQUIRED' src/i18n/` produce the punch list for Seb's lawyer.

---

## Acceptance criteria

- [ ] `/privacy` and `/terms` routes resolve and render in both EN and FR via the existing language switcher
- [ ] Both pages include all sections listed under "Content requirements" above
- [ ] HomePage footer links navigate correctly — `terms`, `privacy`, `contact` are no longer dead `<button>` elements
- [ ] SignUp form has two required checkboxes (Privacy + Terms) with `<Link>` to the respective pages; submit button is disabled until both are checked
- [ ] Submit is blocked at the form layer AND the consent state is required by the Zod schema (defense in depth)
- [ ] French is canonical — EN footer note in place on both legal pages
- [ ] All Law 25 mandatory disclosures present (Privacy Policy sections 1–11)
- [ ] All `LEGAL_REVIEW_REQUIRED` markers are in i18n source, not in `.tsx` files (so legal review can grep the locale files only)
- [ ] No new `console.*` calls introduced anywhere
- [ ] EN/FR parity for every new key — verified by `npm run check:i18n`
- [ ] Render tests for both legal pages (assert key sections present in both languages)
- [ ] SignUp test asserts: submit blocked without consent → submit enabled with both consents → form submits successfully

---

## Regression checks

- [ ] HomePage hero primary CTA still navigates to `/register`
- [ ] HomePage hero secondary CTA still navigates to `/login`
- [ ] HomePage pricing CTA still navigates to `/register`
- [ ] HomePage Pilot CTA — **do not silently fix** (it's bead_019 scope); leave as-is or add a `TODO: bead_019` comment
- [ ] SignUp flow still works end-to-end for users who DO check both boxes
- [ ] `/login` and `/forgot-password` flows unaffected
- [ ] Subscription gate behaviour unchanged
- [ ] No changes to job, client, property, invoice, or payment flows
- [ ] No new dependencies added to `package.json`

---

## Stop Hook requirements

Before logging closure in `.beads/beads.jsonl`, paste the full output of each into the bead history:

1. `npm run typecheck` — clean
2. `npm run build` — clean
3. `npm run lint` — clean, no new warnings
4. `npm run test` — all passing, including the two new test files
5. `npm run check:i18n` — EN/FR parity confirmed
6. **Manual check (Polecat-attested):** open `/privacy` in dev preview at both `?lng=en` and `?lng=fr`, scroll, confirm all 11 sections render
7. **Manual check (Polecat-attested):** open `/register`, attempt submit without checking either consent box → assert button is disabled and form does not submit; check both → assert form submits

If any Stop Hook step fails, **do not** close the bead. Add findings to the history and either iterate (Ralph Loop) or escalate to Mayor via PR comment.

---

## Notes for the executing Polecat

- **Do NOT publish final legal copy without Seb's explicit sign-off.** Use the boilerplate structure as scaffolding. Every substantive legal claim wrapped in `<!-- LEGAL_REVIEW_REQUIRED -->` is a flag for Seb's counsel before public launch.
- **Tone:** direct, French-first, RBQ-credible. Reference `docs/COPY_STYLE_GUIDE.md` (COPY-001).
- **Privacy officer email placeholder:** `privacy@prosdispatch.com` — Seb confirms or replaces during PR review.
- **Effective date:** hard-code `2026-04-29` in i18n keys; future updates change i18n only.
- **Stripe Connect merchant-of-record clause:** language must clearly state contractor is the merchant; ProsDispatch is platform. This is non-negotiable for the direct-charge model.
- **No marketplace language anywhere** — no "find contractors", "match", "bid", "proposal". Repository governance script `npm run check:forbidden` will fail the build if any of those words sneak in.

---

## Mayor handoff log

- 2026-04-29: Bead authored by claude.ai Cowork acting as Mayor. Awaits Polecat assignment by Seb. No code changes yet. `.beads/beads.jsonl` entry to be added by Seb at handoff time.
