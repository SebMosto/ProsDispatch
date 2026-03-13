# Bead: Design System Rectification — App → Landing Aesthetic Parity

**Bead ID:** BEAD-DESIGN-001  
**Status:** Ready to Build  
**Type:** Config / Tokens (No feature changes)  
**Estimated Scope:** Small — CSS variables, Tailwind config, top-level layout classNames only  
**Assigned To:** Cursor  

---

## 1. Problem Statement

The app shell currently renders a default shadcn/ui dark theme (dark navy hero, teal gradient CTA, soft drop-shadows, 1px borders). This is generic starter-kit output. It does not reflect the brand identity established on the landing page, which uses: warm off-white background, near-black charcoal type, safety orange (#FF5C1B) as the primary action color, hard 2px borders, and brutalist drop-shadows.

**Visual reference:** See attached screenshots — `app_current.png` (before) and `landing_target.png` (after).

---

## 2. Objective

Make the authenticated app shell visually consistent with the landing page without touching any business logic, routing, data fetching, or component structure beyond className attributes and CSS token values.

---

## 3. Scope — Explicit Boundaries

### In Scope
- `src/index.css` (or equivalent global stylesheet) — `:root` CSS variable block
- `tailwind.config.js` — color extensions, shadow extensions, font family
- The top-level layout component(s) that render the app shell hero/header — className attributes only
- Removal or override of any `.dark` class block in global CSS that is applying the dark theme

### Out of Scope — Do Not Touch
- Any `.ts` / `.tsx` file except to change className strings
- Any repository, hook, schema, or service file
- Any routing logic
- Any Supabase calls
- Any i18n keys
- Any test files

If a change feels like it requires modifying business logic, **stop and flag it** rather than proceeding.

---

## 4. Exact Changes Required

### 4.1 — `src/index.css` (or global CSS file)

Replace the existing `:root` block with:

```css
:root {
  --background: hsl(220 20% 97%);
  --foreground: hsl(220 30% 15%);
  --card: #FFFFFF;
  --card-foreground: hsl(220 30% 15%);
  --popover: #FFFFFF;
  --popover-foreground: hsl(220 30% 15%);
  --primary: #FF5C1B;
  --primary-foreground: #1F1308;
  --secondary: hsl(220 20% 92%);
  --secondary-foreground: hsl(220 30% 15%);
  --muted: hsl(220 15% 90%);
  --muted-foreground: hsl(220 20% 40%);
  --accent: #FF7A3C;
  --accent-foreground: #1F1308;
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;
  --border: #0F172A;
  --input: #0F172A;
  --ring: #FF5C1B;
  --radius: 0.75rem;
}
```

**Also:** Delete or comment out the entire `.dark { ... }` block if one exists. Do not apply dark mode to any element.

### 4.2 — `tailwind.config.js`

In `theme.extend`, ensure the following are present (add if missing, update if different):

```js
boxShadow: {
  'brutal': '4px 4px 0 0 rgba(15, 23, 42, 0.9)',
  'brutal-success': '4px 4px 0 0 rgba(22, 101, 52, 0.9)',
  'brutal-glow': '0 0 0 2px rgba(255, 92, 27, 0.35), 6px 6px 0 0 rgba(255, 122, 60, 0.35)',
},
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
},
colors: {
  'safety-orange': {
    DEFAULT: '#FF5C1B',
    ink: '#1F1308',
    glow: '#FF7A3C',
  }
},
borderWidth: {
  'brutal': '2px',
},
```

### 4.3 — App Shell / Hero Component

Locate the component rendering the dark navy hero visible in `app_current.png`. It will contain a `className` with something like `bg-[#0F172A]`, `bg-slate-900`, or `dark:bg-*`.

Replace:
- Any hardcoded dark background class → remove it (let `--background` token apply)
- Any teal/gradient CTA button → replace with `bg-[#FF5C1B] text-[#1F1308] border-2 border-[#0F172A] shadow-brutal hover:shadow-brutal-glow`
- Any `1px` card borders → `border-2 border-[#0F172A]`
- Any `shadow-sm` or `shadow-md` on cards → `shadow-brutal`

---

## 5. Acceptance Criteria

- [ ] App background is warm off-white (`hsl(220 20% 97%)`), not dark navy
- [ ] Primary CTA button is safety orange (#FF5C1B) with dark ink text and hard border
- [ ] No teal or gradient colors remain in the shell
- [ ] Cards have 2px dark borders and brutalist drop-shadow
- [ ] Focus rings use safety orange
- [ ] `npm run build` passes with zero errors
- [ ] `npm run typecheck` passes with zero errors
- [ ] No business logic files were modified (verify via `git diff --name-only`)

---

## 6. Cursor Context Files to Load

Load these files before making any changes:

```
src/index.css                          # or globals.css — wherever :root lives
tailwind.config.js
src/App.tsx                            # or top-level layout
src/components/layout/                 # if a layout directory exists
docs/FRONTEND_GUIDELINES.md
```

Also load as visual reference:
- `app_current.png` (before — what to move away from)
- `landing_target.png` (after — what to match)

---

## 7. Governance Files to Load

```
docs/governance/GOVERNANCE_MANIFEST.md
AGENTS.md
```

---

## 8. Definition of Done

PR contains only diffs to:
- `src/index.css` (or equivalent)
- `tailwind.config.js`
- At most 1–2 layout component files (className strings only)

If the diff touches anything else, the PR is out of scope and must be revised before review.
