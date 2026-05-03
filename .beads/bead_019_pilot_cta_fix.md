# Bead: Activate dead Pilot CTA on HomePage

**Bead ID:** bead_019
**Status:** open
**Type:** bug fix (UI) + minor i18n verify
**Depends on:** none (independent of bead_018, but touches same file — sequence after bead_018 to avoid merge conflict)
**ROLES:** Mayor=claude.ai Cowork (Seb), Polecat=Cursor or Claude Code Terminal, Auditor=Gemini + Codex PR review + Stop Hook
**Created:** 2026-04-29

---

## Context

Pre-marketing audit (claude.ai Cowork, 2026-04-29) found that the Pilot CTA button on `src/pages/HomePage.tsx` line ~230 — the prominent dark callout `home.pilot.cta` button styled with inline `background: #FF5C1B` — has full hover effects but no `onClick` handler. The button does literally nothing when clicked.

This is a marketing-blocker bug. The Pilot section is the conversion target you want pilot contractors to land on; if the CTA is dead, every dollar of campaign spend that lands on the Home page hits a wall.

The hero CTA at line ~144 navigates to `/register`. The Pilot CTA should match that behaviour — there is no separate pilot intake page in scope, and `/register` is where pilot contractors create their account.

**Memory note**: per claude.ai memory of prior session, the Pilot CTA was previously fixed via *inline React styles* (not Tailwind classes) because Tailwind utility classes were getting overridden in production. Preserve the inline-styles approach. Do not refactor to Tailwind.

---

## Scope (file allowlist — no edits outside this list)

**New files:**
- `src/pages/HomePage.test.tsx` (NEW — does not currently exist; create minimal render + click test)

**Edits:**
- `src/pages/HomePage.tsx` — add `onClick={() => navigate('/register')}` to the Pilot CTA button at line ~230; preserve all existing inline styles, hover handlers, and styling exactly as-is

**No edits expected:**
- `src/i18n/locales/en.json` (key `home.pilot.cta` already exists)
- `src/i18n/locales/fr.json` (parity already established)

---

## Acceptance criteria

- [ ] Pilot CTA button on HomePage navigates to `/register` on click
- [ ] All existing inline styles, hover handlers (onMouseOver / onMouseOut), and visual behaviour unchanged
- [ ] Test asserts: button exists with the correct accessible name from `t('home.pilot.cta')`, click navigates to `/register`
- [ ] Hero primary CTA still navigates to `/register` (regression check)
- [ ] Hero secondary CTA still navigates to `/login` (regression check)
- [ ] Pricing CTA still navigates to `/register` (regression check)
- [ ] No new `console.*` calls
- [ ] No Tailwind refactor of the Pilot button — inline styles preserved
- [ ] All Stop Hook checks pass: typecheck, build, lint, test, check:i18n

---

## Stop Hook requirements

Run in order, paste output into `## Run Results — [date]` section at bottom of this bead file:

1. `npm run typecheck`
2. `npm run build`
3. `npm run lint`
4. `npm run test` — including the new `HomePage.test.tsx`
5. `npm run check:i18n`

Plus one **manual** Polecat-attested check:
- Run `npm run preview`, open `/`, click the Pilot CTA, confirm navigation to `/register`.

---

## Notes for the executing Polecat

- This is a one-line fix. Do not freelance. Do not refactor the surrounding section. Do not add a separate pilot landing page (that's a future bead if Seb decides he wants one).
- The Pilot CTA button starts around line 228 in HomePage.tsx. Use the existing `navigate` from `useNavigate()` already imported at the top of the file (line 3).
- If you find any other dead buttons on HomePage during your Audit, **do not silently fix them**. List them in your PR description for the Mayor to triage.

---

## Mayor handoff log

- 2026-04-29: Bead authored by claude.ai Cowork acting as Mayor. Awaits Polecat assignment.
