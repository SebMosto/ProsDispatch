# Bead: Gas Town integration into ProsDispatch governance — three-layer alignment

**Bead ID:** bead_022
**Status:** open
**Type:** governance + documentation + tooling
**Depends on:** bead_015 (ECC + Ralph Loop alignment, blocked but content delivered), bead_016 (ECC tooling baseline, closed)
**ROLES:** Mayor=claude.ai Cowork (Seb), Polecat=Cursor (recommended; doc-heavy work suits Cursor's larger context), Auditor=Gemini + Codex PR review + Stop Hook
**Created:** 2026-04-29

---

## Context

Pre-marketing audit (claude.ai Cowork, 2026-04-29) confirmed that ProsDispatch governance currently codifies two of the three operating layers:

- **ECC** — installed at project scope under `.claude/rules/` and `.claude/skills/` (per bead_016)
- **Ralph Loop** — defined in `TASK_PROTOCOL.md` and reinforced in `docs/AGENT_INTEROP.md` (per bead_015)

The third layer — **Gas Town** (Steve Yegge's multi-agent orchestration pattern: Mayor / Polecats / Auditor synchronized via git and `beads.jsonl`) — is operationally in use but not documented. Roles are not named, ambiguities are not resolved, and the system depends on the operator (Seb) to remember which agent does what. This bead formalizes Gas Town in the governance stack and deduplicates overlapping responsibilities across the three layers.

The integration is non-functional — no application code changes — but it materially reduces hallucination risk and removes documentation drift. Defends specifically against hallucination types H2 (stale state), H3 (scope creep), H6 (doc-vs-code drift), and H7 (cross-agent collision) per the defense matrix authored in this bead's deliverables.

**Out of scope (separate beads):**
- `bead_023` — Implement `npm run check:bead-scope` CI script (mechanical defense for H3)
- `bead_024` — First scheduled reconciliation maintenance bead (sets the cadence)

---

## Three-layer dedup principle (must be reflected in deliverables)

| Layer | Question it answers | Scope | Canonical artifact |
|---|---|---|---|
| ECC | What does good code look like? | Static, project-wide | `.claude/rules/` + skills |
| Ralph Loop | How does one agent process one task? | Per-bead procedure | TASK_PROTOCOL.md (5 stages) |
| Gas Town | Who has authority for what across agents? | System topology | Roles: Mayor / Polecat / Auditor |

When two layers appear to enforce the same concern, the deterministic one is canonical:

- Stop Hook is canonical for verification (ECC and Ralph Loop reduce to "did you run it?")
- `beads.jsonl` is canonical for task state (Ralph Log writes there)
- Bead allowlist is canonical for scope (Auditor blocks on violations)
- Mayor's bead spec is canonical for *what to build* (Polecat's Ralph Plan is *how to execute it*)

---

## Scope (file allowlist — no edits outside this list)

**New files:**
- `docs/governance/HALLUCINATION_DEFENSES.md`
- `docs/governance/GASTOWN_TOPOLOGY.md`

**Edits:**
- `docs/AGENT_INTEROP.md` — add a "Gas Town Topology" section that maps Mayor/Polecat/Auditor to specific tools (claude.ai Cowork, Cursor, Claude Code Terminal, Gemini, Codex, Stop Hook scripts); cross-reference `GASTOWN_TOPOLOGY.md`
- `TASK_PROTOCOL.md` — add `## 0. ROLE` preamble to the Cursor prompt template; clarify that Mayor authors beads and Polecat's Ralph "Plan" step is execution-planning only; tighten the "memory not trusted" rule with explicit Mayor-side audit requirement
- `AGENTS.md` — add a one-paragraph reference to Gas Town under "Cross-Agent Interoperability"; cross-reference `GASTOWN_TOPOLOGY.md`
- `.beads/bead_022_gastown_governance_integration.md` — append "Run Results" section with Stop Hook output

**Read-only references (no edits):**
- All existing bead spec files in `.beads/` — for examples of current Mayor/Polecat handoffs
- `docs/governance/MultiAgentProtocol.md` — verify no conflict with new Gas Town section

---

## Content requirements — `GASTOWN_TOPOLOGY.md` (new file)

Must include:

1. **Origin and credit** — Gas Town is Steve Yegge's multi-agent orchestration pattern; cite source for traceability
2. **Role definitions:**
   - **Mayor** — orchestrator/architect. Reads PRDs, decomposes work into beads, does not write code. In ProsDispatch this is **claude.ai Cowork** during planning sessions, or **Claude Code Terminal in plan mode** for repo-aware planning. There is exactly one Mayor per planning session.
   - **Polecat** — ephemeral worker. Picks up exactly one bead at a time, executes Ralph Loop, produces a candidate commit/PR. In ProsDispatch this is **Cursor (primary)** or **Claude Code Terminal (secondary)**. Polecats can run in parallel on independent beads, never on overlapping scope.
   - **Auditor** — gatekeeper. Checks Polecat output against the bead spec (scope), ECC standards (style/security), and Stop Hook (functional correctness). In ProsDispatch the Auditor is a composite: **Gemini + Codex PR review** (judgment) + **Stop Hook scripts** (deterministic) + **Seb's manual PR approval** (final).
3. **Authority hierarchy** — when role conflicts arise: Mayor > Polecat > Auditor for *spec authorship*; Auditor > Polecat for *merge authority*; ECC standards > all roles for *code quality* (no role can override ECC).
4. **Single Mayor rule** — at any moment, exactly one Mayor authors beads. Multiple Mayors on the same backlog produce H7 (cross-agent collision). When Seb switches Mayors (e.g., from claude.ai to Claude Code Terminal), the previous Mayor must close out their session in `beads.jsonl` before the next opens.
5. **Bead state machine** — `open` → `assigned` → `in_progress` → (`closed` | `blocked`). Note: current beads.jsonl uses `open`/`in_progress`/`closed`/`blocked`; this bead does NOT change the state machine, just documents it.
6. **Parallel Polecat coordination** — when two Polecats run concurrently, their bead allowlists must not intersect. Mayor verifies before assignment.
7. **Synchronization model** — `beads.jsonl` is the synchronization primitive (single file, line-delimited JSON, git-versioned). Polecats append to bead history; Mayor closes beads on PR merge.

---

## Content requirements — `HALLUCINATION_DEFENSES.md` (new file)

Must include the H1–H7 matrix verbatim from this bead's "Hallucination surfaces" analysis below, with at least one concrete example from ProsDispatch bead history per row, plus the named defense and the layer that owns it. Format:

| # | Type | Real example | Defense | Owning layer |
|---|---|---|---|---|
| H1 | Phantom files/columns | bead_011 / memory.md: `profiles.trade`, `tax_gst_rate` referenced but don't exist | Audit step + bead allowlist | Ralph Loop + Gas Town |
| H2 | Stale state | claude.ai memory said "96% complete with 3 P0 bugs"; reality (2026-04-29) showed bugs fixed via beads_011/014/017 | Repo state canonical; never quote memory | Gas Town + Ralph Loop Audit |
| H3 | Scope creep | bead_018 explicitly forbids fixing Pilot CTA inside Privacy/Terms work | File allowlist; Auditor blocks | Mayor + Gas Town |
| H4 | Wrong patterns | Cursor occasionally adds Next.js imports despite Vite stack | ECC rules + `check:stack` script | ECC + Stop Hook |
| H5 | Fabricated results | Stop Hook output must be pasted in bead history | Audit logs are evidence | Ralph Loop Log + Gas Town |
| H6 | Doc-vs-code drift | memory.md referenced `src/services/`, `src/routes/`, `src/vendor/` — none exist | Periodic reconciliation bead | Gas Town (Mayor schedules) |
| H7 | Cross-agent collision | `create-portal-session` vs `create-billing-portal-session` (duplicate Edge Functions) | Single Mayor; allowlist prevents overlap | Gas Town |

Plus a "How to use this document" section explaining: (a) read this before authoring a bead (Mayor) or executing a bead (Polecat); (b) when the Auditor blocks, the rejection notice should cite the H-number; (c) new patterns can be added but H1–H7 are non-negotiable.

---

## Content requirements — TASK_PROTOCOL.md edits

Add a `## 0. ROLE` section at the top of "What a Correctly Formed Cursor Prompt Looks Like":

```
## 0. ROLE
You are a Polecat in the Gas Town topology, executing exactly one bead under Ralph Loop.
- Mayor: [name of who authored the bead — typically claude.ai Cowork or Seb]
- Auditor: Gemini + Codex automated PR review + the Stop Hook scripts
- Your authority: implement the bead spec, nothing more, nothing less
- You do not author new beads. If you find out-of-scope work that needs doing,
  list it in your PR description for the Mayor to triage. Do not silently fix it.
- You do not skip Stop Hook. Output must be pasted into the bead's "Run Results" section.
```

Tighten the "memory not trusted" rule by adding to the "Non-Negotiables" or equivalent section:

> **Mayor-side audit requirement:** Before authoring any bead, the Mayor must conduct a fresh repo audit. Memory files (claude.ai memory, agent chat history, prior conversation context) are advisory only and must never be quoted as authoritative state. When in doubt, read git.

Cross-reference `GASTOWN_TOPOLOGY.md` and `HALLUCINATION_DEFENSES.md` from the existing "Cross-Agent Interoperability" reference.

---

## Content requirements — AGENTS.md edits

Add to the "Cross-Agent Interoperability" subsection of "Workflow Best Practices":

> **Gas Town Topology** — ProsDispatch operates the Gas Town multi-agent pattern: a single Mayor authors beads, Polecats (Cursor or Claude Code Terminal) execute one bead each under Ralph Loop, and the Auditor (Gemini + Codex PR review + Stop Hook scripts) gates merges. See `docs/governance/GASTOWN_TOPOLOGY.md` for role definitions and `docs/governance/HALLUCINATION_DEFENSES.md` for the H1–H7 defense matrix.

---

## Content requirements — AGENT_INTEROP.md edits

Add a new section after "Interop Operating Model" titled "Gas Town Topology" with:

1. One-paragraph summary of the three roles
2. Tool mapping table (Mayor → claude.ai Cowork or Claude Code in plan mode; Polecat → Cursor or Claude Code Terminal; Auditor → Gemini + Codex + Stop Hook)
3. Cross-reference to `GASTOWN_TOPOLOGY.md` for the canonical version
4. Explicit statement that Gas Town does NOT replace Ralph Loop — Ralph Loop is the Polecat's per-bead procedure within the Gas Town topology

---

## Acceptance criteria

- [ ] `docs/governance/GASTOWN_TOPOLOGY.md` exists with all 7 sections from "Content requirements" above
- [ ] `docs/governance/HALLUCINATION_DEFENSES.md` exists with the H1–H7 matrix and "How to use" section
- [ ] `docs/AGENT_INTEROP.md` includes a "Gas Town Topology" section that does not duplicate `GASTOWN_TOPOLOGY.md` content (cross-reference only)
- [ ] `TASK_PROTOCOL.md` Cursor prompt template includes `## 0. ROLE` preamble and the "Mayor-side audit requirement" non-negotiable
- [ ] `AGENTS.md` includes the Gas Town reference paragraph in the Cross-Agent Interoperability subsection
- [ ] No conflict introduced with `docs/governance/MultiAgentProtocol.md` (verify during Audit; if conflict found, file as a follow-up bead, do not silently resolve)
- [ ] No three-layer redundancy preserved — every concern in the dedup matrix has exactly one canonical owner; supporting layers reference the canonical, do not re-state it
- [ ] All Stop Hook checks pass: typecheck, build, lint, test, check:i18n
- [ ] EN/FR parity preserved (no i18n changes expected, but `check:i18n` must still pass)

---

## Regression checks

- [ ] No app code changes — `git diff src/` and `git diff supabase/` must be empty
- [ ] All existing beads remain valid — no retroactive changes to closed bead spec files
- [ ] `beads.jsonl` not edited by Polecat (Mayor's bridge updates it)
- [ ] No new dependencies added to `package.json`

---

## Stop Hook requirements

Run in order. Paste full output into a new "## Run Results — [date]" section at the bottom of `bead_022_gastown_governance_integration.md`:

1. `npm run typecheck` — must pass (governance-only edits, but TS files unchanged so this is a sanity check)
2. `npm run build` — must pass
3. `npm run lint` — must pass, no new warnings
4. `npm run test` — must pass, all 143+ tests
5. `npm run check:i18n` — must pass

Plus one **manual** Polecat-attested check:
- Read `GASTOWN_TOPOLOGY.md` and `HALLUCINATION_DEFENSES.md` end-to-end. Confirm: (a) no duplication of content already in `TASK_PROTOCOL.md`; (b) every H-number references a real bead history example; (c) the three-layer dedup principle is preserved without contradiction.

---

## Notes for the executing Polecat

- This is documentation-only work. Resist the urge to add code or scripts — bead_023 is reserved for the `check:bead-scope` script, which is the only mechanical addition this analysis recommends.
- The `HALLUCINATION_DEFENSES.md` H-numbers (H1–H7) become the citation system for future Auditor rejections. Keep the numbering stable.
- When you cross-reference between docs, link by relative path (e.g., `[GASTOWN_TOPOLOGY.md](./GASTOWN_TOPOLOGY.md)`), not absolute. The repo moves between machines.
- If you find that an existing governance doc contradicts what's being added (especially `docs/governance/MultiAgentProtocol.md`), do NOT resolve it silently. File a follow-up bead in your PR description and let the Mayor decide.
- Tone: ProsDispatch governance writing is direct, GC-policy-influenced, and prefers tables over prose for normative content. Match the existing style.

---

## Mayor handoff log

- 2026-04-29: Bead authored by claude.ai Cowork acting as Mayor. Awaits Polecat assignment by Seb. No code changes yet. `.beads/beads.jsonl` entry to be added by Seb at handoff time. The three-layer dedup analysis was delivered to Seb in the same Cowork session that produced this bead — see chat history for the full reasoning.
