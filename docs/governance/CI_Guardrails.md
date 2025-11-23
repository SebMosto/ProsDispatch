# CI Guardrails

## Purpose and Overview

The **CI Guardrails** document defines our Continuous Integration pipeline's enforcement mechanisms. It translates the governance rules into automated checks and gating criteria. In short: **no build or deployment proceeds if it violates critical policies**. The CI pipeline acts as a constant auditor, catching issues early and preventing regression. This ensures that only compliant, high-quality code makes it to the main branch and ultimately to production.

These guardrails treat governance and quality failures with the same seriousness as test failures. If an engineer or AI tries to merge code that breaks these rules, CI will block it (failing status checks). This creates a strong safety net: the faster we catch problems, the cheaper they are to fix.

## CI Pipeline Checks and Quality Gates

Our CI is configured with multiple stages, each with specific automated checks. All must pass before a merge:

1. **Linting & Static Analysis:** We run linters (ESLint, etc.) and TypeScript compile checks on every push. Code style issues or type errors cause an immediate failure. *Rationale:* Consistent code style and type safety prevent many bugs – e.g. no any types sneaking in that could hide errors. Developers (and AI agents) must fix all lint and type errors; disabling lint rules is not allowed unless justified.

2. **Unit and Integration Tests:** All test suites must pass in CI. We require a growing test suite that covers critical functionality (auth, job flows, payments, etc.). *No PR can be merged if any test fails.* Furthermore, introducing a significant feature without corresponding tests will be flagged by the reviewer or Auditor agent as a process violation (though not automatically by CI unless lacking tests triggers a coverage drop, see next).

3. **Coverage Threshold:** The CI will generate code coverage reports. We set an initial coverage floor (for example, 80%) that must not drop. If a PR reduces coverage, it fails the check. This prevents untested code from accumulating. Over time the required threshold may rise to encourage more comprehensive testing.

4. **Build & Type Check:** The app must build without errors or warnings. We treat build warnings as failures in CI to ensure clean builds. This includes ensuring no unused or unresolved imports, etc. A failing build obviously blocks a merge; a succeeded build that still logs warnings will be considered a **P1** issue to fix promptly (since warnings often hint at future problems).

5. **Accessibility Audit (axe-core):** We run automated accessibility tests (using Axe or similar) against the UI (for critical pages) in CI. Any **violations of WCAG 2.1 AA** are treated as build failures for critical issues or at least flagged. For example, if a form has missing labels or insufficient contrast that Axe flags as serious, the pipeline fails. Minor warnings might pass the build but will be logged for triage. Accessibility is a foundational requirement, not an afterthought, so we enforce it continuously.

