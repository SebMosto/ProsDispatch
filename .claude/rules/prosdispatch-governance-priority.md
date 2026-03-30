# ProsDispatch Governance Priority

This project applies ECC rules and skills as accelerators only.

When guidance conflicts, use this precedence order:

1. `TASK_PROTOCOL.md` (Ralph Loop is mandatory)
2. `AGENTS.md`
3. `docs/AGENT_INTEROP.md`
4. Project bead scope (`.beads/bead_*.md`)
5. ECC generic rules and skill defaults

Required enforcement:

- Never skip Audit -> Plan -> Execute -> Verify -> Log.
- Always update `.beads/beads.jsonl` for every task handoff or status change.
- Never mark a bead `closed` without explicit Stop Hook results.
- Keep changes within bead scope; do not alter unrelated feature code.
