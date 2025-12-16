# CI/CD Setup Verification Checklist

Use this checklist after merging the CI/CD workflows to ensure everything is configured correctly.

## Pre-Merge Verification

- [ ] Review all workflow files for correctness
- [ ] Verify YAML syntax is valid
- [ ] Review documentation files
- [ ] Understand P0 blocker requirements
- [ ] Approve and merge the PR

## Post-Merge Setup (Critical)

### 1. Branch Protection Rules

**Path**: Settings → Branches → Add rule

- [ ] Click "Add branch protection rule"
- [ ] Branch name pattern: `main`
- [ ] Check: ✅ Require a pull request before merging
- [ ] Check: ✅ Require status checks to pass before merging
- [ ] Search and select these required checks:
  - [ ] `Linting & Static Analysis`
  - [ ] `Build & Type Check`
  - [ ] `Security Scanning`
  - [ ] `Localization Check`
  - [ ] `Accessibility Audit`
  - [ ] `Responsive Layout Tests`
  - [ ] `All CI Guardrails Passed`
  - [ ] `PR Requirements Check`
- [ ] Check: ✅ Require conversation resolution before merging
- [ ] Check: ✅ Do not allow bypassing the above settings (recommended)
- [ ] Click "Create" or "Save changes"

### 2. Environments Configuration

**Path**: Settings → Environments

- [ ] Click "New environment"
- [ ] Name: `staging`
- [ ] (Optional) Add required reviewers
- [ ] Click "Configure environment"
- [ ] Save

- [ ] Click "New environment" again
- [ ] Name: `production`
- [ ] Check: ✅ Required reviewers
- [ ] Add at least one reviewer (e.g., yourself, tech lead)
- [ ] Check: ✅ Wait timer (optional, e.g., 5 minutes)
- [ ] Click "Configure environment"
- [ ] Save

### 3. Issue Labels

**Path**: Settings → Labels

Create the following labels if they don't exist:

**Severity Labels:**
- [ ] `P0` - Color: `#d73a4a` (red) - "Critical blocker - stops release"
- [ ] `P1` - Color: `#d93f0b` (orange) - "Serious issue - high priority"
- [ ] `P2` - Color: `#fbca04` (yellow) - "Minor issue - low priority"
- [ ] `blocker` - Color: `#b60205` (dark red) - "Blocks progress"

**Category Labels:**
- [ ] `security` - Color: `#ee0701` - "Security vulnerability"
- [ ] `accessibility` - Color: `#5319e7` - "Accessibility (a11y) issue"
- [ ] `i18n` - Color: `#0e8a16` - "Internationalization/localization"
- [ ] `responsive` - Color: `#1d76db` - "Responsive design issue"
- [ ] `testing` - Color: `#bfd4f2` - "Test coverage or test issues"
- [ ] `dependencies` - Color: `#0366d6` - "Dependency update"
- [ ] `github-actions` - Color: `#2188ff` - "GitHub Actions workflow"

### 4. Security Features

**Path**: Settings → Code security and analysis

- [ ] Scroll to "Dependabot"
- [ ] Enable: ✅ Dependabot alerts
- [ ] Enable: ✅ Dependabot security updates

- [ ] Scroll to "Secret scanning"
- [ ] Enable: ✅ Secret scanning
- [ ] Enable: ✅ Push protection (prevents accidental secret commits)

- [ ] Scroll to "Code scanning"
- [ ] (Optional) Enable: CodeQL analysis for additional security scanning

### 5. Workflow Permissions

**Path**: Settings → Actions → General

- [ ] Scroll to "Workflow permissions"
- [ ] Select: `Read and write permissions` (needed for PR comments)
- [ ] Check: ✅ Allow GitHub Actions to create and approve pull requests
- [ ] Click "Save"

## Verification Tests

### Test 1: Create a Test PR

- [ ] Create a new branch: `test/ci-verification`
- [ ] Make a small change (e.g., add a comment to README.md)
- [ ] Create a PR to `main`
- [ ] Verify all CI workflows start automatically
- [ ] Check that "PR Requirements Check" passes (PR has description)
- [ ] Check that reviewer checklist comment is posted
- [ ] Close the PR without merging

### Test 2: Test P0 Blocker

- [ ] Create a new branch: `test/p0-blocker`
- [ ] Add a hardcoded string without i18n: `<button>Click Me</button>`
- [ ] Create a PR to `main` with title: "Test P0 blocker (DO NOT MERGE)"
- [ ] Verify "Localization Check" or other checks fail (depending on the violation)
- [ ] Verify PR cannot be merged due to failing checks
- [ ] Close the PR without merging

### Test 3: Test Spec Reference Requirement

- [ ] Create a new branch: `test/no-spec-ref`
- [ ] Make a small change
- [ ] Create a PR with title: "Test" and body: "Test" (no spec reference)
- [ ] Verify "PR Requirements Check" fails
- [ ] Edit PR to add "Relates to #1" in description
- [ ] Verify "PR Requirements Check" now passes
- [ ] Close the PR without merging

### Test 4: Verify Dependabot

- [ ] Go to "Insights" → "Dependency graph" → "Dependabot"
- [ ] Verify Dependabot is active
- [ ] Check for any open Dependabot PRs
- [ ] (Optional) Wait for first automated PR (should arrive within a week)

## Common Issues & Fixes

### Issue: Workflows not running

**Cause**: Actions might be disabled for the repository
**Fix**: Settings → Actions → General → "Allow all actions and reusable workflows"

### Issue: "PR Requirements Check" always fails

**Cause**: Script might not have permissions
**Fix**: Settings → Actions → General → Enable "Read and write permissions"

### Issue: Can't select workflow checks in branch protection

**Cause**: Workflows need to run at least once to appear in the list
**Fix**: Create and close a test PR to trigger workflows, then they'll appear in settings

### Issue: Environment protection not working

**Cause**: Environment not properly configured
**Fix**: Double-check Settings → Environments → Review each environment's settings

### Issue: Accessibility check fails on preview

**Cause**: Preview server might not start properly
**Fix**: This is expected initially - the check will work once the app is fully built

## Success Criteria

✅ **You'll know setup is complete when:**

1. Branch protection shows all required checks as "required"
2. New PRs automatically trigger all workflows
3. PRs without spec references fail validation
4. PRs cannot be merged with failing checks
5. Dependabot PRs start appearing weekly
6. Reviewer checklist automatically posts on new PRs
7. Release workflow requires production environment approval

## Ongoing Maintenance

### Weekly
- [ ] Review Dependabot PRs and merge security updates
- [ ] Check for any workflow failures in recent PRs

### Monthly
- [ ] Review Actions usage (Settings → Billing → Actions)
- [ ] Update workflow actions to latest versions if needed
- [ ] Review and close stale P2 issues

### Quarterly
- [ ] Review effectiveness of CI checks
- [ ] Update documentation if needed
- [ ] Consider adding new checks or removing ineffective ones

## Getting Help

If you encounter issues:

1. Check workflow run logs: Actions tab → Select the failed workflow → View logs
2. Review documentation: `.github/workflows/README.md`
3. Check GitHub Actions documentation: https://docs.github.com/actions
4. Ask in team channels or create an issue

## Notes

- **First-time setup takes ~15-30 minutes** to configure all settings
- **Workflows will fail initially** for placeholder tests/coverage - this is expected
- **Adjust severity levels** as needed for your team's workflow
- **Add more checks** as the project grows (E2E tests, performance tests, etc.)

---

**After completing this checklist, your CI/CD pipeline is fully operational and enforcing all governance rules! 🎉**
