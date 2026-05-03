# Bead: beads.jsonl reconciliation — close stale beads superseded by 014/016

**Bead ID:** bead_027
**Status:** open
**Type:** governance hygiene (queue cleanup, no code changes)
**Depends on:** none — should run FIRST before any other bead this session
**ROLES:** Mayor=claude.ai Cowork (Seb), Polecat=Cursor or Claude Code Terminal, Auditor=Gemini + Codex PR review + Stop Hook (light)
**Created:** 2026-04-29

---

## Context

Pre-marketing audit (claude.ai Cowork, 2026-04-29) found that `.beads/beads.jsonl` is out of sync with the actual code state. Three beads carry stale statuses despite their underlying work having been resolved by later beads:

| Bead | Current jsonl status | Reality | Resolved by |
|---|---|---|---|
| `bead_012_post_save_e2e` | `open` | E2E flow now passes per bead_014 close note (2026-03-31): "authenticated 9-step E2E passes on Desktop/Tablet/Mobile" | bead_014 |
| `bead_013_e2e_rerun` | `blocked` | Same — bead_014 explicitly took over and resolved | bead_014 |
| `bead_015_ecc_ralphloop_alignment_and_agent_interop` | `blocked` | ECC docs/install completed; baseline was unblocked by bead_016 | bead_016 |

Today is 2026-04-29 — these have been stale for 4 weeks. Any new Polecat reading the queue will inherit confused state, which is **hallucination type H2 (stale state assumption)** and **H6 (doc-vs-code drift)** per the defense matrix in bead_022.

This bead closes the three stale beads with explicit "superseded by" entries. **No application code is touched.**

The `prosdispatch-governance-priority.md` rule says "Never mark a bead `closed` without explicit Stop Hook results." This bead satisfies that rule by **citing the superseding bead's Stop Hook pass** rather than running a fresh one — because zero code changed, a fresh Stop Hook run would be theatre. The cited Stop Hooks are real and recorded in the superseding beads' histories.

---

## Scope (file allowlist — no edits outside this list)

**Edits:**
- `.beads/beads.jsonl` — change `bead_012_post_save_e2e`, `bead_013_e2e_rerun`, and `bead_015_ecc_ralphloop_alignment_and_agent_interop` from their current stale statuses to `closed`; append history entries citing supersession
- `.beads/bead_012_post_save_e2e.md` — append closure section with cross-reference
- `.beads/bead_013_e2e_rerun.md` — same
- `.beads/bead_015_ecc_ralphloop_alignment_and_agent_interop.md` — same

**No edits expected:**
- Any `src/`, `supabase/`, `tests/`, `docs/`
- `package.json`
- `.beads/bead_014*.md` or `.beads/bead_016*.md` (their close history is the evidence; do not retroactively edit closed beads)

---

## Required history entries (exact format)

For `bead_012_post_save_e2e` in `beads.jsonl`, append to the `history` array:

```
"Closed by reconciliation 2026-04-29 — superseded by bead_014. The full 9-step authenticated E2E flow that bead_012 was created to verify is confirmed passing on Desktop/Tablet/Mobile per bead_014 close history (2026-03-31). No fresh Stop Hook required because no code changed in this reconciliation; cite bead_014's Stop Hook pass as evidence per prosdispatch-governance-priority.md."
```

For `bead_013_e2e_rerun` in `beads.jsonl`, append:

```
"Closed by reconciliation 2026-04-29 — superseded by bead_014. bead_013 was BLOCKED on the same authenticated E2E flow that bead_014 explicitly took over and resolved. See bead_014 close note (2026-03-31) for Stop Hook evidence."
```

For `bead_015_ecc_ralphloop_alignment_and_agent_interop` in `beads.jsonl`, append:

```
"Closed by reconciliation 2026-04-29 — superseded by bead_016. The ECC + Ralph Loop documentation work and baseline install were completed; bead_016 unblocked the Stop Hook by resolving baseline test/lint failures and verified Stop Hook PASS (typecheck, build, lint, test, check:i18n) on 2026-03-30. ECC alignment is in production governance."
```

In each of the three `.md` spec files, append a section at the bottom:

```
---

## Closure — Reconciliation 2026-04-29

This bead is closed by reconciliation as part of bead_027. Superseded by bead_NNN.
See `.beads/beads.jsonl` history entry for the full close note. No code changed in this
reconciliation; the superseding bead's Stop Hook is cited as evidence per
`prosdispatch-governance-priority.md`.
```

(Replace `bead_NNN` with the correct superseding bead in each file.)

---

## Acceptance criteria

