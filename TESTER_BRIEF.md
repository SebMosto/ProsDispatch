# TESTER_BRIEF.md — ProsDispatch QA & Audit Guide

**Version:** 2.0  
**Purpose:** Equip a Claude or Cursor checker agent with everything needed to log in, test every feature, audit design and copy compliance, and produce a pointed, actionable bug report with fix instructions.  
**How to use:** Open all the HTML mockup files in a browser (§1.2) side-by-side with the live app. Read the priority documents (§1.1), then follow the test script (§3–§5) screen by screen, logging findings using the issue template (§6).

---

## 1. Reference Documents — Read These First

### 1.1 Specification Documents

| # | Document | Repo path | What it covers |
|---|----------|-----------|----------------|
| 1 | **MVP1 PRD** | [`docs/MVP1_PRD.md`](docs/MVP1_PRD.md) | Goals, success metrics, P0/P1 features, out-of-scope items |
| 2 | **Master PRD** | [`📘 MVP1 MASTER PRD — ProsDispatch.md`](<📘%20MVP1%20MASTER%20PRD%20—%20ProsDispatch.md>) | Full product spec (emoji in filename — open via GitHub UI if CLI fails) |
| 3 | **Design System** ⭐ | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Colour tokens, shadows, typography, border radii, every component pattern |
| 4 | **Screen Specs** ⭐ | [`docs/SCREEN_SPECS.md`](docs/SCREEN_SPECS.md) | Exact layout, grid columns, content order, i18n key list for every screen |
| 5 | **Mockup Catalog** ⭐ | [`docs/MOCKUP_CATALOG.md`](docs/MOCKUP_CATALOG.md) | HTML mockup to route mapping; per-screen implementation callouts |
| 6 | **Language Style Guide** ⭐ | [`docs/LANGUAGE_STYLE_GUIDE.md`](docs/LANGUAGE_STYLE_GUIDE.md) | Dispatch voice/tone, QC French rules, UI copy standards, email templates |
| 7 | **App Flow** | [`docs/APP_FLOW.md`](docs/APP_FLOW.md) | Navigation map, entry points, full user flows, error/edge-case states |
| 8 | **Frontend Guidelines** | [`docs/FRONTEND_GUIDELINES.md`](docs/FRONTEND_GUIDELINES.md) | Component patterns, accessibility rules, responsive/animation conventions |
| 9 | **Responsive Pattern** | [`docs/patterns/UX-Responsive-01.md`](docs/patterns/UX-Responsive-01.md) | Mobile-first mandate, breakpoints, touch-target rules |
| 10 | **CLAUDE.md** | [`CLAUDE.md`](CLAUDE.md) | Repo architecture, command reference — essential for writing fix instructions |
| 11 | **AGENTS.md** | [`AGENTS.md`](AGENTS.md) | Safety-first protocol, spec compliance rules, architecture consistency |

