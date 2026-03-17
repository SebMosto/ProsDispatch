# Governance Manifest

## Overview and Purpose

This **Governance Manifest** defines the unified rules and standards for the Dispatch MVP1 Restart (Option C execution model). It consolidates all project guardrails, design mandates, and multi-agent collaboration protocols into a single authoritative bundle. All team members and AI agents must adhere to this manifest to ensure the product is built **spec-first**, with high quality and no scope deviations.

* **Scope:** MVP1 (contractor-focused SaaS) rebuilt from a clean template per audit recommendation[\[1\]](file://file_0000000096a071f5add5619b963211bd#:~:text=The%20audit%20determined%20that%20the,while%20avoiding%20inherited%20technical%20debt). This governance bundle supersedes any previous ad-hoc practices.

* **Authority:** The top-level specification is **RESTART\_BRIEF\_ENTERPRISE.md** (enterprise version of the project brief). In case of any conflict, that enterprise brief's directives prevail. All governance policies here align to and enforce the Enterprise Brief's intent.

* **Bundle Contents:**

* *GOVERNANCE\_MANIFEST.md* (this document – overarching principles and constraints)

* *CI\_Guardrails.md* (CI/CD pipeline quality gates and enforcement rules)

* *MultiAgentProtocol.md* (coordination rules for AI agents like Codex, Gemini, Auditor)

* *UX-Responsive-01.md* (UX design pattern: Mobile-first responsive design guidelines)

## Core Principles and "Spec First" Doctrine

* **No Code Without a Spec:** *Every feature or code change must trace to a written requirement or design spec.* This "spec-based coding" doctrine is non-negotiable. Before any code is written, there must be a PRD, user story, or task definition in place. The absence of a spec is itself a governance violation.

* **Supremacy of Requirements:** The *RESTART\_BRIEF\_ENTERPRISE.md* and any approved PRDs define the product scope. Features outside the defined scope (e.g. marketplace flows that were explicitly ruled out[\[2\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Additionally%2C%20the%20absence%20of%20meaningful,that%20are%20safe%20to%20reuse)) are **forbidden**. The product vision and constraints in the Brief must be respected in all design and implementation decisions.

* **Progressive Scaffolding:** Development will follow a phased approach, building the foundation first and progressively adding features in controlled increments. The plan (Phase 1.0–1.4) is predefined (see MultiAgentProtocol §2). Developers and AI agents must implement functionality in the prescribed sequence – no premature building of later-phase features. This ensures alignment with the roadmap and prevents scope creep.

* **Continuous Verification:** All code and designs are continuously checked against this governance bundle. An AI Auditor agent and CI checks will enforce that no commit or merge violates the rules (e.g. adding a forbidden component will trigger an immediate block – see CI\_Guardrails). "Governance debt" (deviations from mandated practices) is treated with the same severity as technical debt.

## Active Laws / Spec Registry

* **SPEC-005: Monetization (SaaS Billing + Job Payments)** — **Critical (Enforced)**

* **SPEC-DESIGN-001: Design System (docs/DESIGN_SYSTEM.md)** — **Critical (Enforced)**

* **SPEC-DESIGN-002: Screen Specs (docs/SCREEN_SPECS.md)** — **Critical (Enforced)**

## Functional Scope & Constraints (MVP1)

This restart imposes strict functional boundaries to keep the product focused:

* **Contractor-Only MVP:** The application is for contractors managing jobs. End-users (homeowners) are out of scope for MVP1[\[3\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=3,%E2%9D%8C%20Marketplace%20browsing). No code or UI for homeowner flows shall be present.

* **No Marketplace Features:** Bidding, proposals, or multi-contractor marketplaces are **forbidden**[\[4\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Forbidden%20List%20,proposals%2C%20bidding%2C%20or%20escrow%20flows)[\[5\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Canonical%20Constraints%20for%20New%20Repo,EN%2FFR%20i18n). The MVP1 supports direct job assignment **only** (no open bidding on jobs). Any attempt to introduce bidding, escrow, or similar marketplace elements will be rejected in code review and CI.

* **No Escrow or Payment Vaulting:** Payment flows must use direct charges via Stripe Connect Standard – funds go directly to contractors[\[6\]](file://file_0000000096a071f5add5619b963211bd#:~:text=,EN%2FFR%20i18n). Implementing escrow accounts, held balances, or stored payment methods is not allowed in MVP1. The codebase must reflect this: e.g. no placeholder code for escrow or unused payment holding logic.

* **Geographic/Compliance Limits:** The product is constrained to **Canada-only** usage in MVP1. All content and features should comply with Canadian regulations and norms (e.g. tax calculation, privacy). Multi-province or international considerations are not required beyond ensuring the base design is extensible for the future.

## Technical Architecture Constraints

To ensure a clean, maintainable codebase, the following tech stack rules are codified (many derived from the audit findings):

* **Stack Choices (Locked):** Use **Vite \+ React 18 (TypeScript)** for the frontend and **Supabase (PostgreSQL \+ Auth \+ Storage)** for backend. Next.js or other frameworks are not permitted due to past incompatibilities[\[7\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=Top%205%20Issues)[\[8\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=%F0%9F%8E%AF%20Recommendation). No server-side runtime like Node/Express is expected except what Supabase edge functions cover. All code should run as a SPA \+ cloud backend model.

* **Approved Libraries:** Use the approved UI and utility libraries from the salvage list (Tailwind CSS with shadcn/ui components, Zod for schemas, etc.)[\[9\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Salvage%20List%20,%60docs%2FTESTING.md). New dependencies should be added cautiously and must not duplicate existing functionality. Outdated or deprecated packages flagged in the audit have been removed – reintroducing them violates governance.

* **Forbidden Code Patterns:**

* *Next.js or SSR patterns* – e.g. no getServerSideProps, no Next-specific auth helpers in this Vite app[\[10\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=1.%20%E2%9A%A0%EF%B8%8F%20,3%20packages%2C%203%20vulnerabilities).

* *Hardcoded secrets or URLs* – all configuration must come from environment variables. Hardcoding API keys or endpoints (as found in the old repo[\[7\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=Top%205%20Issues)) is strictly disallowed.

* *Deprecated Workarounds* – any hack that undermines platform standards (e.g. bypassing Supabase security by directly hitting PostgREST without auth) is not allowed. Follow recommended integration patterns documented by providers.

* **Reuse vs Rebuild:** Only approved modules from the old repository are to be copied into the new repo[\[9\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Salvage%20List%20,%60docs%2FTESTING.md). Everything on the forbidden list must not enter the new codebase[\[11\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Forbidden%20List%20,Hardcoded%20API%20keys). For example, the prior supabase integration code and any proposal-related modules were explicitly forbidden and must not resurface in any form. This ensures we carry over no technical debt.

## UX and Accessibility Requirements

User experience must be consistent, accessible, and localized from day one:

* **Mobile-First UX:** The application's design **must prioritize mobile devices** (smartphones) as the primary experience. Per **UX-Responsive-01** guidelines, all pages and features should be first designed for a small screen, then progressively enhanced for larger screens. No functionality should break or become unusable on a mobile viewport.

* **Responsive Enhancement:** While mobile is primary, the UI should gracefully expand for tablet and desktop. We allow slightly richer layouts on larger screens (e.g. side-by-side panels on tablets) as enhancements – but the core workflow and content remain the same. The design should **constrain desktop UIs** to avoid entirely different experiences; wide screens can show more whitespace or panels, but not introduce new features. Consistency across devices is key.

* **Admin Portal Exception:** An internal Admin interface (if any) may be designed **desktop-first** given its likely usage, but it **must degrade gracefully on mobile**. That means an admin should still *technically* be able to perform critical actions on a phone if needed, even if not optimally laid out. Under no circumstances should any part of the system be completely unusable on a modern mobile device.

* **Localization:** Bilingual support **EN and FR-CA** is **mandatory**. Every user-facing string must be externalized for translation. French (Canada) content should be of equal quality to English. The app should detect or allow selection of French, and all UI, emails, and PDFs must appear in the chosen language. This requirement is foundational, not a nice-to-have[\[12\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Week%203%3A%20Polish%20%26%20Testing,12%20hours)[\[13\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%2015,Test%20language%20switching). Governance mandates that any new UI text added must have a corresponding entry in the i18n files – untranslated strings in UI are a CI failure (P0 issue).

* **Accessibility (WCAG 2.1 AA):** Accessibility is not optional; it's a fundamental requirement from the start. All UIs must meet WCAG 2.1 AA standards. This includes proper semantic HTML structure, keyboard navigability, sufficient color contrast, and support for screen readers. We will run automated a11y tests (axe-core) as part of CI[\[14\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,Test%20language%20switching). Any violation that impacts users (especially those labeled WCAG AA) is a **P0 defect** – it blocks release until fixed. Designing and coding with accessibility in mind at the outset prevents expensive refactoring later.

## Project Workflow and Quality Gates

This section summarizes how development will be executed under governance oversight (detailed in CI\_Guardrails.md and MultiAgentProtocol.md):

* **Phased Implementation:** Development tasks are organized into Phase 1.0 through 1.4 (see MultiAgentProtocol). Each phase has specific goals (e.g. 1.0 – foundation setup, 1.1 – auth & profiles, 1.2 – jobs & assignments, 1.3 – payments, 1.4 – polish & deployment). The team (and AI agents) must focus only on the tasks of the current phase – out-of-phase work is not authorized. This ensures that by the end of Phase 1.4, all MVP1 success criteria are met[\[15\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Success%20Criteria%20%E2%9C%85%20Contractor%20can,1%20AA%20compliant).

* **Continuous Integration & Gating:** Every commit triggers automated checks. **No code merges are allowed if any P0-level issue is detected.** The CI pipeline will fail the build for critical test failures, linter errors, type errors, security vulnerabilities, or governance violations. Merges to main require all checks green (see CI\_Guardrails.md for specifics on checks and severity levels). In short, *if it doesn't meet our standards, it doesn't enter the codebase*.

* **AI Agents in Workflow:** The project leverages AI co-developers (e.g. OpenAI Codex/GPT and Google Gemini) to accelerate development. However, **all agents must consume and respect this governance bundle** in their prompts and outputs. The MultiAgentProtocol.md defines how the Codex and Auditor agents interact to plan, code, and verify against these rules. AI suggestions that violate any rule (for instance, generating a marketplace feature or non-mobile-friendly UI) must be discarded or corrected by the Auditor before it reaches a PR. Human developers overseeing AI contributions are responsible for ensuring the AI follows the spec and governance at all times.

## Change Management and Exceptions

Governance policies are living but tightly controlled:

* Any change to this Governance Bundle (adding a rule, altering a mandate) must be approved by the project lead **and** reflected in all relevant documents. Agents will be re-synchronized with the updated context immediately after.

* Temporary exceptions to a rule (if absolutely necessary to unblock development) require written justification and sign-off from both product and tech leads. These should be rare. For example, if a third-party library momentarily forces a non-compliant pattern, it must be highlighted and a plan to mitigate it documented. The CI should be configured to allow it only with an explicit override, if at all.

* **No go-live with open P0s:** It is strictly disallowed to launch or deploy with any known P0 issues (test failures, security holes, broken layout, etc.). All P0s must be resolved or formally downgraded (which itself requires justification) before release. The governance's role is to ensure we do not compromise on critical quality for deadlines.

## Known Gotchas and Build Requirements

* **Tailwind CSS directives required in `src/index.css`:** The file `src/index.css` **must** contain the following three directives at the very top:

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

  Without these directives, Tailwind scans source files and generates a class list but emits no CSS output. The result is a complete styling outage — the app renders with zero styles applied. This caused a full styling outage on **2026-03-16**. If styles ever appear missing in a build or dev server, verify these directives are present and in the correct order before investigating anything else.

---

By adhering to this Governance Manifest and its companion documents, the Dispatch MVP1 team will rebuild the application with disciplined execution, ensuring the final product meets all specified requirements, quality bars, and user expectations set out at project inception.
