# AGENT_INTEROP.md

## Purpose

This document defines how work is handed between Cursor and Claude Code Terminal
without losing context, violating scope, or breaking the Ralph Loop.

Use this with `TASK_PROTOCOL.md`. If there is conflict, `TASK_PROTOCOL.md` wins.

## Interop Operating Model

- Ralph Loop is mandatory for every agent: Audit -> Plan -> Execute -> Verify -> Log.
- `.beads/beads.jsonl` is the only task-state source of truth.
- Bead spec files are the only scope source of truth.
- Tool-specific memory is not trusted; repository state is trusted.

## ECC + Ralph Loop Alignment

ECC capabilities are used as accelerators, not as replacements for process:

- ECC skills and commands map to Ralph Loop stages.
- ECC subagents may assist with Audit and Verify, but decisions are logged in beads.
- ECC hooks may automate checks, but Stop Hook completion must still be explicit.

Required stage mapping:

1. Audit: read required files from `TASK_PROTOCOL.md`.
2. Plan: document minimum-file change set before editing.
3. Execute: implement only scoped changes.
4. Verify: run full Stop Hook in required order.
5. Log: update bead history, close bead, open next bead when needed.

## Required Handoff Packet

Every agent switch must include all items below in the active bead history or in
the current bead spec file:

- Current bead ID and status (`open`, `in_progress`, `blocked`, `closed`)
- What was completed in this session
- What remains, with one next action
- Exact files touched
- Verification state:
  - `npm run typecheck`
  - `npm run build`
  - `npm run lint`
  - `npm run test`
  - `npm run check:i18n`
- Known blockers and required inputs (for example, missing credentials)

## Switch Checklist (Operator + Agent)

Before switching agents:

1. Save all edited files.
2. Update bead history with an explicit handoff line.
3. Confirm current bead status is accurate.
4. Confirm blocker state is explicit (if any).
5. Confirm next command is written exactly.

When resuming with another agent:

1. Re-run Audit order from `TASK_PROTOCOL.md`.
2. Compare bead spec status with `beads.jsonl` status and resolve mismatch.
3. Continue from the written next action; do not infer missing context.

## Handoff History Template

Use this plain-text format in bead history entries:

`Handoff: [agent] -> [agent] — done:[...] next:[...] files:[...] verify:[typecheck=?, build=?, lint=?, test=?, check:i18n=?] blockers:[...]`

## Non-Negotiables

- Never mark a bead `closed` without full Stop Hook pass.
- Never skip `.beads/beads.jsonl` update.
- Never rely on chat memory when repo state differs.
- Never expand scope without a new bead or explicit operator approval.

## ECC Usage In This Repository

ECC is installed at project scope under `.claude/` to give Cursor and Claude Terminal a
shared baseline.

Active rule sets:

- `.claude/rules/*` from ECC `common`
- `.claude/rules/*` from ECC `typescript`
- `.claude/rules/prosdispatch-governance-priority.md` (project override)

Active core skills:

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

Ralph Loop remains mandatory and authoritative. ECC does not replace any required step in
`TASK_PROTOCOL.md`.

Handoff expectation between Cursor and Claude Terminal:

- Continue from bead state in `.beads/beads.jsonl`, not chat memory.
- Include a complete handoff packet (done, next, files, verification state, blockers).
- If ECC advice conflicts with repository governance, repository governance wins.
