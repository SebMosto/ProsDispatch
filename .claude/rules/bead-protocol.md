# Bead Protocol — Mandatory Compliance

Every file edit made by this agent must be covered by an open bead.

## The Rule (in order)

1. Before any Edit or Write, confirm a bead with "status":"open" exists in
   .beads/beads.jsonl
2. If none exists, open one with a meaningful title and scope — then edit
3. One bead per task — do not reuse or extend a bead from a prior task
4. Close the bead only after all quality gates pass:
   npm run typecheck && npm run build && npm run lint &&
   npm run test && npm run check:i18n && npm run check:schema

## What counts as a valid open bead

An entry in .beads/beads.jsonl where:
- "status" is "open"
- "title" describes the actual work (not a placeholder like "work" or "bypass")

## Excluded paths — no bead required

- .beads/beads.jsonl — you must be able to open the bead
- .claude/ — settings, rules, hooks, and memory files

## Why this exists

bead_039 and bead_040 were opened retroactively after edits were already made.
Retroactive beads defeat the audit trail. The bead must precede the work, not follow it.
The PreToolUse hook enforces the mechanical order; this rule covers qualitative expectation.
