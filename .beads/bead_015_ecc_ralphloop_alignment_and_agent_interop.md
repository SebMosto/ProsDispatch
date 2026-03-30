# Bead: ECC + Ralph Loop Alignment and Agent Interop
**Bead ID:** bead_015
**Status:** Blocked
**Depends on:** bead_014 (in progress)

## Context

Project workflow must remain stable when switching between Cursor and Claude Code
Terminal. ECC is already used in terminal workflows, but interoperability rules were
not documented in a tool-agnostic way inside the repository.

## Changes

1. Add `docs/AGENT_INTEROP.md` as the canonical interop/handoff standard.
2. Add an interoperability addendum to `TASK_PROTOCOL.md` so Ralph Loop remains
   mandatory while allowing ECC accelerators.
3. Add a cross-agent interoperability section to `AGENTS.md`.
4. Log handoff and follow-on work in `.beads/beads.jsonl`.

## Acceptance

- Interop rules exist in-repo and are explicit.
- Ralph Loop remains the governing process.
- Both Cursor and Claude Terminal can continue from the same bead state without
  relying on chat memory.

## Blocker

Stop Hook cannot fully pass due pre-existing repository baseline failures outside this
bead's scope:

- lint error in `tests/timing-test.spec.ts` (`no-explicit-any`)
- existing failing tests in `src/pages/SettingsPage.test.tsx`
- existing failing tests in `src/repositories/clientRepository.test.ts`
- existing failing tests in `src/repositories/propertyRepository.test.ts`

## Follow-on

Once baseline is restored to green, close bead_015 and continue bead_014 authenticated
9-step E2E run after credentials are available.
