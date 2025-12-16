# CI Support Scripts

This directory contains Node.js scripts used by CI workflows to enforce governance rules.

## Scripts

### `check-i18n.js`

Validates bilingual i18n support (EN/FR-CA parity).

**What it checks:**
- Both `src/i18n/locales/en.json` and `fr.json` exist
- All keys present in EN are also in FR (and vice versa)
- No empty translation values
- Reports key count for each locale

**Usage:**
```bash
npm run check:i18n
```

**Exit codes:**
- `0`: All checks passed
- `1`: Missing translations or key parity issues (P0 blocker)

**Per CI Guardrails:** Missing translations are P0 blockers.

---

### `check-stack.js`

Scans codebase for forbidden Next.js imports and patterns.

**What it checks:**
- No Next.js imports (`from 'next'`, `from 'next/*'`)
- No Next.js SSR patterns (`getServerSideProps`, `getStaticProps`, etc.)
- No Next.js file patterns (`_app.tsx`, `_document.tsx`)

**Usage:**
```bash
npm run check:stack
```

**Exit codes:**
- `0`: No forbidden patterns detected
- `1`: Next.js patterns found (P0 blocker)

**Per CI Guardrails:** Next.js imports are forbidden. Use Vite + React + Supabase stack.

---

## Adding New Scripts

When adding new governance checks:

1. Create the script in this directory
2. Use ES modules (`import`/`export`)
3. Include clear error messages with action items
4. Reference governance docs in output
5. Use exit code `0` for pass, `1` for fail
6. Add the script to `package.json` scripts section
7. Update this README

## Testing Scripts Locally

Before committing:

```bash
# Test i18n check
npm run check:i18n

# Test stack check
npm run check:stack

# Test forbidden patterns
npm run check:forbidden
```

All scripts should exit with code 0 if there are no violations.
