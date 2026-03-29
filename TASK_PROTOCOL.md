# TASK_PROTOCOL.md
# ProsDispatch — Standard Task Protocol for All Agents

> **This file governs every task given to every agent (Cursor, Claude, Jules, or any future agent).**
> It is non-negotiable. It exists because piecemeal fixes without audit trails compound errors,
> waste cycles, and make QA impossible. Read it before accepting any task.

---

## The Rule in One Sentence

Every task must follow the Ralph Loop: **Audit → Plan → Execute → Verify → Log.**
No exceptions. No skipping steps. No partial commits.

---

## The Ralph Loop — Step by Step

### Step 1 — AUDIT (before writing a single line)

Read the following before doing anything else:

| What to read | Why |
|---|---|
| `.beads/beads.jsonl` | What has been built, what is in progress, what is open |
| The bead spec file for this task (`.beads/bead_NNN_*.md`) | Exact scope, acceptance criteria, out-of-scope boundaries |
| Every source file the task will touch | Never assume structure — always read first |
| `AGENTS.md` | Standing rules that cannot be violated |
| `docs/qa/reports/` latest report | What QA found last run — do not re-break passing flows |

If the bead spec file does not exist, **stop and ask the operator** before proceeding.
If the bead is already `closed` in `beads.jsonl`, **stop — this task is already done.**

**Parallel agent dispatch:** For beads touching 5+ files across multiple layers (e.g., repository + hook + component + schema + migration), consider launching parallel Read agents to explore each affected area simultaneously before writing a single line. This cuts audit time and surfaces cross-layer conflicts early. Revisit this guidance at bead_015 to evaluate whether it should become a hard rule.

### Step 2 — PLAN (before writing a single line)

Write out, in comments or a scratchpad, exactly what files will change and why.
For each file:
- What is the current behaviour?
- What is the target behaviour?
- What is the minimum change to get there?

If the minimum change requires touching more than 5 files, **flag it to the operator** before proceeding.
Scope creep is a bug.

### Step 3 — EXECUTE (minimum changes only)

- One logical unit at a time
- No refactoring unrelated code
- No new dependencies without operator approval
- No hardcoded strings — use `t('key')`, update both `en.json` AND `fr.json`
- No Supabase calls in components — use repositories only
- No auth lookups inside repositories — `contractor_id` comes from the call site

### Step 4 — VERIFY (the Stop Hook — all must pass)

Run in order. All must pass before any commit:

```bash
npm run typecheck   # zero TypeScript errors
npm run build       # zero build errors
npm run lint        # zero lint errors
npm run test        # all tests pass
npm run check:i18n  # no missing translation keys
```

If the Stop Hook fails 3 times on the same error: add `BLOCKED: [reason]` to the bead history
and notify the operator. Do NOT commit broken code.

### Step 5 — LOG (the paper trail — mandatory)

After Stop Hook passes, before committing, do all three of these:

**5a. Update `.beads/beads.jsonl`**

Find the bead for this task. Change `"status"` to `"closed"`. Append to its `history` array
a plain-English summary of exactly what changed and why:

```jsonl
{"id":"bead_NNN", "status":"closed", "history":[
  "...previous entries...",
  "Closed: [what changed] — [why it was needed] — [files touched] — build+typecheck verified"
]}
```

**5b. Open the next bead**

If this task produces follow-on work (QA needed, another fix needed, a feature to verify),
create `.beads/bead_NNN+1_description.md` and append to `beads.jsonl`:

```jsonl
{"id":"bead_NNN+1", "title":"...", "status":"open",
 "created_at":"[ISO date]", "history":["Opened by [agent] after bead_NNN — [reason]"]}
```

**5c. If QA should re-run after this task**, the next bead must be assigned to the QA agent
and must list exactly which flows to test.

**5d. Commit message format**

```
type(scope): short description — closes bead_NNN

- What changed and why (bullet per file or logical unit)
- Stop Hook: typecheck ✓ build ✓ lint ✓ test ✓
```

Example:
```
fix(repositories): remove auth.getSession() from create() — closes bead_011

- clientRepository.ts: contractorId now passed from hook, removed getSession() call
- propertyRepository.ts: same pattern applied
- useClientMutations.ts: passes user.id from AuthContext to repository
- Stop Hook: typecheck ✓ build ✓ lint ✓ test ✓
```

---

## What a Correctly Formed Cursor Prompt Looks Like

Every prompt handed to Cursor by the operator or by the QA agent must follow this structure:

```
## 1. AUDIT — read these files first (do not skip)
[list every file to read before touching anything]
[always include .beads/beads.jsonl and AGENTS.md]

## 2. CONTEXT — what is broken and why
[plain English root cause — no assumptions, evidence-based]
[reference the bead ID this fixes]

## 3. CHANGES — what to do
[specific, file-by-file instructions]
[explicit about what NOT to touch]

## 4. VERIFY — Stop Hook
npm run typecheck && npm run build && npm run lint && npm run test
All must pass before committing.

## 5. LOG — update the trail
- Close bead_NNN in .beads/beads.jsonl with history summary
- Open bead_NNN+1 for QA or next step
- Commit message must follow format above
```

---

## What Gets Filed If This Protocol Is Skipped

| Violation | Consequence |
|---|---|
| Committed code that breaks `typecheck` | P0 — revert immediately |
| Committed code without updating `beads.jsonl` | P1 — QA cannot run, trail is broken |
| Fixed one thing and broke another | P0 — regression, new bead opened |
| Changed files outside the bead scope | P1 — scope violation, must be reviewed |
| No next bead opened after a fix | P2 — QA has no target, pipeline stalls |

---

## Bead Status Reference

| Status | Meaning |
|---|---|
| `open` | Task defined, not started |
| `in_progress` | Agent is working on it right now |
| `closed` | Done, Stop Hook passed, committed, QA target opened |
| `blocked` | Stopped — reason logged in history — operator must unblock |

---

*This document is a living contract. It was formalised on 2026-03-20 after QA Run #1
identified that piecemeal fixes without audit trails were compounding errors.
Update it when new patterns are established — but only by adding, never by removing
the core Ralph Loop requirement.*
