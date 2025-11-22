# Multi-Agent Protocol

## Introduction

The Dispatch MVP1 Restart project employs multiple AI agents alongside human developers to speed up development while maintaining quality. This **Multi-Agent Protocol** defines how those agents (and humans) collaborate, share context, and enforce the single source of truth. All agents – including coding assistants like *Codex/GPT-4*, planning agents like *Gemini*, and the *Auditor* – must operate within this protocol.

**Goals of the Protocol:**  
\- Ensure all agents have a **shared understanding of project context** (requirements, codebase state, constraints) at all times – **Context Synchronization**.  
\- Define clear **roles and responsibilities** for each agent to avoid conflict or duplication of work.  
\- Implement a robust **plan-verify loop** where one agent's output is validated by another (human or AI) against the spec and governance rules before acceptance.  
\- Prevent the AI agents from drifting off-course (e.g. building unauthorized features or low-quality code) by anchoring them to the roadmap and governance at each step.

Humans (developers, PM, tech lead) are also part of the multi-agent system – they guide the AI, provide clarifications, and make final decisions especially in ambiguous cases. However, by adhering to this protocol, the agents can handle much of the heavy lifting in a controlled way.

## Section 1: Agent Roles & Responsibilities

**Codex Agent (AI Developer):** This is the generative AI (like OpenAI's Codex or GPT-4 in coding mode) that writes code and sometimes documentation. It takes tasks (user stories or spec requirements) and produces code suggestions, which developers can then review and integrate. The Codex agent is expected to:  
\- Follow the provided specifications and **never introduce features** that were not requested. It must strictly abide by scope constraints (e.g. if asked to implement job creation, it should not slip in a bidding system, etc.). The governance manifest is included in its prompt to remind it of forbidden areas.  
\- Adhere to coding standards and patterns. It should produce code consistent with our stack (React, Supabase) and our style guidelines. For instance, it should use the established UI components rather than create new ones arbitrarily, and use our i18n system for strings.  
\- Document its outputs when necessary (e.g., comment complex logic, or outline its approach in the PR description). Part of its role is being an "AI pair programmer" that leaves hints for human reviewers about why it did something.

**Gemini Agent (AI Planner/Architect):** *Gemini* (a codename for a potentially more advanced or specialized model) acts as a planner or high-level assistant. It might break down high-level goals into tasks or review the overall design. Responsibilities:  
\- Generate or refine the **implementation plan** for each phase. Given the project roadmap and current state, Gemini can suggest the sequence of steps the Codex agent should take. For example, at Phase 1.1 (Auth & Profiles), it might outline: "1) Create DB schema for profiles, 2\) Build registration API, 3\) Build frontend form, 4\) Write tests for auth flows." This plan should align strictly with the spec (no extra steps outside scope).  
\- Perform **feasibility checks**: using its knowledge, warn if something might conflict with previous steps or constraints. E.g., "Ensure the profile creation follows the security utils from old repo (which we copied) rather than making new ones."  
\- Occasionally act as an **explainer**: if Codex or a human asks for design justification ("Should we use trigger X or function Y for sending emails?"), Gemini provides an analysis based on best practices, again within the boundaries of our tech stack and requirements. It should reference governance where relevant ("Given the no-server constraint, use Supabase Edge Functions for sending emails as it aligns with our architecture").

**Auditor Agent (AI QA/Guardian):** The Auditor is an AI whose sole job is to scrutinize outputs (code, plans) against the rules and spec. Think of it as an automated code reviewer and test writer. Its duties:  
\- **Spec Compliance Checking:** After Codex produces code, the Auditor compares it with the acceptance criteria. For example, if the spec says "email notifications must be bilingual," and Codex's code has an email template only in English, the Auditor flags this.  
\- **Governance Enforcement:** It actively checks for any violation of the Governance Manifest or UX patterns. It has the entire governance bundle loaded. If Codex outputs something violating a rule (say, uses an inline style that breaks design guidelines, or tries to add a Next.js-like routing), Auditor will catch it. In conversation, Auditor will respond with something like: "⚠️ Governance Violation: The code uses a Next.js specific pattern, which is not allowed. Please refactor to a Vite-compatible approach." In CI (non-interactive), it will fail the build with a clear message.  
\- **Testing and Code Quality:** The Auditor also generates test cases or at least suggests them. If Codex writes a function, Auditor might produce a unit test for it or point out edge cases. It reviews complexity and can suggest simpler solutions if the code deviates from best practices. Essentially, it's tasked with ensuring the code is robust, secure, and maintainable.

**Human Developer/Lead:** While not an "agent" in the AI sense, the human's role is to supervise and integrate these AI contributions. The lead developer will:  
\- Provide clarifications to the AI (e.g., feed more context or reframe tasks if AI is confused).  
\- Resolve conflicts – if Codex and Auditor disagree or if the AI's solution isn't acceptable, the human makes the call on how to proceed (possibly updating the spec or adjusting the prompt).  
\- Do final code merges after verifying AI outputs meet all criteria. The human is the ultimate gatekeeper to production, informed by the Auditor's reports and personal expertise.

## Section 2: Shared Roadmap & Context Synchronization (Phases 1.0–1.4)

To keep all agents and humans aligned, we maintain a **single Source of Truth timeline** for development. This roadmap is shared with every agent at all times (included in their context window) so they know *"where we are and what we're doing next."* Each phase has specific tasks and goals, which form the basis of the AI's plan-and-act cycle.

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
2\. **Direct Assignment Workflow:** Implement the job\_assignments table and the flow to invite another contractor to a job[\[30\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%23%20Day%2011,%27completed%27%3B%20created_at%3A%20string)[\[31\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%2F%2F%20Direct%20assignment%2C%20no%20bidding%21,). This involves generating an invite link or selecting a user by email, sending a notification (likely via email), and allowing the invitee to accept or reject the assignment. No bidding – it's a simple invite/accept. *Deliverable:* Contractor A can assign a job to Contractor B; B sees the invite and can accept, at which point job status changes accordingly.  
3\. **Job Status & Lifecycle:** Define and enforce job status transitions (draft \-\> open \-\> assigned \-\> completed, etc.). Ensure that when an assignment is accepted, the job moves to an appropriate state. Possibly integrate simple notifications (email or in-app) for these events. The Auditor will verify no "proposal" logic exists (since proposals are out-of-scope).  
*By end of 1.2:* Contractors can manage jobs and assign them directly to others. The system supports collaboration between two parties on a job without any bidding system.

**Phase 1.3 – Payments Integration**  
\- **Objectives:** Integrate Stripe Connect for payments on completed jobs, handling money flow directly from one contractor to another.  
\- **Tasks:**  
1\. **Stripe Onboarding:** Set up Stripe Connect Standard for contractors. When a contractor logs in (or at some point in onboarding), if they want to receive payments, they must connect their Stripe account. Implement the flow to create a Stripe account link and collect onboarding info (this may involve redirecting to Stripe's hosted onboarding). *Deliverable:* Each contractor has the ability to link a Stripe account (and we store their Stripe account ID or status in DB).  
2\. **Direct Charge Implementation:** Using Stripe Connect direct charges, enable a contractor to pay another contractor for a job. Likely, when an assigned job is marked completed, Contractor A (assigner) can make a payment that goes to Contractor B (assignee) minus any Stripe fees. Build a simple UI to trigger payment (could be as basic as "Pay with Stripe" button). *Deliverable:* Money can flow from one user to another for a specific job, visible in Stripe dashboard. The payment\_transactions table logs each payment attempt/status[\[32\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=%2A%2ATasks%3A%2A%2A%20,NO%20escrow%2C%20NO%20payment%20holding)[\[33\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=CREATE%20TABLE%20payment_transactions%20,%29%3B).  
3\. **Payment Status & Handling:** Update job status or add indicators when payment is completed. Handle Stripe webhook events if needed (e.g., to update DB on payment success). Ensure no escrow: funds are not held by us, it's directly through Stripe to the recipient. The Auditor agent will double-check that we aren't accidentally storing card info or doing something non-compliant.  
*By end of 1.3:* The app supports basic payment flows for jobs: contractors can receive payments into their own Stripe accounts directly. All financial transactions align with the no-escrow rule.

**Phase 1.4 – Polish, Localization & Accessibility, Testing, Deployment**  
\- **Objectives:** Finalize the product with all necessary polish, ensure quality bars (i18n, a11y) are met, and deploy the MVP.  
\- **Tasks:**  
1\. **Bilingual UI Completion:** Complete all translation work. By now, new features from phases 1.1–1.3 may have introduced UI text; ensure every piece of text is translated to French. Conduct a sweep of the app in French to catch any layout or context issues (French text is typically longer – fix any overflow in UI). *Deliverable:* 100% of UI/notifications available in EN and FR.  
2\. **Accessibility Compliance:** Perform a thorough accessibility audit. Use automated tools and manual testing (keyboard-only navigation, screen reader test on key flows). Fix all identified WCAG 2.1 AA issues[\[14\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,Test%20language%20switching). Common tasks include adding alt text to images, proper ARIA labels for custom components, and ensuring focus states are visible. *Deliverable:* The app should pass axe-core with zero serious violations and be usable via screen reader.  
3\. **Testing & QA:** Increase test coverage by writing unit tests for core logic and integration tests for full flows (e.g., register \-\> create job \-\> assign \-\> complete \-\> pay). Execute an end-to-end test simulating a happy path (this could be done with Playwright or manually). Fix any bugs found during this testing. Also ensure regression tests cover that no forbidden features magically appeared (the Auditor helps here too). *Deliverable:* Test suite covers all critical paths; all tests green.  
4\. **Performance & UX Tweaks:** If any part of the UX is sluggish or clunky, polish it. This might include optimizing queries (make sure no unindexed queries or N+1 issues in Supabase), compressing any images, lazy-loading where appropriate, etc. On mobile, check that load times are acceptable on 3G networks (just as a guideline). Also finalize any UI details (consistent padding, error messages user-friendly in both languages, etc.).  
5\. **Deployment:** Configure the production environment (likely Vercel or similar as noted[\[34\]](file://file_00000000857c71f7a4d4f1ba29af447c#:~:text=,Test%20live%20app)). Ensure all env vars (Supabase URL/keys, Stripe keys) are set and secure. Do a final smoke test on production URL. *Deliverable:* MVP1 is deployed to a production URL, accessible to the pilot users.

Throughout all phases, **Context Synchronization** is maintained: after each phase, the current state (what's been built, what remains) is fed back into the agents' context. For example, as we enter Phase 1.2, the agents know that Phase 1.1 tasks are complete (auth is done, profiles exist) so they can build on that. They also know the Phase 1.2 goals specifically, preventing them from wandering into Phase 1.3 work. This synchronization is often achieved by updating the system prompt or memory for the AI agents with a brief summary of completed work and next tasks.

The **Auditor agent** plays a key role in context sync. At each phase transition, it will verify that the output of the previous phase meets the acceptance criteria (if not, we address it before moving on). It then updates its checklist for the next phase. This ensures we don't carry unresolved issues forward.

All agents and team members should refer to this roadmap as the canonical timeline. If there's ever confusion about priorities, this section prevails unless an authorized change is made (and communicated to all agents).

## Section 3: Collaboration Protocol and Communication

To prevent chaos, the agents follow a structured loop for each task or feature:

1. **Plan Proposal:** The Codex/Gemini agent (either collaboratively or one acting as planner) will output a plan before coding. This plan is a step-by-step outline of how it intends to implement a feature, referencing the phase tasks. For example: "Plan: (a) Create database migration for jobs table, (b) Implement backend endpoint for job creation, (c) Update frontend with form and API call, (d) Write unit tests for job model." This plan is shared (e.g., posted in a pull request description or a design document).

2. **Plan Review:** The Auditor (and human lead) reviews this plan. If something is off (missing a step, or including an out-of-scope step), they provide feedback. The Auditor might catch, for instance, that the plan forgot bilingual email content, and add "(e) Add translation keys for new email template." The plan might also be approved as-is if it looks solid. Only after plan approval do we proceed. This mimics a design review in a normal dev process.

3. **Execution (Coding):** The Codex agent writes code following the approved plan. It should do this in logical chunks (e.g., commit for migration, commit for API, commit for UI, etc.), each referencing which sub-step it addresses. During this, if Codex is unsure about something (like a technical detail), it can call on Gemini for advice, or ask the Auditor for a quick check. Communication between agents is allowed, but they must keep the human in the loop by logging their conversation (for transparency) if it's outside the predefined plan.

4. **Self-Check and Handoff:** Before making a pull request, Codex should trigger the Auditor agent to do a local run-through (if in an interactive environment). Essentially, *"lint itself"* with the Auditor. This might involve running the test suite, asking Auditor "Do you see any governance issues in this diff?" etc. Only if this self-check is clean, Codex proceeds to create a PR. This step is about catching errors early (shifting left the QA).

5. **Pull Request & Formal Audit:** Codex (or an integrated system) opens a PR with the changes, describing what it did and linking the spec tasks. The Auditor agent then kicks in as part of CI (as described in CI\_Guardrails) to formally review the PR. It will provide comments on any issues found. The human reviewers also inspect the PR. They all discuss in the PR if needed. Communication is done in natural language but referencing specific code lines or rules (e.g., "Line 220: missing null check as per security guidelines"). All agent comments are visible to humans, ensuring transparency.

6. **Iteration or Merge:** If the Auditor/human review found problems, the Codex agent goes back to fix them (goto step 3 or 4 as appropriate). We iterate until approval. If everything looks good, human lead approves and merges the PR.

Throughout this cycle, **communication standards** are enforced: \- Agents should be concise and specific in comments (avoid extraneous or confusing explanations). Use the project terminology and refer to rule identifiers if applicable (for instance, the Auditor might say "violates Canonical Constraint: No escrow" to be precise).  
\- The Codex agent, when unsure about a requirement, should explicitly ask rather than assume. For example: "I see no mention of logging out in the spec, should I implement a logout button?" This prompt can go to the human or be answered by context if it exists. It's better to pause and get clarification than to implement an arbitrary decision.  
\- If a planning agent (Gemini) is integrated, its plan outputs and reasoning should be logged for the team. We want the *chain-of-thought* to be somewhat visible to catch any logic errors. If Gemini decides to alter a plan due to new info, it should document that ("Adjusted plan because the user table already exists from auth" etc.).

## Section 4: Ensuring Single Source of Truth

One of the biggest risks with multiple autonomous agents is divergence – e.g., one agent working with outdated context while another has new info. To combat this:

* **Central Knowledge Base:** We use a shared repository of context that all agents pull from regularly. This includes the latest spec (PRD), this governance bundle, the current database schema, and a summary of implemented features to date. Whenever a major change happens (new table added, new rule added, etc.), this knowledge base is updated (automatically, if possible) and agents are signaled to refresh their context.

* **Frequent Sync Points:** At the start of each day (or each major work session), a brief sync meeting occurs (could be literally a note in the chat or an automated summary) where the current status is laid out: e.g., "Completed Phase 1.2 yesterday, starting Phase 1.3 today. Outstanding issues: none. Today's focus: Stripe integration." All agents get this update to avoid any working on stale assumptions.

* **Plan Freezes & Updates:** Once a plan for a phase is agreed upon, it serves as the source of truth. If during execution something changes (maybe a requirement was misunderstood and is corrected), we **pause**, update the spec or plan, and ensure everyone knows. Agents are discouraged from making ad-hoc changes to the plan without approval. If Codex thinks of a new sub-task that wasn't in the plan, it should consult Gemini or a human to amend the plan before coding it.

* **Single Path for Changes:** All changes to requirements or governance must come through the approved process (change request by human stakeholders). Agents should not "invent" new requirements or relax rules on their own. If an agent finds the spec lacking detail, it should prompt a human for clarification rather than assuming. The project manager or tech lead will then update the spec or provide an authoritative answer. This updated info then propagates to all agents.

* **Verification of Understanding:** After each context sync or spec change, the human lead might ask each agent to summarize their understanding. For example, "Auditor, what are your priorities now?" and it might answer "To verify all code related to Stripe integration adheres to security and no PII is logged, etc." This sanity check helps ensure no misalignment in interpretation.

This protocol effectively treats the multi-agent system as a well-coordinated team. By giving clear roles, sharing one game plan (the roadmap), and having checks and balances (Auditor verifying Codex, human verifying all), we aim to harness AI speed while avoiding AI-induced mistakes.

## Section 5: Failure Handling and Continuous Improvement

Even with these rules, things can go wrong. We prepare for that:

* **Error Triggers:** If an agent repeatedly makes mistakes (e.g., Codex consistently writes code that Auditor has to heavily fix), we escalate. Potential actions: refine the agent's prompts, add more training info about our project, or in some cases, switch to a different model if one seems not well-suited. The idea is to treat AI issues similar to a junior dev needing guidance – identify why and coach/fix the process.

* **Rollback Plan:** If an AI-generated code submission somehow bypassed checks and caused a problem (bug in production), we have the ability to quickly rollback to a previous known-good state (since our CI ensures we have a mostly working main at all times). Then analyze how the bad change got through and patch that hole in the process. Was it a rule missing in Auditor? A spec ambiguity? We address the root cause.

* **Continuous Learning:** The protocol isn't static. We will refine it as we learn. For example, if we discover the agents do better with a different style of instructions, we'll update this document and their prompts accordingly. All such changes are communicated to the whole team. In effect, the multi-agent system improves over time as we adjust the collaboration rules.

* **Human Override:** At any point, a human can step in and override agent decisions. If, say, the AI is stuck in a loop or heading the wrong way, the tech lead might say "Stop – we'll handle this part manually." That decision should then be documented (so agents know that part is resolved and shouldn't keep trying). Human override is the safety brake to ensure project delivery isn't jeopardized by AI limitations.

By following the Multi-Agent Protocol, we ensure that **Codex builds according to spec, Auditor guards the quality, and Gemini/other helpers keep the effort on track**, all under human supervision. This division of labor and constant context alignment will allow us to move fast without breaking things – truly leveraging AI as an accelerant rather than a risk.