6. **Localization Checks:** We employ a script or test to ensure no hard-coded user-facing strings are introduced. This could be done by scanning for non-translated text (e.g. any t( translation function usage vs raw strings) or by running in a French locale and seeing if any English text appears. If any untranslated strings are found, that's a **P0** blocker. This guarantees we maintain bilingual support.

7. **Responsive Layout Tests:** We treat major layout breakage as a P0 issue. While layout is harder to test automatically, we may use a combination of unit tests for CSS classes and manual gating: for instance, CSS is structured mobile-first, and critical components could have snapshot tests at different screen widths. We also have a governance rule that QA must verify each screen on mobile and desktop – any bug found (like content overflow or an unusable modal on mobile) results in marking the issue as **P0**, which in turn blocks the release. In CI, we can include a basic viewport size screenshot test (using Playwright) for key pages to catch obvious issues (like elements not visible or horizontal scroll present). If such a test fails, the CI fails.

8. **Security Scanning:** The pipeline runs security analyzers (e.g. npm audit, Snyk, or GitHub Dependabot alerts). Critical severity vulnerabilities in our dependencies will block the build (we treat them like failing tests). In addition, we scan for secrets (using tools like GitHub Secret Scan or truffleHog) – if any API keys, passwords, or sensitive info are found in the code, the build errors out. Past issues like hardcoded Supabase keys[\[7\]](file://file_00000000c9b071f4abd0c07b9d90db02#:~:text=Top%205%20Issues)should never reoccur thanks to this check.

9. **Governance Policy Audit:** We integrate a custom **Auditor Agent** in CI that reviews the code diff for any forbidden patterns. This is effectively an AI-based static analysis: it checks for things like usage of disallowed modules (Next.js imports, obsolete proposal code, etc.), presence of any "forbidden list" items[\[11\]](file://file_0000000096a071f5add5619b963211bd#:~:text=Forbidden%20List%20,Hardcoded%20API%20keys), and deviations from architectural rules. If the Auditor finds a violation, it will leave a report and fail the pipeline. For example, if a PR accidentally reintroduces a snippet of the old proposals system or a raw SQL string where only parameterized queries are allowed, CI will catch it.

10. **Performance/Build Regressions (Future):** While not initially strict, we monitor bundle size and basic performance metrics. If a single PR adds a very large library or significantly slows the build or tests, it will flag for review. We define budgets (e.g. bundle under X MB, tests run under Y seconds) and will tighten these as we approach release. Consistently exceeding budgets could be made a failure criterion in later stages of development to ensure the app remains lean.

**Quality Gates Enforcement:** Many of the above checks function as "quality gates" – if the gate is red (failed), the pipeline halts. We specifically enforce that **no code can be merged or deployed if any gate is red**[\[16\]](file://file-9wJoRexjJFXhndvxvHrwbM#:~:text=use%20automated%20tests%20extensively%20,time%3B%20we%20don%E2%80%99t%20have%20to). This includes governance-related gates. For example, if the Auditor agent flags a violation of the "no escrow" rule, that is as critical as a failing unit test; the PR cannot proceed until it's resolved.

## Severity Levels and Issue Handling

We categorize CI findings into severities to guide resolution priority:

* **P0 (Blockers):** Issues that **stop the pipeline or must stop the release**. These include failing tests, critical accessibility violations, security vulnerabilities, any **spec/governance violations**, or anything causing app failure (crash, build error). P0s *must* be fixed immediately; they block merges. CI is configured to attempt to post a clear error indicating it's a P0 category failure (where possible). Additionally, if any P0 issue is somehow discovered outside CI (e.g. a critical bug found in manual QA), we treat it as if CI failed – the release is halted until fixed.

* **P1 (Serious, but not blockers for merge):** Issues that are important but not considered release-stoppers. For example, a minor Axe warning, a deprecated package that should be upgraded, or a test coverage shortfall might be P1. CI might allow merge with these (maybe logging a warning), but the issue is tracked and must be addressed in the current or next sprint. We often configure CI to mark the build as "yellow" (warning) for P1 issues. The team's goal is to clear all P1s before release as well, but they don't necessarily break the build at commit time.

* **P2 (Minor or informational):** Stylistic suggestions, non-critical lint warnings, trivial accessibility suggestions, etc. These do not fail CI. They may be commented by the Auditor agent or tooling (like a reminder to add more comments, or a note that a certain refactor could improve performance). They are nice-to-have fixes that can be backlog items. P2s should never overshadow P0/P1 issues.

**P0 as Blockers:** It's worth reiterating: P0 issues cannot be overridden or ignored. Our guardrails treat any P0 as a red light that halts progress. Engineers should not merge with failing checks by force. If absolutely necessary (in an emergency), admin privileges would be required to bypass – and doing so without proper authorization violates the governance process.

## Pull Request Protocols

Every Pull Request will be subjected to governance checks in addition to code review:

* **Spec Reference Required:** Each PR should link to the relevant requirement ID or user story it addresses (e.g. in the PR description or title). This ties into the "No code without a spec" rule – CI can't automatically verify this link, but repo maintainers (and the Auditor agent in an advisory capacity) will reject PRs that implement features with no documented requirement. A simple guideline: if you can't identify a spec or task for the code, the code shouldn't be written.

* **Reviewer Checklist:** Human reviewers will use a checklist mirroring these guardrails. They ensure: Are translations provided? Did we consider mobile layout? Is there a test for new logic? Did the Auditor bot find any smells? The PR template will include reminders of these items so nothing slips through code review.

* **Automated PR Comments:** The CI or Auditor agent may leave comments on the PR, pinpointing issues (e.g., "🚫 Detected usage of forbidden component X" or "⚠️ Function Y lacks test coverage"). These comments help the developer quickly address problems. The PR should not be approved until all such comments on P0/P1 issues are resolved.

* **Approval Requirements:** At minimum, one senior developer or tech lead must approve each PR (no self-approval for significant changes). The Auditor AI's report must show no outstanding high-severity issues. For critical components, we might require two approvals. Merges are squash merges to keep history clean and tied to spec references.

## CI Integration with Multi-Agent Workflow

Our AI agents are part of the development loop and CI ensures they play by the rules:

* **AI Auditor in CI:** As noted, an Auditor agent runs in CI to perform a static analysis of changes. This agent uses the knowledge in the governance bundle to catch things a typical lint/test might not (like architectural or requirement violations). It effectively encodes the governance as an AI "reviewer". If the agent is unsure about a potential issue (false positive risk), it will flag for human review rather than fail outright. We continuously tune this agent's prompts with our rules so it improves over time.

* **Codex Agent PRs:** When the Codex/Gemini coding agent generates a PR, CI treats it no differently – it gets the full battery of tests and audits. In addition, we might have a pre-commit hook for AI-generated code that runs the diff through the Auditor agent locally, so that obvious violations are caught even before pushing. The multi-agent protocol encourages the Codex to self-check using the Auditor logic, but CI is the final backstop.

## Release Gating

Beyond per-PR checks, we enforce guardrails at release time:

* We maintain a **release checklist** (as part of CI/CD) that includes verifying zero open P0 bugs, all critical tests passing on the release branch, and a manual sanity test on staging. The CI for the release pipeline will double-check configurations (e.g., are production environment variables properly set and not using any dev/test keys).

* If any step of a deployment fails or a post-deploy smoke test fails, the deployment auto-aborts. Rollback procedures are in place – but since this is MVP1, we aim to catch everything pre-release.

* Notably, if governance changes were made during development (say we tightened an accessibility rule mid-stream), the final release pipeline will also run tests to ensure the latest governance is met. For example, if we decided mid-project that performance budget is now a P0, the release CI will enforce it even if dev CI didn't earlier. This prevents any last-minute oversight from slipping through.

In summary, CI Guardrails ensure that **fast development never compromises quality or compliance**. Every engineer and AI contributor can treat the CI as an ever-watchful partner that catches mistakes. While it may occasionally feel strict, this discipline is what will give us confidence in the final product. By automating these guardrails, we maintain velocity (fix issues as soon as they occur) while upholding the highest standards for Dispatch MVP1.