- [ ] `bead_012_post_save_e2e` status in `beads.jsonl` is `closed` with the exact reconciliation history entry above appended
- [ ] `bead_013_e2e_rerun` status in `beads.jsonl` is `closed` with its reconciliation history entry
- [ ] `bead_015_ecc_ralphloop_alignment_and_agent_interop` status in `beads.jsonl` is `closed` with its reconciliation history entry
- [ ] The three `.md` spec files each have an appended "Closure — Reconciliation 2026-04-29" section
- [ ] No other beads in `beads.jsonl` were modified (verify via `git diff .beads/beads.jsonl` — three lines changed only)
- [ ] No `src/`, `supabase/`, `tests/`, `docs/`, or `.github/` files modified (verify via `git diff` — only `.beads/` changes shown)
- [ ] `beads.jsonl` is still valid line-delimited JSON (each line parses; verify by reading every line back)
- [ ] All Stop Hook checks pass (light pass — no code changed, but run anyway for governance evidence)

---

## Stop Hook requirements

Run in order, paste output into a `## Run Results — 2026-04-29` section at the bottom of this bead file:

1. `npm run typecheck` — should be unchanged (no TS edits)
2. `npm run build` — should be unchanged
3. `npm run lint` — should be unchanged
4. `npm run test` — should be unchanged
5. `npm run check:i18n` — should be unchanged
6. `node -e "require('fs').readFileSync('.beads/beads.jsonl','utf8').split('\n').filter(Boolean).forEach((l,i) => { try { JSON.parse(l); } catch(e) { throw new Error('Line ' + (i+1) + ' invalid JSON: ' + e.message); }})"` — JSONL validity check, must exit 0

---

## Notes for the executing Polecat

- This is the **first bead to run** in the current launch sequence, before bead_022, 025, 019, 018, 026. Reason: closing the queue's stale state prevents confusion downstream.
- Do not retroactively edit `bead_014_*` or `bead_016_*` spec files — they are closed and their history is the evidence base for this reconciliation.
- Do not introduce any new bead in this work. If you find more stale beads during your Audit, list them in the PR description for the Mayor to handle in a future reconciliation cadence.
- `beads.jsonl` is line-delimited JSON — preserve formatting exactly (one JSON object per line, no trailing comma, no whitespace between lines).

---

## Mayor handoff log

- 2026-04-29: Bead authored by claude.ai Cowork acting as Mayor. Awaits Polecat assignment. **Run this first** in the launch sequence.
- 2026-04-30: Polecat (Claude Code Terminal) executed all .beads/ edits. Stop Hook blocked on pre-existing lint error in invoiceRepository.ts:108 (not introduced by this bead). See Run Results below.

---

## Run Results — 2026-04-30

### 1. npm run typecheck
```
> pros-dispatch@0.0.0 typecheck
> tsc --noEmit
```
**PASS** (zero errors)

### 2. npm run build
```
> pros-dispatch@0.0.0 build
> tsc -b && vite build

vite v7.3.1 building client environment for production...
✓ 1985 modules transformed.
✓ built in 4.61s
(!) Some chunks are larger than 500 kB after minification. (pre-existing warning)
```
**PASS** (zero errors; chunk-size warning is pre-existing)

### 3. npm run lint
```
> pros-dispatch@0.0.0 lint
> eslint .

src/repositories/invoiceRepository.ts
  108:9  error  'query' is never reassigned. Use 'const' instead  prefer-const

src/components/jobs/CreateJobForm.tsx
  46:28  warning  Compilation Skipped: Use of incompatible library (react-hooks/incompatible-library)

src/lib/auth.tsx
  26:14  warning  Fast refresh only works when a file only exports components  react-refresh/only-export-components
  33:14  warning  (same)
  175:14 warning  (same)

src/lib/router.tsx
  1:41   warning  (same, 4 instances)

src/pages/clients/ClientEditPage.tsx
  77:26  warning  Compilation Skipped: Use of incompatible library (react-hooks/incompatible-library)

✖ 10 problems (1 error, 9 warnings)
```
**FAIL — 1 error** in `src/repositories/invoiceRepository.ts:108` (`prefer-const`).
This file is **outside the bead_027 allowlist** and was **not touched by this bead**.
Root cause: introduced by commit `d72bf40` (guard abortSignal calls in jobRepository and invoiceRepository).

### 4. npm run test
```
> pros-dispatch@0.0.0 test
> vitest run

 Test Files  26 passed (26)
       Tests  148 passed (148)
   Duration  8.64s
```
**PASS** (148/148)

### 5. npm run check:i18n
```
> pros-dispatch@0.0.0 check:i18n
> node scripts/check-i18n.cjs

✅ i18n verified.
```
**PASS**

### 6. JSONL validity check
```
JSONL valid — all lines parse cleanly
```
**PASS**

---

## BLOCKED: 2026-04-30

Stop Hook lint step fails with 1 error in `src/repositories/invoiceRepository.ts:108`:
`'query' is never reassigned. Use 'const' instead (prefer-const)`

This error is **pre-existing**, introduced by commit `d72bf40`, and is **outside this bead's allowlist**. All bead_027 .beads/ edits are complete and correct. The next Polecat run of bead_027 only needs a clean lint baseline to commit.

**Operator fix required before re-running bead_027:**
In `src/repositories/invoiceRepository.ts` line 108, change `let query` → `const query`.
This is a one-line change. It can be committed directly to main or as a micro-bead.