> **TL;DR priority:** Open the HTML mockups (§1.2) side-by-side with the live app. Then read Design System (#3), Screen Specs (#4), and Language Style Guide (#6).

---

### 1.2 Visual Design References — HTML Mockups ⭐⭐⭐

**These HTML files are the definitive visual ground truth.** Open each one in a browser alongside the live app and compare every element. Any deviation from these mockups is a bug.

| Mockup file | Route | What to compare |
|-------------|-------|-----------------|
| [`docs/mockups/dashboard_v4.html`](docs/mockups/dashboard_v4.html) | `/dashboard` | Topbar, sidebar, stats grid, alert banner, job rows, invoice rows, upcoming panel |
| [`docs/mockups/jobs_list_v2.html`](docs/mockups/jobs_list_v2.html) | `/jobs` | Filter tabs, table grid, accordion rows, status chips, context actions |
| [`docs/mockups/invoices_v4.html`](docs/mockups/invoices_v4.html) | `/invoices` | Summary strip, filter tabs, table grid, row actions (send/resend/mark paid/undo), toasts |
| [`docs/mockups/client_detail_v2.html`](docs/mockups/client_detail_v2.html) | `/clients/:id` | Profile card, KPI strip, unified history card with tabs |
| [`docs/mockups/settings_v2.html`](docs/mockups/settings_v2.html) | `/settings` | All settings sections, notification toggles, security rows, danger zone |
| [`docs/mockups/register_screen_v2.html`](docs/mockups/register_screen_v2.html) | `/register` | Public topbar, card layout, trade dropdown, "Other" expand animation |
| [`docs/mockups/forgot_password_v1.html`](docs/mockups/forgot_password_v1.html) | `/forgot-password` | Two-state card (default and success), lock icon, green success box |

> **No mockup exists for:** `/login`, `/clients` (list), `/jobs/new`, `/jobs/:id`, `/invoices/:id`, `/pay/:token`, `/jobs/approve/:token`. Use `docs/SCREEN_SPECS.md` for those screens.

---

## 2. Dispatch Voice and Copy Rules

Every visible string in the app must follow the Dispatch language style. Full guide: [`docs/LANGUAGE_STYLE_GUIDE.md`](docs/LANGUAGE_STYLE_GUIDE.md).

### 2.1 Tone Pillars (Non-Negotiable)
- **Clair et ancre dans le reel** — concrete, field-oriented, short active sentences, verbs first
- **Autorite calme** — reassuring, structured, professional. Not startup-y. Not condescending.
- **Respect du metier** — speak to professionals. No gamification, no over-simplification.

### 2.2 The RBQ Litmus Test
> "Could this text appear on an RBQ website or a federation of dairy producers' website, without seeming out of place?"
> If yes: validated. If no: needs rewriting.

### 2.3 UI Copy Checklist
- [ ] **No exclamation marks** in functional UI (forms, errors, toasts, banners)
- [ ] **No emoji** in functional UI (only marketing/landing may use them sparingly)
- [ ] **No "Oops!" or "Uh oh!"** — errors must be factual: "Unable to submit. Please check your connection."
- [ ] **No "Thanks!" or "Great!"** — confirmations must be direct: "Request received. Check your email."
- [ ] **No startup jargon** — no "optimize", "seamless", "innovative platform"
- [ ] **No literal translation** of English into French — QC French must sound natural
- [ ] "Vous" everywhere — never "tu"

### 2.4 Button Copy Reference (FR)
| English | Correct QC French | Never use |
|---------|-------------------|-----------|
| Sign in | Se connecter | Login |
| Create account | Creer votre compte | S'inscrire |
| Save changes | Enregistrer les modifications | Sauvegarder |
| Send for approval | Envoyer pour approbation | Soumettre |
| Mark completed | Marquer comme termine | Done |
| New job | Nouveau travail | Nouveau job |

### 2.5 Error Message Standards
| Scenario | EN | FR |
|----------|----|----|
| Form validation | "One or more fields are missing or invalid. Please review." | "Un ou plusieurs champs sont manquants ou invalides. Veuillez verifier." |
| Network error | "Unable to complete this action. Please check your connection and try again." | "Impossible d'effectuer cette action. Verifiez votre connexion et reessayez." |
| Already registered | "This email is already registered." | "Ce courriel est deja enregistre." |
| Token expired | "This link has expired. Please contact the contractor." | "Ce lien a expire. Veuillez contacter votre entrepreneur." |

---

## 3. App Architecture Quick Reference

### Routes

| Route | Auth? | Component |
|-------|-------|-----------|
| `/` | Public | `HomePage` |
| `/login` | Public | `SignInPage` |
| `/register` | Public | `SignUpPage` |
| `/forgot-password` | Public | `ForgotPasswordPage` |
| `/dashboard` | Yes | `DashboardPage` |
| `/jobs` | Yes | `JobsListPage` |
| `/jobs/new` | Yes | `CreateJobPage` |
| `/jobs/:id` | Yes | `JobDetailPage` |
| `/invoices` | Yes | `InvoicesListPage` |
| `/invoices/:id` | Yes | `InvoiceDetailPage` |
| `/clients` | Yes | `ClientsListPage` |
| `/clients/new` | Yes | `CreateClientPage` |
| `/clients/:id` | Yes | `ClientDetailPage` |
| `/clients/:id/edit` | Yes | `ClientEditPage` |
| `/clients/:id/properties/new` | Yes | `CreatePropertyPage` |
| `/settings` | Yes | `SettingsPage` |
| `/settings/billing` | Yes | `BillingSettingsPage` |
| `/settings/stripe` | Yes | `StripeConnectPage` |
| `/subscribe` | Yes | `SubscribePage` |
| `/pay/:token` | Public | `PublicInvoicePage` |
| `/jobs/approve/:token` | Public | `JobApprovalPage` |

### Job Status State Machine
```
draft -> sent -> approved -> in_progress -> completed -> invoiced -> paid -> archived
```
Transitions via `transition_job_state` Supabase RPC only — never mutate status directly.

### Key Design Tokens (exact values from HTML mockup CSS)
```
Primary orange:   #FF5C1B   (CTAs, active nav, overdue, focus rings, alert dots)
Primary ink:      #1F1308   (text/icons ON orange backgrounds)
Brand navy:       #0F172A   (borders, headings, logo, sidebar active, dark fills)
Success green:    #16A34A   (paid, completed, connected, revenue)
Destructive red:  #EF4444   (delete only)
Muted grey:       #94A3B8   (placeholders, captions, disabled, dates)
Slate 500:        #64748B   (secondary text, inactive nav items)
Toggle inactive:  #CBD5E1   (toggle OFF track colour)
Page background:  hsl(220 20% 97%)
Card border:      2px solid #0F172A
Card shadow:      2px 2px 0 0 rgba(15,23,42,0.9)
Auth card shadow: 4px 4px 0 0 rgba(15,23,42,0.9)
Button radius:    7px  (inline actions: 6px)
Font:             Inter (ui-sans-serif fallback)
Base font size:   13px
```

### WARNING: Settings Toggle ON Colour — Mockup Overrides DESIGN_SYSTEM
`settings_v2.html` uses **navy `#0F172A`** for toggle ON state.
`DESIGN_SYSTEM.md` documents it as orange `#FF5C1B`.
**The HTML mockup is the definitive visual ground truth for implementation.** The mockup was approved after `DESIGN_SYSTEM.md` was written and supersedes it on this specific point. Settings toggles must be navy when ON.

> Note to developer: Update `docs/DESIGN_SYSTEM.md` toggle section to match — use navy `#0F172A` for ON state to remove this discrepancy and keep a single source of truth.

Flag any orange toggle in Settings as a P2 bug.

---

## 4. Global Design System Checklist

### 4.1 Colours
- [ ] Primary CTA buttons: `#FF5C1B` bg, `#1F1308` text — not Tailwind blue/indigo
- [ ] No Tailwind default colours on interactive elements (`bg-blue-*`, `bg-indigo-*`, `ring-blue-*`)
- [ ] Overdue/needs-attention: **orange** `#FF5C1B` (never red)
- [ ] Delete/destroy only: **red** `#EF4444`
- [ ] Paid/completed/revenue: **green** `#16A34A`
- [ ] Page background: `hsl(220 20% 97%)` — not pure white, not Tailwind gray-100

### 4.2 Shadows (Hard Drop Shadows — No Soft/Diffuse)
- [ ] Section cards: `box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9)` — NO `shadow-md`, `shadow-lg`
- [ ] Auth cards (login/register/forgot): `box-shadow: 4px 4px 0 0 rgba(15,23,42,0.9)`
- [ ] Primary button: `2px 2px` default; hover: `4px 4px`; active: `1px 1px`
- [ ] Needs-action card: `2px 2px 0 0 rgba(255,92,27,0.35)` (orange tint)
- [ ] Success card: `2px 2px 0 0 rgba(22,101,52,0.3)` (green tint)
- [ ] Danger zone card: `2px 2px 0 0 rgba(239,68,68,0.3)` (red tint)
- [ ] Success icon box (forgot password): `3px 3px 0 0 rgba(22,101,52,0.9)` (from mockup CSS)

### 4.3 Typography
- [ ] Font: Inter throughout — no serif fonts in app shell
- [ ] Page titles: `19px font-bold #0F172A` (19px exact from dashboard mockup)
- [ ] Card section headings: `12px font-bold`
- [ ] Body: `13px normal`
- [ ] Captions/labels: `9–11px font-bold uppercase tracking-wider #94A3B8`
- [ ] Secondary text: `12px normal #64748B`
- [ ] All text via `t('key')` — zero hardcoded strings in JSX

### 4.4 Cards (from `dashboard_v4.html` CSS)
```css
background: #fff; border: 2px solid #0F172A;
border-radius: 9px; box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9);
overflow: hidden;
```
- [ ] Section head row: `padding: 11px 16px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 700`
- [ ] Internal row dividers: `border-bottom: 1px solid #F1F5F9`

### 4.5 Buttons

Primary (from `dashboard_v4.html`):
```css
height: 36px; background: #FF5C1B; color: #1F1308;
border: 2px solid #0F172A; border-radius: 7px;
padding: 0 13px; font-size: 12px; font-weight: 700;
box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9);
```
Hover: `box-shadow: 4px 4px 0 0 rgba(15,23,42,0.9); transform: translate(-1px,-1px)`

Auth CTAs (from `register_screen_v2.html`):
```css
width: 100%; height: 48px; border-radius: 10px; font-size: 15px;
box-shadow: 3px 3px 0 0 rgba(15,23,42,0.9);
```

Inline action buttons: `height: 30px; font-size: 11px; font-weight: 700; border-radius: 6px; border: 1.5px solid; padding: 0 9px`

### 4.6 Status Badges (from `jobs_list_v2.html` CSS)
```css
font-size: 9px; font-weight: 700; letter-spacing: 0.4px;
text-transform: uppercase; padding: 3px 6px;
border-radius: 4px; border: 1.5px solid; white-space: nowrap;
```

| Status | BG | Text | Border |
|--------|----|------|--------|
| Draft | `#F1F5F9` | `#475569` | `#CBD5E1` |
| Sent / Awaiting | `#FFF7ED` | `#EA580C` | `#EA580C` |
| Approved | `#F0FDF4` | `#16A34A` | `#16A34A` |
| In progress | `#F5F3FF` | `#7C3AED` | `#7C3AED` |
| Completed | `#F0FDF4` | `#16A34A` | `#16A34A` |
| Invoiced | `#FFF7ED` | `#EA580C` | `#EA580C` |
| Paid | `#F0FDF4` | `#16A34A` | `#16A34A` |
| Overdue | `#FFF1EC` | `#FF5C1B` | `#FF5C1B` |

Note: "Overdue" is a derived invoice state — not a job state machine step.

Tappable chips: `cursor: pointer; transition: transform 0.1s` plus `>>` suffix. Hover: `transform: translateY(-1px)`.

### 4.7 Inputs
```css
height: 44px; border: 2px solid #0F172A; border-radius: 10px;
padding: 0 14px; font-size: 14px;
background: hsl(220 20% 97%); color: #0F172A;
```
Focus: `border-color: #FF5C1B; box-shadow: 0 0 0 3px rgba(255,92,27,0.15)`
Placeholder: `#94A3B8`
Settings compact: `height: 36px; border: 1.5px solid #CBD5E1; border-radius: 7px; font-size: 13px`
Search inputs: `padding-left: 30px` with icon `position: absolute; left: 10px; top: 50%; transform: translateY(-50%)`

### 4.8 Navigation

Topbar (from `dashboard_v4.html`):
```css
background: #fff; border-bottom: 1.5px solid #0F172A; height: 52px; padding: 0 20px;
```
- Logo icon: `30x30px #0F172A border-radius: 7px`
- Logo text: "Dispatch" + `1px #94A3B8` divider + "Labs" — both `14px 700 #0F172A`
- Language pill: `background: #F1F5F9; border-radius: 999px; padding: 4px 12px 4px 8px; font-size: 12px`
- User avatar: `30x30 #FF5C1B border: 2px solid #0F172A`

Sidebar (from `dashboard_v4.html`):
```css
width: 160px; background: #fff; border-right: 1.5px solid #0F172A; padding: 12px 0;
```
- Nav section labels: `9px 700 uppercase letter-spacing: 1px color: #CBD5E1`
- Nav inactive: `12px 500 #64748B; border-left: 3px solid transparent`
- Nav active: `12px 700 #0F172A; border-left: 3px solid #FF5C1B; background: hsl(220 20% 97%)`
- Count badges: `9px 700 bg: #FF5C1B color: #1F1308; border-radius: 999px; padding: 1px 5px`
- Sidebar footer user: avatar `26x26 #FF5C1B border: 1.5px solid #0F172A`, name `11px 700`, role `10px #94A3B8`
- [ ] Sidebar: visible on desktop (md+), hidden on mobile
- [ ] Bottom nav: visible on mobile only, hidden on desktop (md+)

### 4.9 Filter Tabs (from `invoices_v4.html` CSS — active tab is NAVY, not orange)
```css
/* Inactive */
font-size: 12px; font-weight: 600; padding: 5px 12px;
border-radius: 6px; border: 1.5px solid #CBD5E1; background: #fff; color: #64748B;
/* Active */
background: #0F172A; color: #fff; border-color: #0F172A;
/* Count badge */
background: #FF5C1B; color: #1F1308; font-size: 9px; border-radius: 999px;
/* Count badge on active tab */
background: #fff; color: #0F172A;
```

### 4.10 Toasts (from `dashboard_v4.html` CSS)
```css
position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
background: #0F172A; color: #fff; font-size: 12px; font-weight: 600;
padding: 9px 18px; border-radius: 8px;
opacity: 0; transition: opacity 0.2s; pointer-events: none; white-space: nowrap; z-index: 99;
```
- Visible for 2.5 seconds then fades (opacity transition — not display toggle)
- One toast at a time — reset timer on each new toast
- Copy must follow §2 — no "!", no emoji

### 4.11 Accessibility
- [ ] All icon-only buttons have `aria-label`
- [ ] Toggle switches have `role="switch"` and `aria-checked`
- [ ] Minimum touch targets: `44x44px` on mobile
- [ ] Focus rings: `box-shadow: 0 0 0 3px rgba(255,92,27,0.35)` on `:focus-visible`
- [ ] Language switcher on all public pages and in the app header

### 4.12 i18n
- [ ] Language switcher works — switching to FR renders French text
- [ ] No raw English strings visible in French view
- [ ] French copy passes RBQ litmus test (§2.2) — not literal translations

---

## 5. Screen-by-Screen Test Script

**Method:** Open the matching HTML mockup in a browser tab (§1.2). Navigate to the same route in the live app. Compare every element. Log deviations using the Issue Template in §6.

---

### Screen 1: Home Page (`/`)
> No HTML mockup — use `docs/APP_FLOW.md §1`

- [ ] Page loads without JS errors
- [ ] CTA to sign in or get started is present
- [ ] Language switcher visible and functional
- [ ] No horizontal scroll on 375px viewport
- [ ] Copy tone: no exclamation marks, no startup jargon (§2)

---

### Screen 2: Sign In (`/login`)
> No HTML mockup — use `docs/SCREEN_SPECS.md §1`

Card spec: `max-width: 420px; border: 2px solid #0F172A; border-radius: 14px; box-shadow: 4px 4px 0 0 rgba(15,23,42,0.9); padding: 40px`

- [ ] Public topbar: `background: hsl(220 20% 97%); border-bottom: 1px solid #CBD5E1`
- [ ] Orange label "Contractor access": `11px 700 uppercase #FF5C1B letter-spacing: 1.2px`
- [ ] Title "Sign in to Dispatch": `24px 700`
- [ ] EMAIL and PASSWORD field labels: `uppercase 11px 700`
- [ ] "Forgot password?" right-aligned, muted, hover orange — navigates to `/forgot-password`
- [ ] "Sign in" CTA: full-width, `height: 48px`, orange `#FF5C1B`, `border-radius: 10px`
- [ ] "Create your contractor account ->" link navigates to `/register`
- [ ] Valid credentials: logs in and redirects to `/dashboard`
- [ ] Invalid credentials: error message shown in UI (not console-only)
- [ ] Empty submission: both fields show required validation errors

Fix — CTA button (replace blue/indigo):
```tsx
// src/pages/auth/SignInPage.tsx
className="w-full h-12 bg-[#FF5C1B] text-[#1F1308] border-2 border-[#0F172A] rounded-[10px] font-bold text-[15px] shadow-[3px_3px_0_0_rgba(15,23,42,0.9)] hover:shadow-[5px_5px_0_0_rgba(15,23,42,0.9)] hover:-translate-x-px hover:-translate-y-px active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px transition-all"
```

---

### Screen 3: Register (`/register`)
> **Mockup:** `docs/mockups/register_screen_v2.html` — open in browser

Card spec (from mockup): `max-width: 460px; border: 2px solid #0F172A; border-radius: 14px; box-shadow: 4px 4px 0 0 rgba(15,23,42,0.9); padding: 40px 40px 36px`

- [ ] Open `register_screen_v2.html` side-by-side — layout must match
- [ ] Orange label "New contractor account" (`11px 700 uppercase`)
- [ ] Title "Create your account" (`24px 700`)
- [ ] Two-column: First name | Last name (required asterisks in `#FF5C1B`)
- [ ] Business name (optional — no asterisk)
- [ ] Trade dropdown: Plumbing, HVAC, Electrical, General contractor, Roofing, Other
- [ ] "Other" reveals text input with animation (`max-height: 0 to 60px; opacity: 0 to 1; transition: 0.2s ease`), orange border `2px solid #FF5C1B`, auto-focuses on reveal
- [ ] Divider "Account credentials"
- [ ] Email (required) + two-column Password | Confirm
- [ ] CTA "Create account": `width: 100%; height: 48px; border-radius: 10px; box-shadow: 3px 3px 0 0 rgba(15,23,42,0.9)`
- [ ] Terms text + "Already have an account? Sign in ->" navigates to `/login`
- [ ] Password mismatch shows error
- [ ] Copy: no "Sign up!" — calm professional phrasing only

---

### Screen 4: Forgot Password (`/forgot-password`)
> **Mockup:** `docs/mockups/forgot_password_v1.html` — open in browser

Card spec (from mockup): `max-width: 420px; border-radius: 14px; box-shadow: 4px 4px 0 0 rgba(15,23,42,0.9); padding: 40px`

- [ ] Open `forgot_password_v1.html` side-by-side
- [ ] "<- Back to sign in" link navigates to `/login`
- [ ] Lock icon box: `44x44px; border: 2px solid #0F172A; border-radius: 10px; background: hsl(220 20% 97%)`
- [ ] Orange label "Password reset" (`11px 700 uppercase`)
- [ ] Title "Forgot your password?" (`24px 700`)
- [ ] Subtitle `14px #64748B` — factual copy, no "Oops!"
- [ ] Email field + "Send reset link" full-width CTA (`height: 48px`)
- [ ] Success state after submit:
  - Green icon box: `56x56px; background: #F0FDF4; border: 2px solid #16A34A; border-radius: 12px; box-shadow: 3px 3px 0 0 rgba(22,101,52,0.9)`
  - Title "Check your email" (`22px 700`)
  - Body with email address in bold (`<strong>`)
  - "Back to sign in" outline button
  - "Didn't receive it? Send again" returns to default state

---

### Screen 5: Dashboard (`/dashboard`)
> **Mockup:** `docs/mockups/dashboard_v4.html` — open in browser

- [ ] Open `dashboard_v4.html` side-by-side
- [ ] Page bg: `hsl(220 20% 97%)` — not pure white
- [ ] Topbar: `height: 52px; border-bottom: 1.5px solid #0F172A; background: #fff`
- [ ] Logo: hammer icon (`30x30 #0F172A border-radius: 7px`) + "Dispatch | Labs" (`14px 700`)
- [ ] Sidebar: `160px; border-right: 1.5px solid #0F172A`
- [ ] Nav active item: `border-left: 3px solid #FF5C1B; font-weight: 700; color: #0F172A; background: hsl(220 20% 97%)`
- [ ] Nav count badge: `9px 700 bg: #FF5C1B color: #1F1308; border-radius: 999px`
- [ ] Sidebar footer: avatar `26x26 #FF5C1B border: 1.5px #0F172A`, name `11px 700`, role `10px #94A3B8`
- [ ] Alert banner (only if overdue invoices exist): `border: 1.5px solid #FF5C1B; background: #fff; box-shadow: 2px 2px 0 0 rgba(255,92,27,0.3)` — 8px orange dot, factual text (no "!"), "View invoices ->" link
- [ ] Page header: "Good morning, [first_name]." (`19px 700`) + date (`11px #94A3B8`)
- [ ] "New client" secondary + "New job" primary (both `height: 36px`)
- [ ] Stats grid: `grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px`
  - Default: `border: 2px solid #0F172A; box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9)`
  - Needs-action: `border-color: #FF5C1B; box-shadow: 2px 2px 0 0 rgba(255,92,27,0.35); value: #FF5C1B`
  - Success: `border-color: #16A34A; box-shadow: 2px 2px 0 0 rgba(22,101,52,0.3); value: #16A34A`
- [ ] Two-column: `grid-template-columns: 1fr 280px; gap: 14px`
- [ ] Job rows: address + status chip + description + client + date
- [ ] Status chips correct colours per §4.6
- [ ] Overdue invoice rows: client name + amount in `#FF5C1B` + "Resend" button (`border: 1.5px solid #FF5C1B; border-radius: 6px; padding: 4px 9px`)
- [ ] Upcoming date badge: `34px wide; border: 1.5px solid #0F172A; border-radius: 6px` — month `8px 700 uppercase #FF5C1B`
- [ ] Toast fires on status change: factual copy, no "!"

---

### Screen 6: Jobs List (`/jobs`)
> **Mockup:** `docs/mockups/jobs_list_v2.html` — open in browser

- [ ] Open `jobs_list_v2.html` side-by-side
- [ ] Page title "Jobs" `19px 700`
- [ ] Search input: icon at `left: 10px`, `padding-left: 30px`
- [ ] Filter tabs active = NAVY-FILLED per §4.9 (not orange): Active | Draft | Awaiting approval | Completed | All
- [ ] Table grid MANDATORY — verify with DevTools: `grid-template-columns: 110px 2fr 1.5fr 80px 36px`
- [ ] Column headers: `9px 700 uppercase #94A3B8`
- [ ] Status chips correct colours per §4.6
- [ ] Dates within 3 days: `#FF5C1B font-bold`
- [ ] Clicking row: expands (one open at a time); chevron rotates 180 degrees + turns `#FF5C1B`
- [ ] Expanded panel: `background: hsl(220 20% 97%); padding: 14px 16px 16px; max-height: 0 to 300px; transition: 0.25s ease`
- [ ] Context-sensitive actions by status:
  - Draft: "Send for approval" (orange primary, `height: 30px`)
  - Approved: "Start job" (orange primary)
  - In progress: "Mark completed" (orange primary)
  - Completed: "Create invoice" (orange outline)
  - All statuses: "Edit job" (navy outline)
- [ ] Real-time search filtering (no page reload)
- [ ] Empty state: "No jobs match this filter." (factual, no emoji)

Fix — table grid (cannot express in standard Tailwind grid-cols utility):
```tsx
// Wrap list container in a grid:
style={{ display: 'grid', gridTemplateColumns: '110px 2fr 1.5fr 80px 36px' }}
```

---

### Screen 7: Create Job (`/jobs/new`)
> No mockup — use `docs/SCREEN_SPECS.md`

- [ ] Client selector (existing or new inline)
- [ ] Property selection linked to client
- [ ] Service date picker works on mobile
- [ ] Description textarea
- [ ] Required field validation fires before submit
- [ ] Creates job as "Draft" — appears in Jobs list with Draft badge
- [ ] Redirects to job detail after success

---

### Screen 8: Job Detail (`/jobs/:id`)
> No mockup — use `docs/SCREEN_SPECS.md`

- [ ] Status badge colours match §4.6
- [ ] Correct action buttons for current status (state machine §3)
- [ ] Toast on status change — factual copy, no "!"
- [ ] "Edit" available for draft; critical fields locked for sent/approved
- [ ] Back navigation present

---

### Screen 9: Clients List (`/clients`)
> No mockup — use `docs/SCREEN_SPECS.md §6`

- [ ] Table grid: `grid-template-columns: 2fr 1.5fr 100px 60px 36px`
- [ ] Avatar colour rotation mod 5 (orange, blue, green, purple, amber)
- [ ] Last job date: this month = `#16A34A 600`; older = `#64748B`
- [ ] Accordion expanded: phone (orange link) | address | client since
- [ ] Actions: "New job" primary + "View profile" navy outline

---

### Screen 10: Client Detail (`/clients/:id`)
> **Mockup:** `docs/mockups/client_detail_v2.html` — open in browser

- [ ] Open `client_detail_v2.html` side-by-side
- [ ] Breadcrumb: "<- Clients / [Client name]"
- [ ] Profile header card: `border: 2px solid #0F172A; border-radius: 10px; box-shadow: 3px 3px 0 0 rgba(15,23,42,0.9); padding: 20px 22px`
- [ ] 48px avatar + name `19px 700` + address/phone link/email link
- [ ] "New job" primary + "Edit" outline buttons top-right
- [ ] Secondary meta strip with border-right dividers: Language | Source | Client since | Property count
- [ ] KPI strip: Total jobs | Revenue (green value) | Last service | Outstanding (orange if overdue)
- [ ] Unified history card with sticky header (`position: sticky; top: 0; z-index: 2`)
- [ ] Active tab: `border-bottom: 2.5px solid #FF5C1B; color: #0F172A; font-weight: 600`
- [ ] Property filter: visible on Jobs tab only
- [ ] Scroll area: `max-height: 400px; overflow-y: auto`
- [ ] Jobs grid: `grid-template-columns: 2fr 80px 90px`
- [ ] Invoices grid: `grid-template-columns: 70px 1fr 90px 90px`
- [ ] Overdue amount: `#FF5C1B`; Paid: `#16A34A`; Default: `#0F172A`

---

### Screen 11: Invoices List (`/invoices`)
> **Mockup:** `docs/mockups/invoices_v4.html` — open in browser

- [ ] Open `invoices_v4.html` side-by-side
- [ ] Summary strip: 4 cards — Overdue (orange shadow) | Awaiting (orange) | Paid/month (green) | Total/month (default)
- [ ] Filter tabs: active = NAVY-FILLED per §4.9
- [ ] Table grid MANDATORY: `grid-template-columns: 56px 2fr 66px 74px 78px 90px`
- [ ] Column headers left-aligned
- [ ] Overdue date: `#FF5C1B font-bold` + ` · Nd` (N days overdue)
- [ ] Row actions by status (from `invoices_v4.html`):
  - Overdue: "Resend" (`color: #FF5C1B; border: 1.5px solid #FF5C1B; height: 30px`)
  - Sent: "Mark paid" (`color: #16A34A; border: 1.5px solid #16A34A`)
  - Draft: "Send" (becomes "Resend" immediately after click — no reload)
  - Paid: no actions
- [ ] Mark paid -> Undo flow:
  - Status badge flips to Paid immediately
  - "Undo" button appears (`color: #64748B; border: 1.5px solid #CBD5E1`)
  - Undo auto-hides after exactly 8 seconds
  - Click Undo: reverts badge, actions, and data
  - Toast: "Marked as paid · [Client name]" (no "!")
  - Undo toast: "Undone — [Client name] back to [previous status]"
- [ ] Send -> Resend: click "Send" -> status flips to Sent, button becomes "Resend" without reload
- [ ] Row click navigates to invoice detail; actions use `stopPropagation()`

Fix — mark paid with correct prevStatus:
```tsx
// src/pages/invoices/InvoicesListPage.tsx
const handleMarkPaid = async (invoiceId: string, clientName: string, prevStatus: string) => {
  await updateInvoiceStatus(invoiceId, 'paid');
  showToast(`Marked as paid · ${clientName}`);
  setUndoState({ id: invoiceId, prevStatus });
  undoTimer.current = setTimeout(() => setUndoState(null), 8000);
};
const handleUndo = async (invoiceId: string, clientName: string, prevStatus: string) => {
  clearTimeout(undoTimer.current);
  await updateInvoiceStatus(invoiceId, prevStatus);
  setUndoState(null);
  showToast(`Undone — ${clientName} back to ${prevStatus}`);
};
```

---

### Screen 12: Invoice Detail (`/invoices/:id`)
> No mockup — use `docs/SCREEN_SPECS.md`

- [ ] Invoice number, date, client name, property address visible
- [ ] Line items: description, qty, unit price, subtotal per line
- [ ] Tax breakdown itemised (GST/HST/QST)
- [ ] Total amount prominently shown
- [ ] Status badge correct colours per §4.6
- [ ] "Pay Now" link for sent invoices

---

### Screen 13: Settings (`/settings`)
> **Mockup:** `docs/mockups/settings_v2.html` — open in browser

- [ ] Open `settings_v2.html` side-by-side
- [ ] All sections present: Profile | Language | Notifications | Billing | Stripe | Security | Danger zone
- [ ] Profile field rows: `grid-template-columns: 160px 1fr auto; padding: 13px 18px; border-bottom: 1px solid #F1F5F9`
- [ ] Language segmented control works (EN/FR)
- [ ] Notification toggles — compare each to mockup:
  - Dimensions from `settings_v2.html`: `width: 40px; height: 22px; border-radius: 999px`
  - Knob: `16x16px; top: 3px; left: 3px (OFF); transform: translateX(18px) (ON)`
  - ON colour: `#0F172A` NAVY (NOT orange — see §3 warning)
  - OFF colour: `#CBD5E1`
  - Description text ON: `#374151`; OFF: `#94A3B8`
  - Defaults: Job approvals ON | Invoice paid ON | Overdue reminders ON | Marketing emails OFF
  - Each toggle has `role="switch"` and `aria-checked`
- [ ] Security rows: "Change" + "Reset" both `height: 30px; border: 1.5px solid #FF5C1B; color: #FF5C1B; border-radius: 5px`
- [ ] Danger zone: section label `color: #EF4444`; card `border: 2px solid #EF4444; box-shadow: 2px 2px 0 0 rgba(239,68,68,0.3)`

Fix — toggle colour (navy ON, from `settings_v2.html`):
```tsx
// src/pages/SettingsPage.tsx
<button
  role="switch"
  aria-checked={isOn}
  onClick={() => toggleNotification(key)}
  className={`relative w-10 h-[22px] rounded-full border-0 p-0 cursor-pointer transition-colors duration-200 ${isOn ? 'bg-[#0F172A]' : 'bg-[#CBD5E1]'}`}
>
  <div className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isOn ? 'translate-x-[18px]' : 'translate-x-0'}`} />
