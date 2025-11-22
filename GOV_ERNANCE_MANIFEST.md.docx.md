# GOV\_ERNANCE\_MANIFEST.md

## Overview and Purpose

This **Governance Manifest** defines the unified rules and standards for the Dispatch MVP1 Restart (Option C execution model). It consolidates all project guardrails, design mandates, and multi-agent collaboration protocols into a single authoritative bundle. All team members and AI agents must adhere to this manifest to ensure the product is built **spec-first**, with high quality and no scope deviations.

* **Scope:** MVP1 (contractor-focused SaaS) rebuilt from a clean template per audit recommendation[\[1\]](file://file_0000000096a071f5add5619b963211bd#:~:text=The%20audit%20determined%20that%20the,while%20avoiding%20inherited%20technical%20debt). This governance bundle supersedes any previous ad-hoc practices.

* **Authority:** The top-level specification is **RESTART\_BRIEF\_ENTERPRISE.md** (enterprise version of the project brief). In case of any conflict, that enterprise brief’s directives prevail. All governance policies here align to and enforce the Enterprise Brief’s intent.

* **Bundle Contents:**

* *GOVERNANCE\_MANIFEST.md* (this document – overarching principles and constraints)

* *CI\_Guardrails.md* (CI/CD pipeline quality gates and enforcement rules)

* *MultiAgentProtocol.md* (coordination rules for AI agents like Codex, Gemini, Auditor)

* *UX-Responsive-01.md* (UX design pattern: Mobile-first responsive design guidelines)

## Core Principles and “Spec First” Doctrine

* **No Code Without a Spec:** *Every feature or code change must trace to a written requirement or design spec.* This “spec-based coding” doctrine is non-negotiable. Before any code is written, there must be a PRD, user story, or task definition in place. The absence of a spec is itself a governance violation.

* **Supremacy of Requirements:** The *RESTART\_BRIEF\_ENTERPRISE.md* and any approved PRDs define the product scope. Features outside the defined scope (e.g. marketplace flows that were explicitly ruled out[\[2\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Additionally%2C%20the%20absence%20of%20meaningful,that%20are%20safe%20to%20reuse)) are **forbidden**. The product vision and constraints in the Brief must be respected in all design and implementation decisions.

* **Progressive Scaffolding:** Development will follow a phased approach, building the foundation first and progressively adding features in controlled increments. The plan (Phase 1.0–1.4) is predefined (see MultiAgentProtocol §2). Developers and AI agents must implement functionality in the prescribed sequence – no premature building of later-phase features. This ensures alignment with the roadmap and prevents scope creep.

* **Continuous Verification:** All code and designs are continuously checked against this governance bundle. An AI Auditor agent and CI checks will enforce that no commit or merge violates the rules (e.g. adding a forbidden component will trigger an immediate block – see CI\_Guardrails). “Governance debt” (deviations from mandated practices) is treated with the same severity as technical debt.

## Functional Scope & Constraints (MVP1)

This restart imposes strict functional boundaries to keep the product focused:

* **Contractor-Only MVP:** The application is for contractors managing jobs. End-users (homeowners) are out of scope for MVP1[\[3\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=3,%E2%9D%8C%20Marketplace%20browsing). No code or UI for homeowner flows shall be present.

* **No Marketplace Features:** Bidding, proposals, or multi-contractor marketplaces are **forbidden**[\[4\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Forbidden%20List%20,proposals%2C%20bidding%2C%20or%20escrow%20flows)[\[5\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Canonical%20Constraints%20for%20New%20Repo,EN%2FFR%20i18n). The MVP1 supports direct job assignment **only** (no open bidding on jobs). Any attempt to introduce bidding, escrow, or similar marketplace elements will be rejected in code review and CI.

* **No Escrow or Payment Vaulting:** Payment flows must use direct charges via Stripe Connect Standard – funds go directly to contractors[\[6\]](file://file_0000000096a071f5add5619b963211bd#:~:text=,EN%2FFR%20i18n). Implementing escrow accounts, held balances, or stored payment methods is not allowed in MVP1. The codebase must reflect this: e.g. no placeholder code for escrow or unused payment holding logic.

* **Geographic/Compliance Limits:** The product is constrained to **Canada-only** usage in MVP1. All content and features should comply with Canadian regulations and norms (e.g. tax calculation, privacy). Multi-province or international considerations are not required beyond ensuring the base design is extensible for the future.

## Technical Architecture Constraints

To ensure a clean, maintainable codebase, the following tech stack rules are codified (many derived from the audit findings):

* **Stack Choices (Locked):** Use **Vite \+ React 18 (TypeScript)** for the frontend and **Supabase (PostgreSQL \+ Auth \+ Storage)** for backend. Next.js or other frameworks are not permitted due to past incompatibilities[\[7\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=Top%205%20Issues)[\[8\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=%F0%9F%8E%AF%20Recommendation). No server-side runtime like Node/Express is expected except what Supabase edge functions cover. All code should run as a SPA \+ cloud backend model.

* **Approved Libraries:** Use the approved UI and utility libraries from the salvage list (Tailwind CSS with shadcn UI components, Zod for schemas, etc.)[\[9\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Salvage%20List%20,%60docs%2FTESTING.md). New dependencies should be added cautiously and must not duplicate existing functionality. Outdated or deprecated packages flagged in the audit have been removed – reintroducing them violates governance.

* **Forbidden Code Patterns:**

* *Next.js or SSR patterns* – e.g. no getServerSideProps, no Next-specific auth helpers in this Vite app[\[10\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=1.%20%E2%9A%A0%EF%B8%8F%20,3%20packages%2C%203%20vulnerabilities).

* *Hardcoded secrets or URLs* – all configuration must come from environment variables. Hardcoding API keys or endpoints (as found in the old repo[\[7\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=Top%205%20Issues)) is strictly disallowed.

* *Deprecated Workarounds* – any hack that undermines platform standards (e.g. bypassing Supabase security by directly hitting PostgREST without auth) is not allowed. Follow recommended integration patterns documented by providers.

* **Reuse vs Rebuild:** Only approved modules from the old repository are to be copied into the new repo[\[9\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Salvage%20List%20,%60docs%2FTESTING.md). Everything on the forbidden list must not enter the new codebase[\[11\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Forbidden%20List%20,Hardcoded%20API%20keys). For example, the prior supabase integration code and any proposal-related modules were explicitly forbidden and must not resurface in any form. This ensures we carry over no technical debt.

## UX and Accessibility Requirements

User experience must be consistent, accessible, and localized from day one:

* **Mobile-First UX:** The application’s design **must prioritize mobile devices** (smartphones) as the primary experience. Per **UX-Responsive-01** guidelines, all pages and features should be first designed for a small screen, then progressively enhanced for larger screens. No functionality should break or become unusable on a mobile viewport.

* **Responsive Enhancement:** While mobile is primary, the UI should gracefully expand for tablet and desktop. We allow slightly richer layouts on larger screens (e.g. side-by-side panels on tablets) as enhancements – but the core workflow and content remain the same. The design should **constrain desktop UIs** to avoid entirely different experiences; wide screens can show more whitespace or panels, but not introduce new features. Consistency across devices is key.

* **Admin Portal Exception:** An internal Admin interface (if any) may be designed **desktop-first** given its likely usage, but it **must degrade gracefully on mobile**. That means an admin should still *technically* be able to perform critical actions on a phone if needed, even if not optimally laid out. Under no circumstances should any part of the system be completely unusable on a modern mobile device.

* **Localization:** Bilingual support **EN and FR-CA** is **mandatory**. Every user-facing string must be externalized for translation. French (Canada) content should be of equal quality to English. The app should detect or allow selection of French, and all UI, emails, and PDFs must appear in the chosen language. This requirement is foundational, not a nice-to-have[\[12\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Week%203%3A%20Polish%20%26%20Testing,12%20hours)[\[13\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%2015,Test%20language%20switching). Governance mandates that any new UI text added must have a corresponding entry in the i18n files – untranslated strings in UI are a CI failure (P0 issue).

* **Accessibility (WCAG 2.1 AA):** Accessibility is not optional; it’s a fundamental requirement from the start. All UIs must meet WCAG 2.1 AA standards. This includes proper semantic HTML structure, keyboard navigability, sufficient color contrast, and support for screen readers. We will run automated a11y tests (axe-core) as part of CI[\[14\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,Test%20language%20switching). Any violation that impacts users (especially those labeled WCAG AA) is a **P0 defect** – it blocks release until fixed. Designing and coding with accessibility in mind at the outset prevents expensive refactoring later.

## Project Workflow and Quality Gates

This section summarizes how development will be executed under governance oversight (detailed in CI\_Guardrails.md and MultiAgentProtocol.md):

* **Phased Implementation:** Development tasks are organized into Phase 1.0 through 1.4 (see MultiAgentProtocol). Each phase has specific goals (e.g. 1.0 – foundation setup, 1.1 – auth & profiles, 1.2 – jobs & assignments, 1.3 – payments, 1.4 – polish & deployment). The team (and AI agents) must focus only on the tasks of the current phase – out-of-phase work is not authorized. This ensures that by the end of Phase 1.4, all MVP1 success criteria are met[\[15\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Success%20Criteria%20%E2%9C%85%20Contractor%20can,1%20AA%20compliant).

* **Continuous Integration & Gating:** Every commit triggers automated checks. **No code merges are allowed if any P0-level issue is detected.** The CI pipeline will fail the build for critical test failures, linter errors, type errors, security vulnerabilities, or governance violations. Merges to main require all checks green (see CI\_Guardrails.md for specifics on checks and severity levels). In short, *if it doesn’t meet our standards, it doesn’t enter the codebase*.

* **AI Agents in Workflow:** The project leverages AI co-developers (e.g. OpenAI Codex/GPT and Google Gemini) to accelerate development. However, **all agents must consume and respect this governance bundle** in their prompts and outputs. The MultiAgentProtocol.md defines how the Codex and Auditor agents interact to plan, code, and verify against these rules. AI suggestions that violate any rule (for instance, generating a marketplace feature or non-mobile-friendly UI) must be discarded or corrected by the Auditor before it reaches a PR. Human developers overseeing AI contributions are responsible for ensuring the AI follows the spec and governance at all times.

## Change Management and Exceptions

Governance policies are living but tightly controlled:

* Any change to this Governance Bundle (adding a rule, altering a mandate) must be approved by the project lead **and** reflected in all relevant documents. Agents will be re-synchronized with the updated context immediately after.

* Temporary exceptions to a rule (if absolutely necessary to unblock development) require written justification and sign-off from both product and tech leads. These should be rare. For example, if a third-party library momentarily forces a non-compliant pattern, it must be highlighted and a plan to mitigate it documented. The CI should be configured to allow it only with an explicit override, if at all.

* **No go-live with open P0s:** It is strictly disallowed to launch or deploy with any known P0 issues (test failures, security holes, broken layout, etc.). All P0s must be resolved or formally downgraded (which itself requires justification) before release. The governance’s role is to ensure we do not compromise on critical quality for deadlines.

By adhering to this Governance Manifest and its companion documents, the Dispatch MVP1 team will rebuild the application with disciplined execution, ensuring the final product meets all specified requirements, quality bars, and user expectations set out at project inception.

---

# CI\_Guardrails.md

## Purpose and Overview

The **CI Guardrails** document defines our Continuous Integration pipeline’s enforcement mechanisms. It translates the governance rules into automated checks and gating criteria. In short: **no build or deployment proceeds if it violates critical policies**. The CI pipeline acts as a constant auditor, catching issues early and preventing regression. This ensures that only compliant, high-quality code makes it to the main branch and ultimately to production.

These guardrails treat governance and quality failures with the same seriousness as test failures. If an engineer or AI tries to merge code that breaks these rules, CI will block it (failing status checks). This creates a strong safety net: the faster we catch problems, the cheaper they are to fix.

## CI Pipeline Checks and Quality Gates

Our CI is configured with multiple stages, each with specific automated checks. All must pass before a merge:

1. **Linting & Static Analysis:** We run linters (ESLint, etc.) and TypeScript compile checks on every push. Code style issues or type errors cause an immediate failure. *Rationale:* Consistent code style and type safety prevent many bugs – e.g. no any types sneaking in that could hide errors. Developers (and AI agents) must fix all lint and type errors; disabling lint rules is not allowed unless justified.

2. **Unit and Integration Tests:** All test suites must pass in CI. We require a growing test suite that covers critical functionality (auth, job flows, payments, etc.). *No PR can be merged if any test fails.* Furthermore, introducing a significant feature without corresponding tests will be flagged by the reviewer or Auditor agent as a process violation (though not automatically by CI unless lacking tests triggers a coverage drop, see next).

3. **Coverage Threshold:** The CI will generate code coverage reports. We set an initial coverage floor (for example, 80%) that must not drop. If a PR reduces coverage, it fails the check. This prevents untested code from accumulating. Over time the required threshold may rise to encourage more comprehensive testing.

4. **Build & Type Check:** The app must build without errors or warnings. We treat build warnings as failures in CI to ensure clean builds. This includes ensuring no unused or unresolved imports, etc. A failing build obviously blocks a merge; a succeeded build that still logs warnings will be considered a **P1** issue to fix promptly (since warnings often hint at future problems).

5. **Accessibility Audit (axe-core):** We run automated accessibility tests (using Axe or similar) against the UI (for critical pages) in CI. Any **violations of WCAG 2.1 AA** are treated as build failures for critical issues or at least flagged. For example, if a form has missing labels or insufficient contrast that Axe flags as serious, the pipeline fails. Minor warnings might pass the build but will be logged for triage. Accessibility is a foundational requirement, not an afterthought, so we enforce it continuously.

6. **Localization Checks:** We employ a script or test to ensure no hard-coded user-facing strings are introduced. This could be done by scanning for non-translated text (e.g. any t( translation function usage vs raw strings) or by running in a French locale and seeing if any English text appears. If any untranslated strings are found, that’s a **P0** blocker. This guarantees we maintain bilingual support.

7. **Responsive Layout Tests:** We treat major layout breakage as a P0 issue. While layout is harder to test automatically, we may use a combination of unit tests for CSS classes and manual gating: for instance, CSS is structured mobile-first, and critical components could have snapshot tests at different screen widths. We also have a governance rule that QA must verify each screen on mobile and desktop – any bug found (like content overflow or an unusable modal on mobile) results in marking the issue as **P0**, which in turn blocks the release. In CI, we can include a basic viewport size screenshot test (using Playwright) for key pages to catch obvious issues (like elements not visible or horizontal scroll present). If such a test fails, the CI fails.

8. **Security Scanning:** The pipeline runs security analyzers (e.g. npm audit, Snyk, or GitHub Dependabot alerts). Critical severity vulnerabilities in our dependencies will block the build (we treat them like failing tests). In addition, we scan for secrets (using tools like GitHub Secret Scan or truffleHog) – if any API keys, passwords, or sensitive info are found in the code, the build errors out. Past issues like hardcoded Supabase keys[\[7\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=Top%205%20Issues)should never reoccur thanks to this check.

9. **Governance Policy Audit:** We integrate a custom **Auditor Agent** in CI that reviews the code diff for any forbidden patterns. This is effectively an AI-based static analysis: it checks for things like usage of disallowed modules (Next.js imports, obsolete proposal code, etc.), presence of any “forbidden list” items[\[11\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Forbidden%20List%20,Hardcoded%20API%20keys), and deviations from architectural rules. If the Auditor finds a violation, it will leave a report and fail the pipeline. For example, if a PR accidentally reintroduces a snippet of the old proposals system or a raw SQL string where only parameterized queries are allowed, CI will catch it.

10. **Performance/Build Regressions (Future):** While not initially strict, we monitor bundle size and basic performance metrics. If a single PR adds a very large library or significantly slows the build or tests, it will flag for review. We define budgets (e.g. bundle under X MB, tests run under Y seconds) and will tighten these as we approach release. Consistently exceeding budgets could be made a failure criterion in later stages of development to ensure the app remains lean.

**Quality Gates Enforcement:** Many of the above checks function as “quality gates” – if the gate is red (failed), the pipeline halts. We specifically enforce that **no code can be merged or deployed if any gate is red**[\[16\]](file://file-9wJoRexjJFXhndvxvHrwbM#:~:text=use%20automated%20tests%20extensively%20,time%3B%20we%20don%E2%80%99t%20have%20to). This includes governance-related gates. For example, if the Auditor agent flags a violation of the “no escrow” rule, that is as critical as a failing unit test; the PR cannot proceed until it’s resolved.

## Severity Levels and Issue Handling

We categorize CI findings into severities to guide resolution priority:

* **P0 (Blockers):** Issues that **stop the pipeline or must stop the release**. These include failing tests, critical accessibility violations, security vulnerabilities, any **spec/governance violations**, or anything causing app failure (crash, build error). P0s *must* be fixed immediately; they block merges. CI is configured to attempt to post a clear error indicating it’s a P0 category failure (where possible). Additionally, if any P0 issue is somehow discovered outside CI (e.g. a critical bug found in manual QA), we treat it as if CI failed – the release is halted until fixed.

* **P1 (Serious, but not blockers for merge):** Issues that are important but not considered release-stoppers. For example, a minor Axe warning, a deprecated package that should be upgraded, or a test coverage shortfall might be P1. CI might allow merge with these (maybe logging a warning), but the issue is tracked and must be addressed in the current or next sprint. We often configure CI to mark the build as “yellow” (warning) for P1 issues. The team’s goal is to clear all P1s before release as well, but they don’t necessarily break the build at commit time.

* **P2 (Minor or informational):** Stylistic suggestions, non-critical lint warnings, trivial accessibility suggestions, etc. These do not fail CI. They may be commented by the Auditor agent or tooling (like a reminder to add more comments, or a note that a certain refactor could improve performance). They are nice-to-have fixes that can be backlog items. P2s should never overshadow P0/P1 issues.

**P0 as Blockers:** It’s worth reiterating: P0 issues cannot be overridden or ignored. Our guardrails treat any P0 as a red light that halts progress. Engineers should not merge with failing checks by force. If absolutely necessary (in an emergency), admin privileges would be required to bypass – and doing so without proper authorization violates the governance process.

## Pull Request Protocols

Every Pull Request will be subjected to governance checks in addition to code review:

* **Spec Reference Required:** Each PR should link to the relevant requirement ID or user story it addresses (e.g. in the PR description or title). This ties into the “No code without a spec” rule – CI can’t automatically verify this link, but repo maintainers (and the Auditor agent in an advisory capacity) will reject PRs that implement features with no documented requirement. A simple guideline: if you can’t identify a spec or task for the code, the code shouldn’t be written.

* **Reviewer Checklist:** Human reviewers will use a checklist mirroring these guardrails. They ensure: Are translations provided? Did we consider mobile layout? Is there a test for new logic? Did the Auditor bot find any smells? The PR template will include reminders of these items so nothing slips through code review.

* **Automated PR Comments:** The CI or Auditor agent may leave comments on the PR, pinpointing issues (e.g., “🚫 Detected usage of forbidden component X” or “⚠️ Function Y lacks test coverage”). These comments help the developer quickly address problems. The PR should not be approved until all such comments on P0/P1 issues are resolved.

* **Approval Requirements:** At minimum, one senior developer or tech lead must approve each PR (no self-approval for significant changes). The Auditor AI’s report must show no outstanding high-severity issues. For critical components, we might require two approvals. Merges are squash merges to keep history clean and tied to spec references.

## CI Integration with Multi-Agent Workflow

Our AI agents are part of the development loop and CI ensures they play by the rules:

* **AI Auditor in CI:** As noted, an Auditor agent runs in CI to perform a static analysis of changes. This agent uses the knowledge in the governance bundle to catch things a typical lint/test might not (like architectural or requirement violations). It effectively encodes the governance as an AI “reviewer”. If the agent is unsure about a potential issue (false positive risk), it will flag for human review rather than fail outright. We continuously tune this agent’s prompts with our rules so it improves over time.

* **Codex Agent PRs:** When the Codex/Gemini coding agent generates a PR, CI treats it no differently – it gets the full battery of tests and audits. In addition, we might have a pre-commit hook for AI-generated code that runs the diff through the Auditor agent locally, so that obvious violations are caught even before pushing. The multi-agent protocol encourages the Codex to self-check using the Auditor logic, but CI is the final backstop.

## Release Gating

Beyond per-PR checks, we enforce guardrails at release time:

* We maintain a **release checklist** (as part of CI/CD) that includes verifying zero open P0 bugs, all critical tests passing on the release branch, and a manual sanity test on staging. The CI for the release pipeline will double-check configurations (e.g., are production environment variables properly set and not using any dev/test keys).

* If any step of a deployment fails or a post-deploy smoke test fails, the deployment auto-aborts. Rollback procedures are in place – but since this is MVP1, we aim to catch everything pre-release.

* Notably, if governance changes were made during development (say we tightened an accessibility rule mid-stream), the final release pipeline will also run tests to ensure the latest governance is met. For example, if we decided mid-project that performance budget is now a P0, the release CI will enforce it even if dev CI didn’t earlier. This prevents any last-minute oversight from slipping through.

In summary, CI Guardrails ensure that **fast development never compromises quality or compliance**. Every engineer and AI contributor can treat the CI as an ever-watchful partner that catches mistakes. While it may occasionally feel strict, this discipline is what will give us confidence in the final product. By automating these guardrails, we maintain velocity (fix issues as soon as they occur) while upholding the highest standards for Dispatch MVP1.

---

# MultiAgentProtocol.md

## Introduction

The Dispatch MVP1 Restart project employs multiple AI agents alongside human developers to speed up development while maintaining quality. This **Multi-Agent Protocol** defines how those agents (and humans) collaborate, share context, and enforce the single source of truth. All agents – including coding assistants like *Codex/GPT-4*, planning agents like *Gemini*, and the *Auditor* – must operate within this protocol.

**Goals of the Protocol:**  
\- Ensure all agents have a **shared understanding of project context** (requirements, codebase state, constraints) at all times – **Context Synchronization**.  
\- Define clear **roles and responsibilities** for each agent to avoid conflict or duplication of work.  
\- Implement a robust **plan-verify loop** where one agent’s output is validated by another (human or AI) against the spec and governance rules before acceptance.  
\- Prevent the AI agents from drifting off-course (e.g. building unauthorized features or low-quality code) by anchoring them to the roadmap and governance at each step.

Humans (developers, PM, tech lead) are also part of the multi-agent system – they guide the AI, provide clarifications, and make final decisions especially in ambiguous cases. However, by adhering to this protocol, the agents can handle much of the heavy lifting in a controlled way.

## Section 1: Agent Roles & Responsibilities

**Codex Agent (AI Developer):** This is the generative AI (like OpenAI’s Codex or GPT-4 in coding mode) that writes code and sometimes documentation. It takes tasks (user stories or spec requirements) and produces code suggestions, which developers can then review and integrate. The Codex agent is expected to:  
\- Follow the provided specifications and **never introduce features** that were not requested. It must strictly abide by scope constraints (e.g. if asked to implement job creation, it should not slip in a bidding system, etc.). The governance manifest is included in its prompt to remind it of forbidden areas.  
\- Adhere to coding standards and patterns. It should produce code consistent with our stack (React, Supabase) and our style guidelines. For instance, it should use the established UI components rather than create new ones arbitrarily, and use our i18n system for strings.  
\- Document its outputs when necessary (e.g., comment complex logic, or outline its approach in the PR description). Part of its role is being an “AI pair programmer” that leaves hints for human reviewers about why it did something.

**Gemini Agent (AI Planner/Architect):** *Gemini* (a codename for a potentially more advanced or specialized model) acts as a planner or high-level assistant. It might break down high-level goals into tasks or review the overall design. Responsibilities:  
\- Generate or refine the **implementation plan** for each phase. Given the project roadmap and current state, Gemini can suggest the sequence of steps the Codex agent should take. For example, at Phase 1.1 (Auth & Profiles), it might outline: “1) Create DB schema for profiles, 2\) Build registration API, 3\) Build frontend form, 4\) Write tests for auth flows.” This plan should align strictly with the spec (no extra steps outside scope).  
\- Perform **feasibility checks**: using its knowledge, warn if something might conflict with previous steps or constraints. E.g., “Ensure the profile creation follows the security utils from old repo (which we copied) rather than making new ones.”  
\- Occasionally act as an **explainer**: if Codex or a human asks for design justification (“Should we use trigger X or function Y for sending emails?”), Gemini provides an analysis based on best practices, again within the boundaries of our tech stack and requirements. It should reference governance where relevant (“Given the no-server constraint, use Supabase Edge Functions for sending emails as it aligns with our architecture”).

**Auditor Agent (AI QA/Guardian):** The Auditor is an AI whose sole job is to scrutinize outputs (code, plans) against the rules and spec. Think of it as an automated code reviewer and test writer. Its duties:  
\- **Spec Compliance Checking:** After Codex produces code, the Auditor compares it with the acceptance criteria. For example, if the spec says “email notifications must be bilingual,” and Codex’s code has an email template only in English, the Auditor flags this.  
\- **Governance Enforcement:** It actively checks for any violation of the Governance Manifest or UX patterns. It has the entire governance bundle loaded. If Codex outputs something violating a rule (say, uses an inline style that breaks design guidelines, or tries to add a Next.js-like routing), Auditor will catch it. In conversation, Auditor will respond with something like: “⚠️ Governance Violation: The code uses a Next.js specific pattern, which is not allowed. Please refactor to a Vite-compatible approach.” In CI (non-interactive), it will fail the build with a clear message.  
\- **Testing and Code Quality:** The Auditor also generates test cases or at least suggests them. If Codex writes a function, Auditor might produce a unit test for it or point out edge cases. It reviews complexity and can suggest simpler solutions if the code deviates from best practices. Essentially, it’s tasked with ensuring the code is robust, secure, and maintainable.

**Human Developer/Lead:** While not an “agent” in the AI sense, the human’s role is to supervise and integrate these AI contributions. The lead developer will:  
\- Provide clarifications to the AI (e.g., feed more context or reframe tasks if AI is confused).  
\- Resolve conflicts – if Codex and Auditor disagree or if the AI’s solution isn’t acceptable, the human makes the call on how to proceed (possibly updating the spec or adjusting the prompt).  
\- Do final code merges after verifying AI outputs meet all criteria. The human is the ultimate gatekeeper to production, informed by the Auditor’s reports and personal expertise.

## Section 2: Shared Roadmap & Context Synchronization (Phases 1.0–1.4)

To keep all agents and humans aligned, we maintain a **single Source of Truth timeline** for development. This roadmap is shared with every agent at all times (included in their context window) so they know *“where we are and what we’re doing next.”* Each phase has specific tasks and goals, which form the basis of the AI’s plan-and-act cycle.

**Phase 1.0 – Foundation Setup**  
\- **Objectives:** Establish the project groundwork.  
\- **Tasks:**  
1\. **Write MVP1 Product Requirements (PRD)** – A 2-3 page document capturing product overview, core features, out-of-scope items, tech stack, and minimal schema[\[17\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%201,Write%20MVP1%20Product%20Requirements%20Document)[\[18\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=2,bilingual%20EN%2FFR). This sets the functional blueprint for MVP1. *Deliverable:* docs/MVP1\_PRD.md.  
2\. **Scaffold New Repository** – Create a fresh codebase using Vite \+ React \+ TS template (via Lovable.dev or manually)[\[19\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,React%20%2B%20Supabase%20template). Initialize version control and CI pipeline. No business logic yet, just the base project structure. *Deliverable:* A clean repo with baseline dependencies and configs (Tailwind, Supabase client set up, etc.)[\[20\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Option%201%3A%20Use%20Lovable%20template,React%20%2B%20Supabase%20template)[\[21\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Initialize%20Tailwind%20npx%20tailwindcss%20init,p).  
3\. **Migrate Reusable Components** – Copy approved modules from the old repo into the new one (UI components, security utils, schemas, config files)[\[22\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%204,NEW%20repo%20Copy%20these%20directories%2Ffiles)[\[23\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Security%20utilities%20%28reusable%29%20cp%20,repo%2Fsrc%2Futils%2Fauth%2Fsecurity). Ensure nothing from the forbidden list is copied (Auditor cross-checks this). *Deliverable:* New repo contains shared building blocks (design system, validation logic, etc.) but none of the old bad code. After Phase 1.0, we should have a skeleton app running with no features, but ready to build on.

**Phase 1.1 – Core Authentication & Profiles**  
\- **Objectives:** Implement user auth and profile management for contractors.  
\- **Tasks:**  
1\. **Auth Setup (Supabase)** – Configure Supabase Auth for email/password login (possibly magic link or 2FA if time permits). Code the frontend context for authentication (persist session, provide login/register UI)[\[24\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%206,js)[\[25\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%2A%2ATasks%3A%2A%2A%20,security%20logging%20from%20old%20repo). *Deliverable:* Contractors can register and log in to the app.  
2\. **Profile Creation** – When a contractor registers, capture their profile info (name, contact, etc.). Implement a profile page or onboarding flow to complete their details. Use the profiles table in Supabase (with the structure defined in PRD / old schema)[\[26\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=5.%20Database%20Schema%20%28minimal%29%20,Stripe%20charges%29). *Deliverable:* Each user has an editable profile stored in the DB, viewable in the UI.  
3\. **Security & Rate Limiting** – Integrate any security middlewares/utilities copied from the old repo (e.g., rate limiter to prevent spam registration, audit logging of logins)[\[27\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,security%20logging%20from%20old%20repo). These were flagged as important to salvage. *Deliverable:* Security utils in place and hooked into auth flows (Auditor to verify, e.g., ensure login attempts trigger security logging).  
*By end of 1.1:* The app has a working auth system and basic contractor profiles, with all underlying infrastructure (contexts, hooks, DB) established correctly.

**Phase 1.2 – Job Management & Direct Booking**  
\- **Objectives:** Enable contractors to create jobs and directly assign them to other contractors (no marketplace bidding).  
\- **Tasks:**  
1\. **Job Entity & CRUD:** Implement the jobs table and backend logic for creating and managing jobs (title, description, location, budget, status)[\[28\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,TEXT%20NOT%20NULL%2C%20budget%20DECIMAL)[\[29\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=created_at%20TIMESTAMPTZ%20DEFAULT%20NOW,%29%3B). Provide a UI for contractors to create a new job, list their jobs, and view job details. *Deliverable:* Contractors can perform basic CRUD on jobs they created.  
2\. **Direct Assignment Workflow:** Implement the job\_assignments table and the flow to invite another contractor to a job[\[30\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%2011,%27completed%27%3B%20created_at%3A%20string)[\[31\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%2F%2F%20Direct%20assignment%2C%20no%20bidding%21,). This involves generating an invite link or selecting a user by email, sending a notification (likely via email), and allowing the invitee to accept or reject the assignment. No bidding – it’s a simple invite/accept. *Deliverable:* Contractor A can assign a job to Contractor B; B sees the invite and can accept, at which point job status changes accordingly.  
3\. **Job Status & Lifecycle:** Define and enforce job status transitions (draft \-\> open \-\> assigned \-\> completed, etc.). Ensure that when an assignment is accepted, the job moves to an appropriate state. Possibly integrate simple notifications (email or in-app) for these events. The Auditor will verify no “proposal” logic exists (since proposals are out-of-scope).  
*By end of 1.2:* Contractors can manage jobs and assign them directly to others. The system supports collaboration between two parties on a job without any bidding system.

**Phase 1.3 – Payments Integration**  
\- **Objectives:** Integrate Stripe Connect for payments on completed jobs, handling money flow directly from one contractor to another.  
\- **Tasks:**  
1\. **Stripe Onboarding:** Set up Stripe Connect Standard for contractors. When a contractor logs in (or at some point in onboarding), if they want to receive payments, they must connect their Stripe account. Implement the flow to create a Stripe account link and collect onboarding info (this may involve redirecting to Stripe’s hosted onboarding). *Deliverable:* Each contractor has the ability to link a Stripe account (and we store their Stripe account ID or status in DB).  
2\. **Direct Charge Implementation:** Using Stripe Connect direct charges, enable a contractor to pay another contractor for a job. Likely, when an assigned job is marked completed, Contractor A (assigner) can make a payment that goes to Contractor B (assignee) minus any Stripe fees. Build a simple UI to trigger payment (could be as basic as “Pay with Stripe” button). *Deliverable:* Money can flow from one user to another for a specific job, visible in Stripe dashboard. The payment\_transactions table logs each payment attempt/status[\[32\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%2A%2ATasks%3A%2A%2A%20,NO%20escrow%2C%20NO%20payment%20holding)[\[33\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=CREATE%20TABLE%20payment_transactions%20,%29%3B).  
3\. **Payment Status & Handling:** Update job status or add indicators when payment is completed. Handle Stripe webhook events if needed (e.g., to update DB on payment success). Ensure no escrow: funds are not held by us, it’s directly through Stripe to the recipient. The Auditor agent will double-check that we aren’t accidentally storing card info or doing something non-compliant.  
*By end of 1.3:* The app supports basic payment flows for jobs: contractors can receive payments into their own Stripe accounts directly. All financial transactions align with the no-escrow rule.

**Phase 1.4 – Polish, Localization & Accessibility, Testing, Deployment**  
\- **Objectives:** Finalize the product with all necessary polish, ensure quality bars (i18n, a11y) are met, and deploy the MVP.  
\- **Tasks:**  
1\. **Bilingual UI Completion:** Complete all translation work. By now, new features from phases 1.1–1.3 may have introduced UI text; ensure every piece of text is translated to French. Conduct a sweep of the app in French to catch any layout or context issues (French text is typically longer – fix any overflow in UI). *Deliverable:* 100% of UI/notifications available in EN and FR.  
2\. **Accessibility Compliance:** Perform a thorough accessibility audit. Use automated tools and manual testing (keyboard-only navigation, screen reader test on key flows). Fix all identified WCAG 2.1 AA issues[\[14\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,Test%20language%20switching). Common tasks include adding alt text to images, proper ARIA labels for custom components, and ensuring focus states are visible. *Deliverable:* The app should pass axe-core with zero serious violations and be usable via screen reader.  
3\. **Testing & QA:** Increase test coverage by writing unit tests for core logic and integration tests for full flows (e.g., register \-\> create job \-\> assign \-\> complete \-\> pay). Execute an end-to-end test simulating a happy path (this could be done with Playwright or manually). Fix any bugs found during this testing. Also ensure regression tests cover that no forbidden features magically appeared (the Auditor helps here too). *Deliverable:* Test suite covers all critical paths; all tests green.  
4\. **Performance & UX Tweaks:** If any part of the UX is sluggish or clunky, polish it. This might include optimizing queries (make sure no unindexed queries or N+1 issues in Supabase), compressing any images, lazy-loading where appropriate, etc. On mobile, check that load times are acceptable on 3G networks (just as a guideline). Also finalize any UI details (consistent padding, error messages user-friendly in both languages, etc.).  
5\. **Deployment:** Configure the production environment (likely Vercel or similar as noted[\[34\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,Test%20live%20app)). Ensure all env vars (Supabase URL/keys, Stripe keys) are set and secure. Do a final smoke test on production URL. *Deliverable:* MVP1 is deployed to a production URL, accessible to the pilot users.

Throughout all phases, **Context Synchronization** is maintained: after each phase, the current state (what’s been built, what remains) is fed back into the agents’ context. For example, as we enter Phase 1.2, the agents know that Phase 1.1 tasks are complete (auth is done, profiles exist) so they can build on that. They also know the Phase 1.2 goals specifically, preventing them from wandering into Phase 1.3 work. This synchronization is often achieved by updating the system prompt or memory for the AI agents with a brief summary of completed work and next tasks.

The **Auditor agent** plays a key role in context sync. At each phase transition, it will verify that the output of the previous phase meets the acceptance criteria (if not, we address it before moving on). It then updates its checklist for the next phase. This ensures we don’t carry unresolved issues forward.

All agents and team members should refer to this roadmap as the canonical timeline. If there’s ever confusion about priorities, this section prevails unless an authorized change is made (and communicated to all agents).

## Section 3: Collaboration Protocol and Communication

To prevent chaos, the agents follow a structured loop for each task or feature:

1. **Plan Proposal:** The Codex/Gemini agent (either collaboratively or one acting as planner) will output a plan before coding. This plan is a step-by-step outline of how it intends to implement a feature, referencing the phase tasks. For example: “Plan: (a) Create database migration for jobs table, (b) Implement backend endpoint for job creation, (c) Update frontend with form and API call, (d) Write unit tests for job model.” This plan is shared (e.g., posted in a pull request description or a design document).

2. **Plan Review:** The Auditor (and human lead) reviews this plan. If something is off (missing a step, or including an out-of-scope step), they provide feedback. The Auditor might catch, for instance, that the plan forgot bilingual email content, and add “(e) Add translation keys for new email template.” The plan might also be approved as-is if it looks solid. Only after plan approval do we proceed. This mimics a design review in a normal dev process.

3. **Execution (Coding):** The Codex agent writes code following the approved plan. It should do this in logical chunks (e.g., commit for migration, commit for API, commit for UI, etc.), each referencing which sub-step it addresses. During this, if Codex is unsure about something (like a technical detail), it can call on Gemini for advice, or ask the Auditor for a quick check. Communication between agents is allowed, but they must keep the human in the loop by logging their conversation (for transparency) if it’s outside the predefined plan.

4. **Self-Check and Handoff:** Before making a pull request, Codex should trigger the Auditor agent to do a local run-through (if in an interactive environment). Essentially, *“lint itself”* with the Auditor. This might involve running the test suite, asking Auditor “Do you see any governance issues in this diff?” etc. Only if this self-check is clean, Codex proceeds to create a PR. This step is about catching errors early (shifting left the QA).

5. **Pull Request & Formal Audit:** Codex (or an integrated system) opens a PR with the changes, describing what it did and linking the spec tasks. The Auditor agent then kicks in as part of CI (as described in CI\_Guardrails) to formally review the PR. It will provide comments on any issues found. The human reviewers also inspect the PR. They all discuss in the PR if needed. Communication is done in natural language but referencing specific code lines or rules (e.g., “Line 220: missing null check as per security guidelines”). All agent comments are visible to humans, ensuring transparency.

6. **Iteration or Merge:** If the Auditor/human review found problems, the Codex agent goes back to fix them (goto step 3 or 4 as appropriate). We iterate until approval. If everything looks good, human lead approves and merges the PR.

Throughout this cycle, **communication standards** are enforced: \- Agents should be concise and specific in comments (avoid extraneous or confusing explanations). Use the project terminology and refer to rule identifiers if applicable (for instance, the Auditor might say “violates Canonical Constraint: No escrow” to be precise).  
\- The Codex agent, when unsure about a requirement, should explicitly ask rather than assume. For example: “I see no mention of logging out in the spec, should I implement a logout button?” This prompt can go to the human or be answered by context if it exists. It’s better to pause and get clarification than to implement an arbitrary decision.  
\- If a planning agent (Gemini) is integrated, its plan outputs and reasoning should be logged for the team. We want the *chain-of-thought* to be somewhat visible to catch any logic errors. If Gemini decides to alter a plan due to new info, it should document that (“Adjusted plan because the user table already exists from auth” etc.).

## Section 4: Ensuring Single Source of Truth

One of the biggest risks with multiple autonomous agents is divergence – e.g., one agent working with outdated context while another has new info. To combat this:

* **Central Knowledge Base:** We use a shared repository of context that all agents pull from regularly. This includes the latest spec (PRD), this governance bundle, the current database schema, and a summary of implemented features to date. Whenever a major change happens (new table added, new rule added, etc.), this knowledge base is updated (automatically, if possible) and agents are signaled to refresh their context.

* **Frequent Sync Points:** At the start of each day (or each major work session), a brief sync meeting occurs (could be literally a note in the chat or an automated summary) where the current status is laid out: e.g., “Completed Phase 1.2 yesterday, starting Phase 1.3 today. Outstanding issues: none. Today’s focus: Stripe integration.” All agents get this update to avoid any working on stale assumptions.

* **Plan Freezes & Updates:** Once a plan for a phase is agreed upon, it serves as the source of truth. If during execution something changes (maybe a requirement was misunderstood and is corrected), we **pause**, update the spec or plan, and ensure everyone knows. Agents are discouraged from making ad-hoc changes to the plan without approval. If Codex thinks of a new sub-task that wasn’t in the plan, it should consult Gemini or a human to amend the plan before coding it.

* **Single Path for Changes:** All changes to requirements or governance must come through the approved process (change request by human stakeholders). Agents should not “invent” new requirements or relax rules on their own. If an agent finds the spec lacking detail, it should prompt a human for clarification rather than assuming. The project manager or tech lead will then update the spec or provide an authoritative answer. This updated info then propagates to all agents.

* **Verification of Understanding:** After each context sync or spec change, the human lead might ask each agent to summarize their understanding. For example, “Auditor, what are your priorities now?” and it might answer “To verify all code related to Stripe integration adheres to security and no PII is logged, etc.” This sanity check helps ensure no misalignment in interpretation.

This protocol effectively treats the multi-agent system as a well-coordinated team. By giving clear roles, sharing one game plan (the roadmap), and having checks and balances (Auditor verifying Codex, human verifying all), we aim to harness AI speed while avoiding AI-induced mistakes.

## Section 5: Failure Handling and Continuous Improvement

Even with these rules, things can go wrong. We prepare for that:

* **Error Triggers:** If an agent repeatedly makes mistakes (e.g., Codex consistently writes code that Auditor has to heavily fix), we escalate. Potential actions: refine the agent’s prompts, add more training info about our project, or in some cases, switch to a different model if one seems not well-suited. The idea is to treat AI issues similar to a junior dev needing guidance – identify why and coach/fix the process.

* **Rollback Plan:** If an AI-generated code submission somehow bypassed checks and caused a problem (bug in production), we have the ability to quickly rollback to a previous known-good state (since our CI ensures we have a mostly working main at all times). Then analyze how the bad change got through and patch that hole in the process. Was it a rule missing in Auditor? A spec ambiguity? We address the root cause.

* **Continuous Learning:** The protocol isn’t static. We will refine it as we learn. For example, if we discover the agents do better with a different style of instructions, we’ll update this document and their prompts accordingly. All such changes are communicated to the whole team. In effect, the multi-agent system improves over time as we adjust the collaboration rules.

* **Human Override:** At any point, a human can step in and override agent decisions. If, say, the AI is stuck in a loop or heading the wrong way, the tech lead might say “Stop – we’ll handle this part manually.” That decision should then be documented (so agents know that part is resolved and shouldn’t keep trying). Human override is the safety brake to ensure project delivery isn’t jeopardized by AI limitations.

By following the Multi-Agent Protocol, we ensure that **Codex builds according to spec, Auditor guards the quality, and Gemini/other helpers keep the effort on track**, all under human supervision. This division of labor and constant context alignment will allow us to move fast without breaking things – truly leveraging AI as an accelerant rather than a risk.

---

# UX-Responsive-01.md

## UX Pattern: Responsive Design (Mobile-First & Progressive Enhancement)

**Pattern Code:** UX-Responsive-01  
**Title:** Mobile-First Responsive Design for MVP1  
**Last Updated:** Nov 22, 2025

### Intent & Scope

This pattern governs the responsive design approach for the Dispatch MVP1 user interfaces. It ensures a consistent, optimized experience across mobile, tablet, and desktop devices. The design philosophy is **mobile-first**, with progressive enhancement for larger screens. All feature UIs developed in MVP1 must follow these guidelines unless explicitly exempted (e.g., admin portal exceptions noted below).

The goal is to guarantee that the core user (a contractor often on a job site, using a smartphone) has full functionality and a smooth experience, while also accommodating users on tablets or desktops with appropriate layout improvements. By codifying this, we avoid desktop-centric designs that break on mobile, and we prevent neglecting larger screens where simple enhancements can improve usability.

### Mobile-First Design Mandate

* **Primary Breakpoint – Mobile:** Design starting with a small viewport (\~360–414px width, typical of modern smartphones). All content and actions must fit within a narrow vertical layout. This means using a single-column flow, large touch-friendly buttons, readable font sizes (at least 16px base), and avoiding any hover-dependent interactions (since touchscreens may not have hover).

* **Content Priority:** On mobile, screen real estate is limited. Prioritize content that the user needs to see or interact with first; hide or defer less important info. Use progressive disclosure (collapsing sections, accordions) to keep screens manageable. For example, on a job detail view, show essential info (job title, status, assigned contractor) prominently, and perhaps tuck extended details (description, history) into expandable sections.

* **Performance on Mobile:** Mobile devices may have slower connections – optimize assets (use compressed images, minimal third-party scripts) to ensure quick loads. Also, aim for minimal reflows: heavy animations or large DOM updates can feel janky on low-end phones. The pattern is to favor simple, CSS-driven animations over JS-heavy ones for performance.

### Progressive Enhancement for Tablet/Desktop

* **Adaptive Layout:** For intermediate viewports (tablet, small laptop \~768px to \~1200px), leverage the extra space. This can mean switching to a two-column layout, revealing a sidebar navigation, or showing additional details that were hidden on mobile. *However, do not require a larger screen to access core functionality.* Everything a user can do on desktop, they must also be able to do on mobile (even if via more taps or navigation).

* **Consistency:** Maintain the same information architecture. The navigation structure shouldn’t completely change between mobile and desktop. For instance, if the mobile uses a hamburger menu for navigation, the desktop might show a navbar – but the sections and hierarchy remain identical. Users should not have to “re-learn” the UI when switching devices.

* **Constrained Width on Large Screens:** Avoid ultra-wide layouts that become hard to read. Even on desktop, constrain content to a reasonable max width (e.g., \~1200px center container) so that text isn’t in long lines across a huge monitor. This improves readability. The design can simply center the content with margins at very large sizes. We’re not optimizing for multi-column dashboard views beyond what’s necessary; the app will mostly look like a centered web app on big screens, which is acceptable for MVP.

* **Additional Enhancements:** On desktop, it’s acceptable to add minor conveniences that wouldn’t fit on mobile, like hover tooltips for truncated text or displaying labels next to icons (where on mobile maybe only icons show to save space). These should *enhance* usability but not introduce entirely new controls or flows. Progressive enhancement means the experience gets better on bigger screens, but it’s never broken or substantially different on smaller ones.

### Responsive Components & Implementation Guidelines

* **Grid and Flex Layouts:** Use CSS flexbox/grid to create fluid layouts that automatically adjust. Define components in a mobile-friendly way (often full-width) and then add media query breakpoints (@media (min-width: X)) to reposition or size them for larger screens. For example, a list of jobs might be a vertical stack on mobile, but on tablet you might use a grid with two columns if space allows.

* **Typography Scaling:** Use relative units (rem/em) for font sizes and spacing, so things scale reasonably with device settings. On mobile, ensure text isn’t too small. On desktop, avoid gigantic text stretching across; you might slightly increase font-size for headings on larger screens for balance. The Tailwind CSS utilities and design tokens should include responsive variants (like text-lg md:text-xl to use larger text on medium screens and up).

* **Navigation Patterns:**

* Mobile: likely a hamburger menu or bottom tab bar for primary navigation. Ensure the tap targets are large (44px by 44px at least). Use a fixed bottom nav if appropriate for quick access, or a top burger \+ menu drawer for a more complex menu.

* Tablet/Desktop: a persistent sidebar or top nav bar can be used since there’s room. For example, a sidebar menu listing all sections could be visible on a tablet in landscape or desktop, whereas that menu collapses into the hamburger on mobile. Use the same icons and labels to avoid confusion.

* **Forms and Modals:** Forms should be single-column on mobile. Input fields should stretch to full width of the screen. For multi-step processes, consider a wizard or stacked cards that the user can swipe/scroll through rather than a wide form. On desktop, you might show multi-column forms if it doesn’t hurt clarity, but often one column is still fine for simplicity. Modals (pop-ups) on mobile must occupy a large portion of the screen (possibly full-screen dialogs) to be usable, while on desktop they can be smaller windows. Always ensure modals on mobile are easily scrollable and not fixed to a height that could overflow.

* **Tables and Data Display:** If any tabular data is present (lists of payments, etc.), design it to be mobile-friendly: either make the table horizontally scrollable with clear indications, or transform each row into a card view (where rows stack as blocks with label-value pairs). For larger screens, the full table layout can be shown. For MVP1 specifically, we expect minimal tabular data, but any that exists should follow this rule.

### Admin Portal Exception – Desktop-First

* **Rationale:** The admin interface is primarily used by internal staff, likely on desktops. We allow the admin UI to be optimized for desktop screens first (wider layout, lots of data on one screen). However, since this is a single codebase, we still must ensure it degrades on mobile (i.e., it doesn’t break completely if opened on a phone).

* **What’s Allowed:** Admin pages can use complex tables or multi-column layouts that would be awkward on a phone. It’s acceptable if using them on a phone is not ideal, but basic viewing should work (e.g., you might need to scroll horizontally to see a whole table – that’s okay for admin). We won’t invest significant time in perfecting admin UX for mobile.

* **Minimum Mobile Support for Admin:** Critical admin functions (if any) should at least be possible on mobile in an emergency. For instance, if there’s an “ban user” button only on an admin page, ensure that page can load on mobile and the button is reachable (even if the layout is not pretty). This typically means using standard HTML/CSS that naturally stacks on a narrow screen, rather than something completely unusable like a fixed-size pixel grid. In summary, **graceful degradation**: it works, but not necessarily elegantly.

* We explicitly mark in documentation which screens are Admin-only and thus exempt from strict mobile-first polish, so QA knows when a mobile issue on admin is tolerable (or at least lower priority) versus when it’s a real bug.

### Validation & Testing

* **Cross-Device Testing:** Every user story is considered done only after testing on common device sizes: e.g. iPhone 12/13 size (\~390px width), a mid-size Android (\~411px), iPad (\~768px and 1024px), and a typical desktop width (\~1440px). We will catch issues like elements off-screen, wrapping oddities, or excessively stretched components this way. Test with both English and French UI, as French often expands UI and could cause mobile layout issues.

* **No Horizontal Scroll:** A guiding rule – on any page, at any supported width, horizontal scrolling (except within intentionally scrollable containers like data tables) is a **bug**. The presence of an unintended horizontal scrollbar is usually a sign something is too wide (an image, a long word, a fixed-width element). It must be fixed (often by adding flex-wrap, max-width, or adjusting margins). This is considered a P0-level issue for mobile and should be caught by our CI screenshot tests or dev testing.

* **Responsive Units:** Use relative CSS units (%, flex, or viewport units) instead of absolute pixel widths wherever possible so that layouts naturally adapt. If an element’s width is set in px and doesn’t shrink on a smaller screen, that’s likely a bug. Our CSS guidelines (enforced by stylelint) may flag excessive fixed dimensions.

* **Font Legibility:** On small devices, ensure text is legible without pinch-zoom. This means avoid tiny fonts; 1rem (16px) is generally the smallest for body text. Also, allow the user’s accessibility settings (like larger text) to still work – don’t lock font sizes by using px for fonts. We test by enabling larger text in OS settings to see if the app scales properly.

* **Touch Target Checks:** All interactive controls (buttons, links, icons) should be easy to tap on a phone. We enforce a minimum hit area of \~44px in CSS (even if the visual icon is smaller, padding makes the clickable area bigger). This will be manually checked and also can be audited via Axe (touch target size recommendations).

* **Orientation and Platform Quirks:** Test on both portrait and landscape orientations for mobile. Particularly, ensure that in landscape (which is a shorter height), modals or forms still scroll and are usable (mobile landscape can surface issues with fixed elements occupying too much vertical space). Also test on both iOS Safari and Android Chrome for any differences (like form input zoom on iOS if font \<16px, which we avoid by using \>=16px fonts).

### Accessibility Considerations in Responsive Design

Responsive design isn’t just visual – it affects accessibility too:  
\- Ensure that reflowing content (especially when using CSS order changes for different layouts) still makes sense in the DOM order for screen readers. Don’t rely solely on visual positioning that might confuse a non-visual user.  
\- On mobile, the screen reader experience is linear (swipe through elements). Make sure important information or actions aren’t buried too deep. The structured headings and regions should follow the mobile layout order (which they naturally will if we code mobile-first).  
\- No content should be hidden in a way that only sighted desktop users can find it. E.g., avoid “on hover show more info” without another way to access that info on touch devices. Provide an alternative like “tap to reveal” or always visible icon.  
\- Test with screen reader on mobile (VoiceOver or TalkBack) to ensure the navigation order follows the intended flow.

### Conclusion

By following **UX-Responsive-01**, we ensure Dispatch MVP1 delivers a **great mobile experience** (crucial for on-the-go contractor users), while still being fully functional and user-friendly on larger screens. This pattern will be revisited as the product grows, but for MVP1 these rules set a strong baseline. All design and code reviews include a check against these guidelines. Non-compliance is treated as a design bug. The end result should be an interface that “just works” wherever the user accesses it – mobile in hand, tablet in a truck, or desktop at the office – with no frustration or broken layouts.

---

[\[1\]](file://file_0000000096a071f5add5619b963211bd#:~:text=The%20audit%20determined%20that%20the,while%20avoiding%20inherited%20technical%20debt) [\[2\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Additionally%2C%20the%20absence%20of%20meaningful,that%20are%20safe%20to%20reuse) [\[4\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Forbidden%20List%20,proposals%2C%20bidding%2C%20or%20escrow%20flows) [\[5\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Canonical%20Constraints%20for%20New%20Repo,EN%2FFR%20i18n) [\[6\]](file://file_0000000096a071f5add5619b963211bd#:~:text=,EN%2FFR%20i18n) [\[9\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Salvage%20List%20,%60docs%2FTESTING.md) [\[11\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Forbidden%20List%20,Hardcoded%20API%20keys) RESTART\_BRIEF.md

[file://file\_0000000096a071f5add5619b963211bd](file://file_0000000096a071f5add5619b963211bd)

[\[3\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=3,%E2%9D%8C%20Marketplace%20browsing) [\[12\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Week%203%3A%20Polish%20%26%20Testing,12%20hours) [\[13\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%2015,Test%20language%20switching) [\[14\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,Test%20language%20switching) [\[15\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Success%20Criteria%20%E2%9C%85%20Contractor%20can,1%20AA%20compliant) [\[17\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%201,Write%20MVP1%20Product%20Requirements%20Document) [\[18\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=2,bilingual%20EN%2FFR) [\[19\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,React%20%2B%20Supabase%20template) [\[20\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Option%201%3A%20Use%20Lovable%20template,React%20%2B%20Supabase%20template) [\[21\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Initialize%20Tailwind%20npx%20tailwindcss%20init,p) [\[22\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%204,NEW%20repo%20Copy%20these%20directories%2Ffiles) [\[23\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=Security%20utilities%20%28reusable%29%20cp%20,repo%2Fsrc%2Futils%2Fauth%2Fsecurity) [\[24\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%206,js) [\[25\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%2A%2ATasks%3A%2A%2A%20,security%20logging%20from%20old%20repo) [\[26\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=5.%20Database%20Schema%20%28minimal%29%20,Stripe%20charges%29) [\[27\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,security%20logging%20from%20old%20repo) [\[28\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,TEXT%20NOT%20NULL%2C%20budget%20DECIMAL) [\[29\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=created_at%20TIMESTAMPTZ%20DEFAULT%20NOW,%29%3B) [\[30\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%2011,%27completed%27%3B%20created_at%3A%20string) [\[31\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%2F%2F%20Direct%20assignment%2C%20no%20bidding%21,) [\[32\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%2A%2ATasks%3A%2A%2A%20,NO%20escrow%2C%20NO%20payment%20holding) [\[33\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=CREATE%20TABLE%20payment_transactions%20,%29%3B) [\[34\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,Test%20live%20app) ACTION\_PLAN.md

[file://file\_00000000857c71f7a4d4f1ba29af447c](file://file_00000000857c71f7a4d4f1ba29af447c)

[\[7\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=Top%205%20Issues) [\[8\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=%F0%9F%8E%AF%20Recommendation) [\[10\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=1.%20%E2%9A%A0%EF%B8%8F%20,3%20packages%2C%203%20vulnerabilities) AUDIT\_README.md

[file://file\_00000000c9b071f4abd0c07b9d90db02](file://file_00000000c9b071f4abd0c07b9d90db02)

[\[16\]](file://file-9wJoRexjJFXhndvxvHrwbM#:~:text=use%20automated%20tests%20extensively%20,time%3B%20we%20don%E2%80%99t%20have%20to) AI-Powered SaaS Development Best Practices Framework(2).docx

[file://file-9wJoRexjJFXhndvxvHrwbM](file://file-9wJoRexjJFXhndvxvHrwbM)