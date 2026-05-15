> **Before every task, read [TASK_PROTOCOL.md](./TASK_PROTOCOL.md).**
> It defines the mandatory Ralph Loop: Audit → Plan → Execute → Verify → Log.
> Every task must follow it. Every task must update `.beads/beads.jsonl`.

# AGENTS.md

> **Canonical Protocol for AI Agents working on ProsDispatch**
>
> *This document is the "Constitution" for all AI agents. Adherence to these protocols is mandatory. Failure to follow these rules will result in rejected code and wasted cycles.*

---

## 1. Project Context & Philosophy

**ProsDispatch** is a mobile-first, bilingual (EN/FR-CA) SaaS for Canadian contractors. It relies on a "Shadow Registry" architecture where homeowners interact via lightweight tokens, not full accounts.

### Tech Stack (Non-Negotiable)
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **State Management:** React Query (Server state), Context (Client state)
- **Validation:** Zod (localized schemas)
- **i18n:** i18next (EN/FR-CA)
- **Testing:** Vitest (Unit/Integration)

### Core Constraints
1.  **Mobile-First:** All UI must be designed for small screens first, then enhanced for tablet/desktop.
2.  **Offline-Tolerant:** The app must degrade gracefully when offline (using `idb-keyval` or similar strategies defined in specs).
3.  **Strict Security:** RLS is mandatory on all tables. Minimal PII storage.

---

## 2. Operational Protocols (Recurring Tasks)

Every AI agent must internalize these three roles/tasks. You may be asked to perform them explicitly, or you must perform them implicitly as part of your coding workflow.

### Task 1: The "Safety First" Protocol
*Trigger: Before every `submit` or final code handover.*

1.  **Type Check:** Run `npm run typecheck` to ensure no TypeScript regressions.
2.  **Lint Check:** Run `npm run lint`.
3.  **Unit Tests:** Run `npm test` (Vitest).
    *   *Rule:* If you modify a file, you **must** run its related test.
    *   *Rule:* If a test does not exist for new logic, you **must** create it.
4.  **No "Blind" Submissions:** Never submit code that hasn't been verified by the build tools.

### Task 2: The "Spec Compliance" Protocol
*Trigger: At the start of every task.*

1.  **Locate the Truth:** Identify the relevant SPEC file (e.g., `docs/MVP1_PRD.md`, `SPEC-002`).
2.  **Verify Alignment:** Ensure your proposed plan matches the spec exactly.
    *   *Example:* If the spec says "Status: Draft -> Sent", do not implement "Draft -> Pending".
3.  **Ambiguity Check:** If the user's request conflicts with the Spec, **STOP** and ask for clarification.
    *   *Prompt:* "The user request implies X, but SPEC-003 says Y. Please clarify."

### Task 3: The "Architecture Consistency" Protocol
*Trigger: When creating new files or refactoring.*

1.  **Follow the Pattern:**
    *   **Repositories:** Data access lives in `src/repositories/`. No direct Supabase calls in components.
    *   **Schemas:** Zod schemas live in `src/schemas/`.
    *   **Components:** UI components live in `src/components/`.
2.  **Atomic Changes (Bite-Sized):**
    *   Do not refactor the entire app in one go.
    *   Focus on one file or one logical unit at a time.
3.  **Clean Up:** If you see "dead code" or "magic numbers" in the file you are touching, fix them (The Boy Scout Rule), but *only* if it doesn't expand the scope dangerously.

---

## 3. Workflow Best Practices

### Cross-Agent Interoperability
When switching between Cursor and Claude Code Terminal, follow
`docs/AGENT_INTEROP.md` and log each handoff in `.beads/beads.jsonl`.
Never rely on tool memory over repository state.

### Mandatory Session-Start Protocol
*Trigger: The very first action of every session, before any
planning, SQL, prompt writing, or code review.*

1. **Read the bead log:** Open `.beads/beads.jsonl` and read
   the last 5 entries.
2. **Check for open beads:** If any bead has `"status":"open"`,
   that bead takes priority. Do not start new work until the
   open bead is addressed or explicitly deferred by the user.
3. **Classify the session:** Determine whether this is a
   diagnostic session (analysis only, no changes) or a build
   session (any SQL execution, Cursor prompt, code review, or
   file change).
4. **Open a bead before executing:** If the session is or
   becomes a build session, a new bead MUST be opened in
   `.beads/beads.jsonl` before the first action is taken.
   - Diagnostic sessions that produce no changes do not require
     a bead.
   - The moment a diagnostic session transitions to execution
     (e.g. "let's fix that now"), stop and open a bead first.
5. **No bead = no action:** Any SQL, Cursor prompt, migration,
   or file change executed without an open bead is a governance
   violation. The agent must self-correct by retroactively
   logging the bead before closing the session.

*Rationale: On 2026-05-15, a full build session (job list UI
overhaul, archive confirmation, sort control, data cleanup) was
executed without opening beads first. Beads were logged
retroactively. This protocol prevents recurrence.*

### How to Plan
1.  **Deep Planning:** Before coding, use `list_files` and `read_file` to understand the context.
2.  **Ask Questions:** If requirements are vague, use `request_user_input`.
3.  **Step-by-Step:** Break complex features into small implementation steps (e.g., 1. Schema, 2. Repository, 3. Hook, 4. UI).

### How to Code
1.  **Strict Types:** No `any`. Define interfaces in `src/types` or relevant files.
2.  **Localization:** Do not hardcode strings. Use `t('key')` and add keys to `src/i18n/locales/en.json` (and `src/i18n/locales/fr.json` placeholder).
3.  **Error Handling:** Always handle `error` states in UI and async operations.

### How to Verify
1.  **Read Your Changes:** Use `read_file` to inspect what you wrote.
2.  **Run the Build:** `npm run build` is the ultimate truth.

---

*This document is a living contract. Update it if new patterns or constraints are established.*