</button>
<p className={`text-xs leading-relaxed transition-colors duration-200 ${isOn ? 'text-[#374151]' : 'text-[#94A3B8]'}`}>
  {description}
</p>
```

---

### Screen 14: Job Approval (`/jobs/approve/:token`)
> No mockup — `docs/APP_FLOW.md §2 Flow B step 3`

- [ ] Loads without auth
- [ ] Contractor name, job description, property, date, line items visible
- [ ] "Approve" and "Decline" buttons present
- [ ] Approve: success confirmation shown, job transitions to `approved`
- [ ] Invalid/expired token: "This link has expired. Please contact the contractor." (factual, no "Oops!")
- [ ] Language switcher present

---

### Screen 15: Public Invoice Payment (`/pay/:token`)
> No mockup — `docs/APP_FLOW.md §2 Flow B step 6`

- [ ] Loads without auth
- [ ] Business name, invoice number, line items, tax breakdown, total visible
- [ ] "Pay Now" triggers Stripe Checkout
- [ ] Already-paid invoice shows success state (no duplicate "Pay Now")
- [ ] Invalid/expired token shows error message

---

## 6. User Flow End-to-End Tests

### Flow 1: New Contractor Onboarding
1. Navigate to `/register`, fill all required fields, submit
2. Redirects to `/dashboard`
3. Sidebar footer shows correct business name/role
4. **Pass:** dashboard loads, no JS errors, copy is calm (no "!")

### Flow 2: Full Job Lifecycle (Happy Path)
1. Dashboard -> "New job" -> create job -> appears in Jobs list with Draft badge
2. Send for approval -> badge becomes "Awaiting" (correct colours)
3. Advance to Approved -> "Start job" -> In Progress
4. "Mark completed" -> Completed -> "Create invoice"
5. Invoice created -> job becomes Invoiced, invoice in `/invoices`
6. Mark invoice paid -> undo appears, auto-hides in 8 seconds
7. **Pass:** every badge correct colour, every action button correct, toasts factual (no "!")

### Flow 3: Client Management
1. Create client -> appears in `/clients` with avatar colour rotation
2. Client detail shows empty history
3. Create job from client -> job appears in history Jobs tab
4. Edit client -> changes persist after refresh
5. **Pass:** CRUD works, avatar colour matches index mod 5

### Flow 4: Invoice Workflow
1. Summary strip shows correct totals
2. Active filter tab is NAVY-filled (not orange)
3. Mark paid -> undo timer = exactly 8 seconds
4. Send draft -> button becomes "Resend" without page reload
5. Resend overdue -> toast: "Reminder sent to..." (no state change)
6. **Pass:** all four interaction flows work correctly per DESIGN_SYSTEM

### Flow 5: Settings & Language
1. Toggle language to FR -> entire UI renders in French
2. French copy passes RBQ litmus test (§2.2) -- no startup jargon, no "!"
3. Toggle notification OFF -> track `#CBD5E1`, description `#94A3B8`
4. Toggle ON -> track `#0F172A` NAVY (not orange)
5. Save profile -> persists on page refresh
6. **Pass:** language switch works, toggles navy ON, copy professional

