# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows that enforce the CI Guardrails defined in `docs/governance/CI_Guardrails.md`.

## Overview

The workflows implement automated quality gates that ensure code meets all governance requirements before being merged or released. Per the governance manifest: **no code can be merged or deployed if any gate is red**.

## Workflows

### 1. CI Guardrails (`ci-guardrails.yml`)

**Trigger**: On all PRs and pushes to `main`/`develop` branches

The main CI workflow that enforces 10 categories of checks:

- **Linting & Static Analysis**: ESLint + TypeScript type checking
- **Build & Type Check**: Production build (treats warnings as errors)
- **Security Scanning**: npm audit + secret detection (TruffleHog)
- **Localization Check**: Validates bilingual EN/FR-CA support
- **Accessibility Audit**: WCAG 2.1 AA compliance using axe-core
- **Responsive Layout Tests**: Viewport testing (mobile/tablet/desktop)
- **Test Suite**: Unit and integration tests (when available)
- **Code Coverage**: Coverage threshold enforcement (placeholder for 80%)
- **Governance Audit**: Checks for forbidden patterns and violations
- **All Checks Complete**: Final gate requiring all checks to pass

**Severity Levels**:
- **P0 (Blockers)**: Failures that stop the pipeline (test failures, critical security issues, governance violations)
- **P1 (Serious)**: Important but not release-stoppers (warnings logged)
- **P2 (Minor)**: Informational only

### 2. Pull Request Validation (`pr-validation.yml`)

**Trigger**: On PR open, edit, synchronize, or reopen

Enforces PR-specific requirements:

- **Spec Reference Check**: Ensures PR links to a spec, requirement, or issue (SPEC-001, #123, etc.)
- **Description Check**: Requires meaningful PR description (minimum 20 characters)
- **Review Checklist**: Posts a reviewer checklist on new PRs with governance reminders
- **Label Suggestions**: Suggests appropriate labels based on PR content

Per governance: "No code without a spec" - each PR must reference its requirement.

### 3. Dependency Security (`dependency-security.yml`)

**Trigger**: Daily schedule, and on changes to `package.json`/`package-lock.json`

Monitors dependency health:

- **Dependency Audit**: Runs npm audit, fails on critical vulnerabilities
- **License Check**: Validates license compatibility
- **Outdated Packages**: Reports packages needing updates

Critical vulnerabilities are P0 blockers per CI Guardrails.

### 4. Release Gating (`release-gating.yml`)

**Trigger**: On version tags (`v*.*.*`) or manual workflow dispatch

Pre-release validation workflow:

- **P0 Issue Check**: Verifies no open P0/blocker issues exist
- **Full Test Suite**: Runs all lints, types, builds, tests
- **Environment Config**: Validates production configuration
- **Bundle Size Check**: Monitors build size against budget (5MB limit)
- **Smoke Tests**: Basic application functionality tests
- **Release Approval**: Requires environment approval before deployment

Per governance: "No go-live with open P0s" - release is blocked if any P0 issues exist.

### 5. AI Agent Audit (`ai-agent-audit.yml`)

**Trigger**: On all pull requests

Special audit for AI-generated code:

- **AI Detection**: Identifies PRs from AI agents (Codex, Gemini, Copilot)
- **Enhanced Scrutiny**: Stricter checks for forbidden patterns, scope creep
- **Pattern Analysis**: Validates TypeScript usage, i18n, architectural compliance
- **Audit Report**: Posts detailed review checklist for human reviewers

Per Multi-Agent Protocol: "AI-generated PRs get the full battery of tests and audits."

### 6. Dependabot Configuration (`dependabot.yml`)

Automated dependency update configuration:

- **NPM Updates**: Weekly checks for dependency updates
- **GitHub Actions**: Weekly checks for action updates
- **Security Priority**: Security updates always processed separately
- **Grouped Updates**: Patches grouped together to reduce PR noise

## Required Secrets and Variables

The workflows require the following to be configured in repository settings:

### Secrets (Repository Settings > Secrets and variables > Actions)

None required for basic functionality. Optional:
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### Environment Protection Rules

For release workflows, configure environments:
- **staging**: For staging deployments
- **production**: For production deployments (require approval)

## Local Development

To test workflows locally before pushing:

```bash
# Install act (GitHub Actions local runner)
# https://github.com/nektos/act

# Run a specific workflow
act pull_request -W .github/workflows/ci-guardrails.yml

# Run with specific event
act -e event.json
```

## Adding New Checks

When adding new CI checks:

1. Add the check as a new job in `ci-guardrails.yml` OR create a new workflow file
2. Update the `all-checks-complete` job to include the new job in `needs:`
3. Document the check in this README
4. Update `docs/governance/CI_Guardrails.md` if it represents a new governance rule

## Bypassing CI (Emergency Only)

Per governance, CI checks cannot be bypassed except in emergencies with admin privileges and proper authorization. Doing so without authorization violates the governance process.

If you need to bypass a check:
1. Document the reason in the PR
2. Get explicit approval from tech lead
3. Create a follow-up issue to address the problem properly
4. Never bypass P0 checks

## Troubleshooting

### Workflow Failing?

1. **Check the logs**: Click into the failed job to see detailed error messages
2. **Run locally**: Test the failing check locally before pushing
3. **Review governance**: Ensure your changes comply with all governance rules

### Common Issues

- **Localization fails**: Make sure all user-facing strings use i18n (`t('key')`)
- **Accessibility fails**: Check contrast ratios and semantic HTML
- **Security fails**: Never commit secrets, use environment variables
- **Governance fails**: No Next.js imports, no marketplace features, no hardcoded config

### Getting Help

- Review `docs/governance/CI_Guardrails.md` for detailed requirements
- Check `docs/governance/GOVERNANCE_MANIFEST.md` for overall rules
- Ask in team channels if you're unsure about a requirement

## Maintenance

These workflows should be reviewed and updated:
- When governance rules change
- When new tools or checks are added
- When dependencies are updated
- Quarterly to ensure they remain effective

---

**Remember**: The CI pipeline is your friend, not your enemy. It catches issues early when they're cheap to fix, ensuring high-quality code reaches production.
