# CI Guardrails Quick Reference

> Quick guide for developers working with the CI/CD pipeline

## ✅ What Gets Checked

Every PR and push runs these checks automatically:

1. **Linting & Type Check** - ESLint + TypeScript
2. **Build** - Production build (warnings = errors)
3. **Security** - Vulnerability scan + secret detection
4. **i18n** - Bilingual EN/FR-CA validation
5. **Accessibility** - WCAG 2.1 AA compliance
6. **Responsive** - Mobile/tablet/desktop layout
7. **Tests** - All tests must pass
8. **Coverage** - 80% minimum (when implemented)
9. **Governance** - No forbidden patterns
10. **PR Requirements** - Spec reference + description

## 🚫 P0 Blockers (Will Fail CI)

These issues **block merging**:

- ❌ Lint errors or type errors
- ❌ Build failures or warnings
- ❌ Critical security vulnerabilities
- ❌ Missing translations (hardcoded strings)
- ❌ Critical accessibility violations
- ❌ Layout breakage (horizontal scroll)
- ❌ Test failures
- ❌ Exposed secrets in code
- ❌ Forbidden patterns (Next.js, hardcoded config)
- ❌ PR missing spec reference

## ✏️ Before Creating a PR

### 1. Link to Spec/Issue
Your PR must reference a spec or issue:
```
Implements SPEC-001
Fixes #123
Relates to #456
```

### 2. Run Local Checks
```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Tests (when available)
npm test
```

### 3. Check Translations
All user-facing text must use i18n:
```tsx
// ❌ Bad
<button>Submit</button>

// ✅ Good
<button>{t('common.submit')}</button>
```

### 4. Check Accessibility
- Use semantic HTML
- Include ARIA labels
- Ensure sufficient contrast
- Test keyboard navigation

### 5. Test Responsiveness
Check your UI works on:
- Mobile (375px)
- Tablet (768px)
- Desktop (1920px)

## 🔍 Common CI Failures

### "Linting & Static Analysis" Failed
**Cause**: ESLint or TypeScript errors
**Fix**: Run `npm run lint` and `npx tsc --noEmit` locally

### "Security Scanning" Failed
**Cause**: Vulnerable dependency or exposed secret
**Fix**: 
- Run `npm audit fix`
- Remove any hardcoded API keys
- Use environment variables

### "Localization Check" Failed
**Cause**: Hardcoded strings or missing translations
**Fix**: 
- Wrap all text in `t('key')`
- Add keys to `src/i18n/locales/en.json` and `fr.json`

### "Accessibility Audit" Failed
**Cause**: WCAG violations
**Fix**:
- Add missing ARIA labels
- Fix color contrast issues
- Use semantic HTML elements

### "Responsive Layout Tests" Failed
**Cause**: Horizontal scroll on mobile
**Fix**:
- Remove fixed widths
- Use responsive units (%, rem, etc.)
- Test with browser dev tools mobile view

### "Governance Audit" Failed
**Cause**: Forbidden pattern detected
**Fix**:
- Remove Next.js imports (use Vite/React patterns)
- Remove hardcoded config (use env vars)
- No marketplace/bidding/escrow features

### "PR Requirements Check" Failed
**Cause**: Missing spec reference or description
**Fix**:
- Add spec reference to PR title or body
- Write meaningful description (20+ chars)

## 🤖 AI-Generated PRs

If your PR is from Codex/Gemini/Copilot:
- Receives enhanced scrutiny
- Same checks apply, stricter enforcement
- Human reviewer must verify against spec
- Check for scope creep and forbidden features

## 📋 PR Checklist

Use this before requesting review:

- [ ] PR references spec/requirement/issue
- [ ] PR has meaningful description
- [ ] All CI checks pass (green)
- [ ] Translations provided (EN + FR)
- [ ] Tested on mobile viewport
- [ ] No accessibility violations
- [ ] No hardcoded secrets or config
- [ ] Follows existing code patterns

## 🆘 Need Help?

1. Check workflow logs for detailed error messages
2. Review `docs/governance/CI_Guardrails.md`
3. See `.github/workflows/README.md` for workflow details
4. Ask team if you're stuck

## 🚀 Release Checklist

Before releasing to production:

- [ ] All P0 issues closed
- [ ] All CI checks pass
- [ ] Bundle size within budget
- [ ] Smoke tests pass
- [ ] Environment config validated
- [ ] Manual approval obtained

---

**Remember**: CI is here to help catch issues early. Fix issues as soon as CI reports them - they only get harder to fix later!