---

## 7. Issue Log Template

```markdown
### [ISSUE-###] Short title

**Severity:** P0 | P1 | P2 | P3
**Route:** /route
**Screen:** Screen name
**Category:** Layout | Colour | Typography | Functionality | Copy/i18n | Accessibility | Performance

**Description:**
What is happening vs what should happen. Reference the HTML mockup or spec section.

**Steps to reproduce:**
1. Navigate to /...
2. Observe ...

**Expected (per mockup/spec):**
Reference: docs/mockups/xxx.html or docs/SCREEN_SPECS.md section N
[exact CSS or copy from mockup]

**Actual:**
[what you see in the live app]

**Fix instructions for Cursor/Claude:**
File: src/pages/...
[copy-paste ready fix]
```

### Severity Guide
| Level | Definition | Examples |
|-------|------------|---------|
| **P0** | App broken -- crash, auth failure, data loss | JS crash on load, login fails, data not saving |
| **P1** | Major deviation -- wrong component pattern, broken flow, missing feature | Blue buttons throughout, accordion broken, state transition broken |
| **P2** | Visible design deviation -- wrong colour/shadow/spacing on element | Toggle orange instead of navy, badge colour off, soft shadow on card |
| **P3** | Polish -- animation, easing, minor alignment | Hover transition missing, 1px alignment off |

