# Bead: Install ECC tooling baseline for cross-agent workflow
**Bead ID:** bead_016
**Status:** Closed
**Depends on:** bead_015 (blocked baseline unrelated)

## Context

ECC and Ralph Loop interoperability is already documented in-repo. This bead installs a
clean ECC baseline so Cursor and Claude Code Terminal use the same practical tooling
surface without changing application feature code.

## Scope

- Install project-level ECC rules and skills only (no app feature code changes)
- Keep Ralph Loop authoritative (`TASK_PROTOCOL.md` + `AGENTS.md`)
- Preserve repository governance whenever ECC defaults differ
- Document operational usage and handoff expectations

## Planned Changes

1. Add `bead_016` entry in `.beads/beads.jsonl` with status `in_progress`.
2. Install ECC rule packs into project `.claude/rules`:
   - common
   - typescript
3. Install ECC core skills into project `.claude/skills` (TS/JS workflow focused):
   - coding-standards
   - frontend-patterns
   - backend-patterns
   - tdd-workflow
   - e2e-testing
   - verification-loop
   - security-review
   - strategic-compact
   - iterative-retrieval
   - ai-regression-testing
   - search-first
4. Add project override rule to ensure repo governance has priority over generic ECC defaults.
5. Update interop docs with ECC usage for this repository.
6. Run Stop Hook and log results in `.beads/beads.jsonl`.

## Acceptance

- Project-level ECC install is present and enumerated.
- No conflict with `TASK_PROTOCOL.md`, `AGENTS.md`, `docs/AGENT_INTEROP.md`.
- Any conflict is explicitly resolved in favor of project governance.
- Stop Hook results are recorded in bead history.

## Verification

- `npm run typecheck` -> pass
- `npm run build` -> pass
- `npm run lint` -> pass (warnings only, zero errors)
- `npm run test` -> pass (26 files, 143 tests)
- `npm run check:i18n` -> pass

## Blocker

Resolved. Baseline lint/test blockers were fixed in test files without changing feature
code, then full Stop Hook passed.