Fix order: P0 -> P1 -> P2 -> P3

---

## 8. Common Fix Patterns

### 8.1 Wrong button colour (blue instead of orange)
```tsx
// Wrong
<button className="bg-blue-600 text-white px-4 py-2 rounded">

// Correct -- primary CTA from dashboard_v4.html CSS
<button className="flex items-center gap-1.5 h-9 bg-[#FF5C1B] text-[#1F1308] border-2 border-[#0F172A] rounded-[7px] px-[13px] text-xs font-bold shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] hover:-translate-x-px hover:-translate-y-px active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px transition-all whitespace-nowrap">
```

### 8.2 Wrong card shadow (soft instead of brutalist)
```tsx
// Wrong
<div className="rounded-lg shadow-md border">

// Correct -- from dashboard_v4.html .section-card CSS
<div className="bg-white border-2 border-[#0F172A] rounded-[9px] shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] overflow-hidden">
// tailwind.config.js: boxShadow: { brutal: '2px 2px 0 0 rgba(15,23,42,0.9)' }
```

### 8.3 Hardcoded string instead of i18n
```tsx
// Wrong
<h1>Dashboard</h1>

// Correct
const { t } = useTranslation();
<h1>{t('dashboard.title')}</h1>
// Add to en.json: "title": "Dashboard" and fr.json: "title": "Tableau de bord"
```

### 8.4 Wrong filter tab active state (orange instead of navy)
```tsx
// Wrong -- orange active
className={isActive ? 'bg-[#FF5C1B] text-[#1F1308]' : ''}

// Correct -- navy active from invoices_v4.html .filter-tab.active CSS
// (All on one line when pasting into JSX -- split here for readability)
const tabClass = isActive
  ? 'bg-[#0F172A] text-white border-[#0F172A]'
  : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#0F172A] hover:text-[#0F172A]';
className={`text-xs font-semibold px-3 py-[5px] rounded-[6px] border-[1.5px] transition-all ${tabClass}`}
```

### 8.5 Settings toggle wrong colour (orange instead of navy)
```tsx
// Wrong -- orange ON (does not match settings_v2.html)
style={{ backgroundColor: isOn ? '#FF5C1B' : '#CBD5E1' }}

// Correct -- navy ON from settings_v2.html .toggle.on CSS
className={`relative w-10 h-[22px] rounded-full border-0 p-0 cursor-pointer transition-colors duration-200 ${isOn ? 'bg-[#0F172A]' : 'bg-[#CBD5E1]'}`}
```

### 8.6 Wrong status badge colours
```tsx
// Correct -- "In progress" from jobs_list_v2.html .s-progress CSS
<span className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.4px] px-[6px] py-[3px] rounded-[4px] border-[1.5px] whitespace-nowrap bg-[#F5F3FF] text-[#7C3AED] border-[#7C3AED]">
  {t('jobs.status.in_progress')}
</span>
```

### 8.7 Wrong copy tone
```
// Wrong
"Job sent!"
"Oops, something went wrong!"
"Great job! Your invoice is on its way."

// Correct per LANGUAGE_STYLE_GUIDE.md
"Status changed to Sent"
"Unable to complete this action. Please try again."
"Invoice sent to [client name]."
```

### 8.8 Toast style incorrect
```tsx
// Correct -- from dashboard_v4.html .toast CSS
<div className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-xs font-semibold px-[18px] py-[9px] rounded-lg whitespace-nowrap z-[99] pointer-events-none transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
  {message}
</div>
```

### 8.9 Sidebar/bottom nav visibility wrong
```tsx
// Bottom nav -- mobile only:
<nav className="fixed bottom-0 left-0 right-0 md:hidden ...">

// Sidebar -- desktop only:
<aside className="hidden md:flex w-[160px] flex-col flex-shrink-0 ...">
```

### 8.10 Missing accessibility attributes
```tsx
// Icon-only button -- add aria-label:
<button aria-label={t('actions.delete')}><TrashIcon className="w-4 h-4" /></button>

// Focus ring on interactive elements:
<button className="... focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,92,27,0.35)]">
```

---

## 9. Pre-Submission Verification

```bash
npm run typecheck   # 0 TypeScript errors
npm run lint        # 0 ESLint errors
npm run build       # dist/ built successfully
npm test            # all Vitest tests pass
npm run check:i18n  # EN/FR key parity -- every key in both files
```

Also verify:
- [ ] No `any` TypeScript types introduced
- [ ] No hardcoded user-facing strings (all via `t('key')`)
- [ ] Both `en.json` and `fr.json` updated for any new keys
- [ ] All interactive elements have visible text or `aria-label`
- [ ] Touch targets minimum `44x44px` on mobile
- [ ] No new UI libraries added
- [ ] `tailwind.config.js` has `boxShadow: { brutal: '2px 2px 0 0 rgba(15,23,42,0.9)' }` registered

---

*Visual ground truth: `docs/mockups/*.html` -- open each in browser side-by-side with the live app.*  
*Design tokens: `docs/DESIGN_SYSTEM.md` -- overridden by HTML mockup where they conflict.*  
*Layout spec: `docs/SCREEN_SPECS.md`.*  
*Copy/tone: `docs/LANGUAGE_STYLE_GUIDE.md`.*
