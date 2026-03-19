# TESTER_BRIEF.md — ProsDispatch QA & Audit Guide

**Version:** 1.0  
**Purpose:** Equip a Claude or Cursor checker agent with everything needed to log in, test every feature, audit design compliance, and produce a pointed, actionable bug report with fix instructions.  
**How to use:** Read all linked documents first (§1), then follow the test script (§2–§5) screen by screen, logging each finding using the issue template (§6).

---

## 1. Reference Documents — Read These First

Before touching the app, read (or have open) the following documents. They are the source of truth for **what the app should look like** and **how it should behave**.

| # | Document | Repo path | What it covers |
|---|----------|-----------|----------------|
| 1 | **MVP1 PRD** | [`docs/MVP1_PRD.md`](docs/MVP1_PRD.md) | Goals, success metrics, P0/P1 features, out-of-scope items |
| 2 | **Master PRD (extended)** | [`📘 MVP1 MASTER PRD — ProsDispatch.md`](<📘%20MVP1%20MASTER%20PRD%20—%20ProsDispatch.md>) | Full expanded product spec (emoji + special chars in filename — open via GitHub UI or `git` if CLI fails) |
| 3 | **Design System** ⭐ | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Colour tokens, shadows, typography, border radii, every component pattern (buttons, cards, badges, toggles, toasts) |
| 4 | **Screen Specs** ⭐ | [`docs/SCREEN_SPECS.md`](docs/SCREEN_SPECS.md) | Exact layout, grid columns, content order, and i18n key list for every screen |
| 5 | **Mockup Catalog** ⭐ | [`docs/MOCKUP_CATALOG.md`](docs/MOCKUP_CATALOG.md) | HTML mockup → route mapping; implementation order; per-screen callouts |
| 6 | **App Flow** | [`docs/APP_FLOW.md`](docs/APP_FLOW.md) | Navigation map, entry points, full user flows (A–C), error/edge-case states |
| 7 | **Frontend Guidelines** | [`docs/FRONTEND_GUIDELINES.md`](docs/FRONTEND_GUIDELINES.md) | Component patterns, accessibility rules, responsive/animation conventions |
| 8 | **Responsive Pattern** | [`docs/patterns/UX-Responsive-01.md`](docs/patterns/UX-Responsive-01.md) | Mobile-first mandate, breakpoints, touch-target rules, table/form adaptation |
| 9 | **CLAUDE.md** (coding rules) | [`CLAUDE.md`](CLAUDE.md) | Repository architecture, command reference, repo structure — essential for writing fix instructions |
| 10 | **AGENTS.md** (governance) | [`AGENTS.md`](AGENTS.md) | Safety-first protocol, spec compliance protocol, architecture consistency rules |

> **TL;DR priority order if you only have 20 minutes:** Read #3 (Design System), #4 (Screen Specs), #6 (App Flow), then skim #1 (PRD). The rest are reference.

---

## 2. App Architecture Quick Reference

### Routes

| Route | Auth? | Component |
|-------|-------|-----------|
| `/` | Public | `HomePage` |
| `/login` | Public | `SignInPage` |
| `/register` | Public | `SignUpPage` |
| `/forgot-password` | Public | `ForgotPasswordPage` |
| `/dashboard` | ✅ | `DashboardPage` |
| `/jobs` | ✅ | `JobsListPage` |
| `/jobs/new` | ✅ | `CreateJobPage` |
| `/jobs/:id` | ✅ | `JobDetailPage` |
| `/invoices` | ✅ | `InvoicesListPage` |
| `/invoices/:id` | ✅ | `InvoiceDetailPage` |
| `/clients` | ✅ | `ClientsListPage` |
| `/clients/new` | ✅ | `CreateClientPage` |
| `/clients/:id` | ✅ | `ClientDetailPage` |
| `/clients/:id/edit` | ✅ | `ClientEditPage` |
| `/clients/:id/properties/new` | ✅ | `CreatePropertyPage` |
| `/settings` | ✅ | `SettingsPage` |
| `/settings/billing` | ✅ | `BillingSettingsPage` |
| `/settings/stripe` | ✅ | `StripeConnectPage` |
| `/subscribe` | ✅ | `SubscribePage` |
| `/pay/:token` | Public | `PublicInvoicePage` |
| `/jobs/approve/:token` | Public | `JobApprovalPage` |

### Job Status State Machine
```
draft → sent → approved → in_progress → completed → invoiced → paid → archived
```
State transitions go through the `transition_job_state` Supabase RPC — **never mutate status directly**.

### Key Design Tokens (memorise these)
```
Primary orange:   #FF5C1B   (CTAs, active states, overdue, focus rings)
Primary ink:      #1F1308   (text/icons ON orange backgrounds)
Primary hover:    #FF7A3C   (hover accent on orange elements)
Brand navy:       #0F172A   (borders, headings, dark fills)
Success green:    #16A34A   (paid, completed, connected)
Destructive red:  #EF4444   (delete only)
Muted grey:       #94A3B8   (placeholders, captions, disabled)
Toggle inactive:  #CBD5E1   (toggle switch OFF track)
Card border:      2px solid #0F172A
Card radius:      10px
Card shadow:      2px 2px 0 0 rgba(15,23,42,0.9)  ← "brutal" shadow
Button radius:    7px
Font:             Inter
```

---

## 3. Global Design System Checklist

Before testing individual screens, verify these global rules are applied everywhere:

### 3.1 Colours
- [ ] Primary CTA buttons are `#FF5C1B` background with `#1F1308` text (primary ink — text on orange) — **not** Tailwind default blue/indigo
- [ ] No Tailwind default colours used for interactive elements (check for `bg-blue-*`, `bg-indigo-*`, `ring-blue-*`)
- [ ] Overdue indicators and "needs attention" states use **orange** `#FF5C1B`, not red
- [ ] Only delete/destroy actions use **red** `#EF4444`
- [ ] Paid/completed/connected states use **green** `#16A34A`
- [ ] Card backgrounds are `#FFFFFF`; page background is `hsl(220 20% 97%)`

### 3.2 Shadows (Brutalist)
- [ ] All cards have `box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9)` (Tailwind: `shadow-brutal`)
- [ ] Primary CTA has same shadow; on hover it should shift to 4px/4px
- [ ] **No** soft/diffuse shadows (`shadow-md`, `shadow-lg`) on cards or buttons — these must be brutalist hard shadows
- [ ] Elevated cards (profile header) use `3px 3px 0 0 rgba(15,23,42,0.9)` (Tailwind: `shadow-brutal-md`)

### 3.3 Typography
- [ ] Font is Inter throughout — no serif fonts in the app shell
- [ ] Page titles: `20px / font-bold`
- [ ] Section headings: `16px / font-bold`
- [ ] Body text: `13px / font-normal`
- [ ] Caption labels: `10–11px / font-bold / uppercase / tracking-wider` in `#94A3B8`
- [ ] **No hardcoded English or French strings** in JSX — all text via `t('key')`

### 3.4 Cards
- [ ] `border: 2px solid #0F172A`
- [ ] `border-radius: 10px`
- [ ] `box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9)`
- [ ] Internal row dividers: `border-bottom: 1px solid #F1F5F9` (very light)
- [ ] Section dividers: `border-bottom: 1px solid #E2E8F0`

### 3.5 Buttons
- [ ] **Primary:** `#FF5C1B` bg, `#1F1308` text, `2px solid #0F172A` border, `border-radius: 7px`, `height: 36–40px`, brutal shadow
- [ ] **Secondary/Outline:** `#FFFFFF` bg, `#0F172A` text/border, same radius/height/shadow
- [ ] **Inline/small actions:** `height: 30px`, `font-size: 11px`, `font-weight: 700`, `border-radius: 5–6px`, `border: 1.5px solid`
- [ ] **Danger:** `color: #EF4444`, `border: 1.5px solid #EF4444`, `bg: transparent` — hover `bg: #FEF2F2`
- [ ] Hover on primary/secondary: shadow shifts to `4px 4px`, `transform: translate(-1px, -1px)`
- [ ] Active: shadow shifts to `1px 1px`, `transform: translate(1px, 1px)`

### 3.6 Status Badges
Check every status badge against this table:

| Status | BG | Text | Border |
|--------|----|------|--------|
| Draft | `#F1F5F9` | `#475569` | `#CBD5E1` |
| Sent / Awaiting | `#FFF7ED` | `#EA580C` | `#EA580C` |
| Approved | `#EFF6FF` | `#2563EB` | `#2563EB` |
| In progress | `#F5F3FF` | `#7C3AED` | `#7C3AED` |
| Completed | `#F0FDF4` | `#16A34A` | `#16A34A` |
| Invoiced | `#FFF7ED` | `#EA580C` | `#EA580C` |
| Paid | `#F0FDF4` | `#16A34A` | `#16A34A` |
| Overdue | `#FFF1EC` | `#FF5C1B` | `#FF5C1B` |

> **Note:** "Overdue" is a **derived invoice state** (not a job state machine step). An invoice becomes overdue when its due date has passed and it is still unpaid. The job state machine (`draft → sent → … → paid`) does not include "Overdue" — check `overdue` badges only on invoice-related UI.

All badges: `font-size: 9–10px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.4px`, `border-radius: 4px`, `border: 1.5px solid`, `padding: 3px 6–8px`.

### 3.7 Inputs
- [ ] Height `44px` standard, `36px` compact (settings)
- [ ] Border: `2px solid #0F172A` (standard), `1.5px solid #CBD5E1` (compact)
- [ ] Border-radius: `10px` (standard), `7px` (compact/settings)
- [ ] Focus ring: `border-color: #FF5C1B` + `box-shadow: 0 0 0 3px rgba(255,92,27,0.15)`
- [ ] Placeholder colour: `#94A3B8`
- [ ] Search inputs: `padding-left: 30px` with icon at `left: 10px`

### 3.8 Navigation
- [ ] **Sidebar** (desktop): 160px wide, `border-right: 1.5px solid #0F172A`, active item has `border-left: 3px solid #FF5C1B`
- [ ] **Bottom nav** (mobile): should be fixed at bottom, hidden on desktop
- [ ] **Topbar**: `height: 52px`, `border-bottom: 1.5px solid #0F172A`, white background
- [ ] Logo: "ProsDispatch" or "Dispatch | Labs" — both words `700` weight, `14px`, `#0F172A`

### 3.9 Accessibility
- [ ] All icon-only buttons have `aria-label`
- [ ] Toggle switches have `role="switch"` and `aria-checked`
- [ ] Minimum touch targets: `44×44px` on mobile
- [ ] Focus rings visible: `box-shadow: 0 0 0 3px rgba(255,92,27,0.35)` on `:focus-visible`
- [ ] Language switcher present on all public pages and in the app header

### 3.10 i18n
- [ ] Language switcher works — switching to FR renders French text in the UI
- [ ] No raw English strings are visible in the French view
- [ ] Both `en.json` and `fr.json` keys exist for all visible text

---

## 4. Screen-by-Screen Test Script

For each screen: navigate to the route, test every listed behaviour, and log any deviation using the Issue Template in §6.

---

### Screen 1: Home Page (`/`)

**Expected:** Marketing/landing page. Public, no sidebar. Shows brand, value prop, CTA to sign up or log in.

- [ ] Page loads without errors (no blank screen, no JS console errors)
- [ ] Has a "Get Started" or "Sign In" CTA
- [ ] Language switcher visible
- [ ] Fully responsive — no horizontal scroll on 375px viewport

---

### Screen 2: Sign In (`/login`)

**Expected layout** (per `SCREEN_SPECS.md §1` and `MOCKUP_CATALOG.md §1`):
- Public topbar (bg: `hsl(220 20% 97%)`, border `1px #CBD5E1`)
- Single card centered: `max-width: 420px`, `border: 2px solid #0F172A`, `border-radius: 14px`, `box-shadow: 4px 4px 0 0 rgba(15,23,42,0.9)`, `padding: 40px`

**Test checklist:**
- [ ] Orange label at top: "Contractor access" (`11px`, `#FF5C1B`, uppercase)
- [ ] Title: "Sign in to Dispatch" (`24px`, `700`)
- [ ] Email and Password fields present with correct labels (uppercase `11px 700`)
- [ ] "Forgot password?" link right-aligned, navigates to `/forgot-password`
- [ ] "Sign in" CTA button: full-width, `48px` height, orange `#FF5C1B`
- [ ] Divider "no account yet?" present
- [ ] "Create your contractor account →" link navigates to `/register`
- [ ] Valid credentials log in and redirect to `/dashboard`
- [ ] Invalid credentials show an error message (not a console error)
- [ ] Form validates empty submission (both fields required)
- [ ] Card has correct brutalist shadow (`4px 4px 0 0 rgba(15,23,42,0.9)`)

**Fix instructions for Cursor/Claude (if deviations found):**
```
File: src/pages/auth/SignInPage.tsx
Reference: docs/SCREEN_SPECS.md §1, docs/DESIGN_SYSTEM.md §3.1–3.2

NOTE: All className values below are split across lines for readability.
      When pasting into JSX, join into a single string (remove line breaks).

- Replace any blue/indigo Tailwind classes on the sign-in button with:
  className="w-full h-12 bg-[#FF5C1B] text-[#1F1308] border-2 border-[#0F172A] rounded-[7px] font-bold text-sm shadow-brutal hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] hover:-translate-x-px hover:-translate-y-px active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px transition-all"

- Card wrapper should be:
  className="bg-white border-2 border-[#0F172A] rounded-[14px] shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] p-10 w-full max-w-[420px]"

- Orange label:
  className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#FF5C1B]"
```

---

### Screen 3: Register (`/register`)

**Expected layout** (per `SCREEN_SPECS.md §2`):
- Same public topbar as login
- Single card: `max-width: 460px`

**Test checklist:**
- [ ] Orange label: "New contractor account"
- [ ] Title: "Create your account"
- [ ] Two-column row: First name | Last name (both required — asterisk in `#FF5C1B`)
- [ ] Business name field (optional, no asterisk)
- [ ] Trade dropdown: Plumbing, HVAC, Electrical, General contractor, Roofing, Other
- [ ] Selecting "Other" reveals a text input with smooth animation (max-height 0→60px)
- [ ] "Other" text input has orange border and auto-focuses on reveal
- [ ] Divider "Account credentials"
- [ ] Email field (required)
- [ ] Two-column: Password | Confirm password
- [ ] "Create account" CTA full-width 48px orange
- [ ] Terms text at bottom with links
- [ ] "Already have an account? Sign in →" link navigates to `/login`
- [ ] Form submission with valid data creates account and redirects to `/dashboard`
- [ ] Password mismatch shows error
- [ ] Weak/invalid email shows error

---

### Screen 4: Forgot Password (`/forgot-password`)

**Expected:** Two-state card (default → success after submit).

- [ ] "← Back to sign in" link at top navigates to `/login`
- [ ] Lock icon in bordered box (`2px navy border, border-radius: 10px`)
- [ ] Orange label "Password reset"
- [ ] Title "Forgot your password?"
- [ ] Email field + "Send reset link" full-width CTA
- [ ] After submit: success state shows green checkmark icon, "Check your email" title, email address in **bold** in body text
- [ ] "Back to sign in" outline button in success state
- [ ] "Didn't receive it? Send again" link returns to default state
- [ ] Green success icon box: `border: #16A34A`, `bg: #F0FDF4`, `box-shadow: 2px 2px 0 0 rgba(22,101,52,0.9)`

---

### Screen 5: Dashboard (`/dashboard`)

**Expected layout** (per `SCREEN_SPECS.md §4` and `MOCKUP_CATALOG.md §3`):
- Authenticated shell: topbar + left sidebar
- Page header with greeting + date + action buttons
- 4-card stats grid
- Two-column: Recent jobs (left) | Right column (Overdue invoices + Upcoming)

**Test checklist:**
- [ ] Greeting: "Good morning, [first_name]." (`19px`, `700`) — name comes from profile
- [ ] Current date shown below greeting (`12px`, muted `#64748B`)
- [ ] "New client" secondary button (white bg) present top-right
- [ ] "New job" primary button (orange) present top-right
- [ ] Stats grid: 4 cards — "Need attention", "Overdue invoices", "Revenue (month)", "Total clients"
  - [ ] "Need attention" card uses orange border/shadow variant
  - [ ] Success (revenue) card uses green border/shadow variant (`2px 2px 0 0 rgba(22,101,52,0.9)`)
- [ ] **Alert banner** (only if overdue invoices exist): orange border `1.5px solid #FF5C1B`, white background, orange dot, no exclamation marks, "View invoices →" link
- [ ] Recent jobs card on left shows address + status chip + description + client + date
- [ ] Status chips in recent jobs use correct colours per §3.6
- [ ] Right column: Overdue invoices card + Upcoming card
- [ ] Sidebar navigation: Dashboard, Jobs, Clients, Invoices, Settings links
- [ ] Active sidebar item: `border-left: 3px solid #FF5C1B`, `font-weight: 700`, `color: #0F172A`
- [ ] Bottom nav visible on mobile (375px viewport), hidden on desktop
- [ ] Sidebar visible on desktop, hidden on mobile

**Fix instructions for Cursor/Claude:**
```
File: src/pages/DashboardPage.tsx, src/components/Layout/Sidebar.tsx
Reference: docs/SCREEN_SPECS.md §4, docs/DESIGN_SYSTEM.md §3.7, §3.8

Stats card "needs attention" variant:
  className="... border-[#FF5C1B] shadow-[2px_2px_0_0_rgba(255,92,27,0.35)]"

Stats card "success" variant:
  className="... border-[#16A34A] shadow-brutal-success"

Alert banner:
  className="flex items-center gap-[10px] bg-white border-[1.5px] border-[#FF5C1B] 
             rounded-lg px-[14px] py-[10px] shadow-[2px_2px_0_0_rgba(255,92,27,0.3)]"

Sidebar active item:
  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#0F172A] 
             border-l-[3px] border-[#FF5C1B] bg-[hsl(220_20%_97%)]"
```

---

### Screen 6: Jobs List (`/jobs`)

**Expected layout** (per `SCREEN_SPECS.md §5` and `MOCKUP_CATALOG.md §4`):
- Header: "Jobs" title + search input (200px, icon left) + "New job" primary button
- Filter tabs: Active | Draft | Awaiting approval | Completed | All
- Table with grid: `110px 2fr 1.5fr 80px 36px` (Status | Job | Client | Date | Chevron)
- Accordion rows

**Test checklist:**
- [ ] Page title "Jobs" in `19px 700`
- [ ] Search input has icon at left (`padding-left: 30px`)
- [ ] Filter tabs visible: Active (default), Draft, Awaiting approval, Completed, All
- [ ] Table column headers: Status | Job | Client | Date (all left-aligned)
- [ ] Each row has: status badge | job address/title | client name | date | chevron
- [ ] Dates within 3 days shown in `#FF5C1B font-bold`
- [ ] Clicking a row expands it (only one open at a time)
- [ ] Chevron rotates 180° and turns `#FF5C1B` when row is open
- [ ] Expanded detail shows: Address | Client | Service date | Description | Job ID
- [ ] **Context-sensitive actions** in expanded row by status:
  - Draft → "Send for approval" (primary orange)
  - Approved → "Start job" (primary orange)
  - In progress → "Mark completed" (primary orange)
  - Completed → "Create invoice" (orange outline)
  - Every status → "Edit job" (navy outline)
- [ ] Search filters list in real-time (no page reload)
- [ ] Empty state shows "No jobs match this filter."
- [ ] Status chips are tappable (if MVP1 advances status): show `↻` suffix, hover lifts chip
- [ ] "New job" button navigates to `/jobs/new`
- [ ] Clicking "Edit job" navigates to job edit/detail page

**Fix instructions for Cursor/Claude:**
```
File: src/pages/jobs/JobsListPage.tsx, src/components/jobs/JobRow.tsx (or similar)
Reference: docs/DESIGN_SYSTEM.md §3.4, §3.6, docs/SCREEN_SPECS.md §5

Table grid (required — do not use flex or non-grid layout):
  className="grid gap-0"
  style={{ gridTemplateColumns: '110px 2fr 1.5fr 80px 36px' }}

Status badge for "In progress":
  className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.4px] 
             px-2 py-[3px] rounded-[4px] border-[1.5px] whitespace-nowrap 
             bg-[#F5F3FF] text-[#7C3AED] border-[#7C3AED]"

Accordion chevron (open state):
  className="rotate-180 text-[#FF5C1B] transition-transform duration-200"
```

---

### Screen 7: Create Job (`/jobs/new`)

**Test checklist:**
- [ ] Form loads without errors
- [ ] Can select an existing client from dropdown OR add new client inline
- [ ] Property selection linked to chosen client
- [ ] Service date picker works
- [ ] Description field present
- [ ] "Save as draft" or "Create job" CTA submits and navigates to job detail/list
- [ ] Required field validation fires before submit
- [ ] Navigates to job detail after successful creation
- [ ] Draft job appears in Jobs list with "Draft" badge

---

### Screen 8: Job Detail (`/jobs/:id`)

**Test checklist:**
- [ ] Job title, status badge, client, property, date all display correctly
- [ ] Status badge colours match §3.6 table
- [ ] Action buttons appropriate for current status (per state machine):
  - Draft: "Send for approval" button
  - Sent/Awaiting: read-only, edit only
  - Approved: "Start job" button
  - In progress: "Mark completed" button
  - Completed: "Create invoice" button
- [ ] "Edit" button present for draft jobs (locked fields for sent/approved)
- [ ] Toast notification appears on status change: "Status → [new status]"
- [ ] Line items / job description visible
- [ ] Breadcrumb or back navigation present

---

### Screen 9: Clients List (`/clients`)

**Expected layout** (per `SCREEN_SPECS.md §6`):
- Table grid: `2fr 1.5fr 100px 60px 36px` (Client | Address | Last job | Jobs count | Chevron)

**Test checklist:**
- [ ] Page title "Clients" `19px 700`
- [ ] Search input + "New client" primary button
- [ ] Stats strip: Total clients | Active this month (green value) | New this month
- [ ] Avatar colour rotation (index mod 5 — orange, blue, green, purple, amber)
- [ ] Client name `13px 700`, email `10px muted` stacked
- [ ] "Last job" date: this month = `#16A34A font-600`, older = `#64748B`
- [ ] Accordion row expands: Phone (orange link) | Address | Client since
- [ ] Expanded row actions: "New job" primary + "View profile" navy outline
- [ ] "New client" navigates to `/clients/new`
- [ ] Search filters in real-time

---

### Screen 10: Client Detail (`/clients/:id`)

**Expected layout** (per `SCREEN_SPECS.md §7` and `MOCKUP_CATALOG.md §5`):

**Test checklist:**
- [ ] Breadcrumb: "← Clients / [Client name]"
- [ ] Profile header card: `border: 2px solid #0F172A`, `border-radius: 10px`, `box-shadow: 3px 3px 0 0 rgba(15,23,42,0.9)`, `padding: 20px 22px`
- [ ] 48px avatar (orange bg by default), name `19px 700`, address + phone link + email link
- [ ] "New job" primary + "Edit" outline buttons top-right of card
- [ ] Secondary meta strip with dividers: Language | Source | Client since | Property count
- [ ] KPI strip: 4 cards — Total jobs | Revenue (green value) | Last service | Outstanding
  - Outstanding card: orange text/border if overdue balance
- [ ] Unified history card with sticky header (Jobs | Invoices tabs)
- [ ] Active tab has `border-bottom: 2.5px solid #FF5C1B`
- [ ] Property filter select only visible on Jobs tab
- [ ] Scroll area `max-height: 400px; overflow-y: auto`
- [ ] Jobs tab grid: `2fr 80px 90px` (Address+desc | Date | Status badge)
- [ ] Invoices tab grid: `70px 1fr 90px 90px` (INV-### | Description | Amount | Status)
- [ ] Overdue invoice amount: `#FF5C1B`; Paid: `#16A34A`; Default: `#0F172A`

---

### Screen 11: Invoices List (`/invoices`)

**Expected layout** (per `SCREEN_SPECS.md §8` and `MOCKUP_CATALOG.md §6`):
- Table grid: `56px 2fr 66px 74px 78px 90px` (Invoice# | Client | Amount | Date | Status | Actions)

**Test checklist:**
- [ ] Page title "Invoices" `19px 700`
- [ ] "New invoice" primary button top-right
- [ ] Summary strip: 4 cards — Overdue (orange) | Awaiting payment (orange) | Paid/month (green) | Total/month (default)
- [ ] Filter tabs: All | Overdue | Sent | Paid | Draft (Overdue tab has orange count badge)
- [ ] Table column headers all left-aligned
- [ ] Invoice number column: `INV-XXXX` format, `56px` wide
- [ ] Client column: name `12px 700` + address `10px muted` stacked
- [ ] Overdue date column: `#FF5C1B font-bold` + ` · Nd` days suffix
- [ ] **Row actions by status:**
  - Overdue → "Resend" button (`orange border`)
  - Sent → "Mark paid" button (`green border`)
  - Draft → "Send" button (becomes "Resend" after click — no page reload)
  - Paid → no actions
- [ ] Clicking any row navigates to invoice detail (actions use `stopPropagation`)
- [ ] **Mark paid → Undo flow:**
  - Clicking "Mark paid" → status badge flips to Paid immediately
  - "Undo" button appears and auto-hides after 8 seconds
  - Clicking Undo reverts badge, actions, and data
  - Toast: `"Marked as paid · [Client name]"` on mark paid
  - Toast: `"Undone — [Client name] back to [previous status]"` on undo
- [ ] **Send → Resend flow (Draft):**
  - Click "Send" → status flips to Sent, button label changes to "Resend" immediately
  - Subsequent "Resend" clicks show reminder toast only, no state change
- [ ] **Overdue Resend:**
  - Click "Resend" → toast `"Reminder sent to [Client name]"`, no status change

**Fix instructions for Cursor/Claude:**
```
File: src/pages/invoices/InvoicesListPage.tsx
Reference: docs/DESIGN_SYSTEM.md §4.2–4.4, docs/SCREEN_SPECS.md §8

Grid (mandatory — do not deviate):
  style={{ gridTemplateColumns: '56px 2fr 66px 74px 78px 90px' }}

Mark paid → Undo (8-second timer):
  // invoices is your list state; prevStatus is passed from the row component
  const handleMarkPaid = async (invoiceId: string, clientName: string, prevStatus: string) => {
    await updateInvoiceStatus(invoiceId, 'paid');
    showToast(`Marked as paid · ${clientName}`);
    setUndoVisible(invoiceId);
    setUndoPrevStatus(prevStatus);
    undoTimer.current = setTimeout(() => setUndoVisible(null), 8000);
  };
  const handleUndo = async (invoiceId: string, clientName: string, prevStatus: string) => {
    clearTimeout(undoTimer.current);
    await updateInvoiceStatus(invoiceId, prevStatus);
    setUndoVisible(null);
    showToast(`Undone — ${clientName} back to ${prevStatus}`);
  };

Toast styling (DESIGN_SYSTEM §4.7):
  className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white 
             text-xs font-semibold px-[18px] py-[9px] rounded-lg whitespace-nowrap 
             z-[99] pointer-events-none transition-opacity duration-200"
  (appears for 2.5s then fades — use opacity animation, not display toggle)
```

---

### Screen 12: Invoice Detail (`/invoices/:id`)

**Test checklist:**
- [ ] Invoice number, date, client name, property address visible
- [ ] Line items table with descriptions, quantities, unit prices, subtotals
- [ ] Tax breakdown (GST/HST/QST as applicable) displayed
- [ ] Total amount prominently shown
- [ ] Status badge correct colour
- [ ] Action buttons appropriate to status (Send, Mark paid, etc.)
- [ ] "Pay Now" link/button present for invoices in "sent" state (links to `/pay/:token`)
- [ ] Back navigation to invoices list

---

### Screen 13: Settings (`/settings`)

**Expected layout** (per `SCREEN_SPECS.md §9` and `MOCKUP_CATALOG.md §7`):
- Single scrollable page with section cards

**Test checklist:**
- [ ] Sections present: Profile | Language | Notifications | Billing & subscription | Stripe Connect | Password & security | Danger zone
- [ ] **Profile section** field rows: `grid-template-columns: 160px 1fr auto`, `padding: 13px 18px`, `border-bottom: 1px solid #F1F5F9`
- [ ] Business name, trade, email, address fields editable
- [ ] "Save changes" button present and functional
- [ ] **Language section:** EN/FR toggle works — UI switches language on selection
- [ ] **Notifications section** — 4 toggle rows:
  - Job approvals: default ON
  - Invoice paid: default ON
  - Overdue reminders: default ON
  - Marketing emails: default OFF
  - [ ] Toggle track: ON = `#FF5C1B`, OFF = `#CBD5E1` (inline styles, not CSS classes)
  - [ ] Knob: ON at `left: 23px`, OFF at `left: 3px` (inline styles)
  - [ ] Description text: ON = `#374151`, OFF = `#94A3B8`
  - [ ] Toggle has `role="switch"` and `aria-checked`
  - [ ] Toggle dimensions: `44px × 24px`, knob `18px × 18px`
- [ ] **Password & security rows** (flex space-between):
  - "Change" button: `height: 30px`, `border: 1.5px solid #FF5C1B`, `color: #FF5C1B`, `border-radius: 5px`
  - "Reset" button identical size to "Change"
- [ ] **Danger zone:**
  - Section label in `#EF4444`
  - Card: `border: 2px solid #EF4444`, `box-shadow: 2px 2px 0 0 rgba(239,68,68,0.3)`
  - "Delete account" button: red outline style
  - Clicking prompts confirmation before executing

**Fix instructions for Cursor/Claude:**
```
File: src/pages/SettingsPage.tsx
Reference: docs/DESIGN_SYSTEM.md §3.5, §3.8 (toggle), docs/SCREEN_SPECS.md §9

Toggle — MUST use inline styles (not className):
  const isOn = notificationSettings[key];
  <button
    role="switch"
    aria-checked={isOn}
    onClick={() => toggleNotification(key)}
    style={{
      width: '44px', height: '24px',
      borderRadius: '999px', border: 'none', padding: 0,
      cursor: 'pointer', position: 'relative',
      backgroundColor: isOn ? '#FF5C1B' : '#CBD5E1',
      transition: 'background 0.2s',
    }}
  >
    <div style={{
      position: 'absolute', top: '3px',
      left: isOn ? '23px' : '3px',
      width: '18px', height: '18px',
      background: '#fff', borderRadius: '50%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      transition: 'left 0.2s',
    }} />
  </button>

Danger zone card:
  className="border-2 border-[#EF4444] rounded-[10px] shadow-[2px_2px_0_0_rgba(239,68,68,0.3)]"

Danger zone section label:
  className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444] mb-1"
```

---

### Screen 14: Public Job Approval (`/jobs/approve/:token`)

**Test checklist:**
- [ ] Page loads without auth required
- [ ] Shows job summary: contractor name, job description, property address, service date, line items
- [ ] "Approve" button (green or primary)
- [ ] "Decline" button
- [ ] Clicking Approve: shows success confirmation, job status transitions to `approved`
- [ ] Expired/invalid token: shows "This link has expired. Please contact the contractor."
- [ ] Language switcher present

---

### Screen 15: Public Invoice Payment (`/pay/:token`)

**Test checklist:**
- [ ] Page loads without auth required
- [ ] Shows invoice summary: business name, invoice number, line items, tax breakdown, total
- [ ] "Pay Now" button present and triggers Stripe Checkout
- [ ] Paid invoice shows success state (not "Pay Now")
- [ ] Invalid/expired token shows error message
- [ ] Language switcher present

---

## 5. User Flow End-to-End Tests

Run these as complete journeys, not just individual screens.

### Flow 1: New Contractor Onboarding
1. Visit `/register`
2. Fill out all required fields (first name, last name, trade, email, password)
3. Submit → should reach `/dashboard` or a profile completion step
4. Profile shows correct business name in sidebar/topbar

**Pass criteria:** Account created, user logged in, dashboard loads with empty state, no JS errors.

### Flow 2: Full Job Lifecycle (Happy Path)
1. From Dashboard, click "New job" → `/jobs/new`
2. Select or create a client, select/add a property, set a service date, add description
3. Save → job appears in Jobs list with "Draft" badge
4. Open job, click "Send for approval" → status becomes "Sent/Awaiting"
5. *(If approval email not testable in UI)* Manually advance to "Approved" via job detail
6. Click "Start job" → status becomes "In progress"
7. Click "Mark completed" → status becomes "Completed"
8. Click "Create invoice" → navigates to invoice creation
9. Invoice created → job status becomes "Invoiced", invoice appears in `/invoices`
10. Mark invoice as paid → invoice status "Paid", undo button appears for 8 seconds

**Pass criteria:** Each status transition renders correct badge colour, correct action buttons, and correct toast. State machine enforced (cannot skip steps).

### Flow 3: Client Management
1. Visit `/clients/new`
2. Create a client with name, email, phone, address
3. Client appears in `/clients` list
4. Click client → `/clients/:id` shows profile card, KPI strip, empty history
5. Create a job from client detail ("New job" button) — job links to this client
6. Return to client detail — job appears in Jobs tab of history card
7. Edit client (`/clients/:id/edit`) — changes persist after save

**Pass criteria:** All CRUD operations work, client detail shows correct counts and history.

### Flow 4: Invoice Workflow
1. Visit `/invoices`
2. Check summary strip shows correct counts
3. Filter tabs filter the list correctly
4. Mark a "Sent" invoice as paid → undo flow works (8 second timer)
5. "Send" a draft invoice → button becomes "Resend"
6. Click "Resend" on overdue invoice → toast shows "Reminder sent to..."

**Pass criteria:** All four interaction patterns (§4.2–4.5 of Design System) work correctly.

### Flow 5: Settings & Language
1. Visit `/settings`
2. Toggle language to FR → UI renders in French
3. Toggle back to EN → UI renders in English
4. Toggle a notification setting off and on — inline styles apply correctly
5. Update profile business name → save → refresh page → name persists

---

## 6. Issue Log Template

Use this template for every bug found. Be specific — vague entries like "button looks wrong" are not actionable.

```markdown
### [ISSUE-###] <Short title>

**Severity:** P0 (broken/crash) | P1 (major visual/functional deviation) | P2 (minor visual) | P3 (polish/nice-to-have)
**Route:** /the/affected/route
**Screen:** Screen name (e.g. "Jobs List")
**Category:** Layout | Colour | Typography | Functionality | i18n | Accessibility | Performance

**Description:**
What is happening vs. what should happen. Be specific.
Example: "The 'Mark paid' button has a blue background (Tailwind `bg-blue-500`) instead of a green border per DESIGN_SYSTEM §3.1 — 'Sent → Mark paid button: green border'"

**Steps to reproduce:**
1. Navigate to /invoices
2. Find an invoice with status "Sent"
3. Observe the "Mark paid" action button

**Expected (per spec):**
"Mark paid" button: white background, green (#16A34A) border and text, 30px height, 1.5px border

**Actual:**
Blue background, white text — not matching spec

**Reference:**
- docs/SCREEN_SPECS.md §8 (Invoices, "Actions by status")
- docs/DESIGN_SYSTEM.md §4.2 (Mark Paid interaction)

**Fix instructions for Cursor/Claude:**
File: src/pages/invoices/InvoicesListPage.tsx (or src/components/invoices/InvoiceRow.tsx)

Replace the "Mark paid" button className with:
  className="h-[30px] px-3 text-[11px] font-bold border-[1.5px] border-[#16A34A] text-[#16A34A] 
             bg-transparent rounded-[5px] hover:bg-[#F0FDF4] transition-colors"
```

---

## 7. Common Fix Patterns Reference

These cover the most frequently encountered issues in the codebase. Apply as needed.

### 7.1 Wrong button colour (blue instead of orange)
```tsx
// ❌ Wrong — default Tailwind blue
<button className="bg-blue-600 text-white px-4 py-2 rounded">

// ✅ Correct — ProsDispatch primary CTA
<button className="h-10 px-[13px] bg-[#FF5C1B] text-[#1F1308] border-2 border-[#0F172A] 
                   rounded-[7px] text-[13px] font-bold shadow-brutal 
                   hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] hover:-translate-x-px hover:-translate-y-px 
                   active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px 
                   transition-all">
```

### 7.2 Wrong card shadow (soft instead of brutalist)
```tsx
// ❌ Wrong — soft shadow
<div className="rounded-lg shadow-md border">

// ✅ Correct — brutalist card
<div className="bg-white border-2 border-[#0F172A] rounded-[10px] shadow-brutal overflow-hidden">
// Make sure tailwind.config.js has: boxShadow: { brutal: '2px 2px 0 0 rgba(15,23,42,0.9)' }
```

### 7.3 Hardcoded string instead of i18n
```tsx
// ❌ Wrong
<h1>Dashboard</h1>

// ✅ Correct
const { t } = useTranslation();
<h1>{t('dashboard.title')}</h1>
// Also add "title": "Dashboard" to en.json and "title": "Tableau de bord" to fr.json
```

### 7.4 Missing focus ring
```tsx
// ❌ Wrong — no accessible focus state
<button className="bg-[#FF5C1B] ...">

// ✅ Correct — include focus-visible ring
<button className="bg-[#FF5C1B] ... focus-visible:outline-none 
                   focus-visible:shadow-[0_0_0_3px_rgba(255,92,27,0.35)]">
```

### 7.5 Icon-only button missing aria-label
```tsx
// ❌ Wrong
<button><TrashIcon className="w-4 h-4" /></button>

// ✅ Correct
<button aria-label={t('actions.delete')}><TrashIcon className="w-4 h-4" /></button>
```

### 7.6 Wrong status badge colours
```tsx
// For "In progress" status:
// ❌ Wrong
<span className="bg-yellow-100 text-yellow-700">In progress</span>

// ✅ Correct
<span className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.4px] 
                 px-2 py-[3px] rounded-[4px] border-[1.5px] whitespace-nowrap 
                 bg-[#F5F3FF] text-[#7C3AED] border-[#7C3AED]">
  {t('jobs.status.in_progress')}
</span>
```

### 7.7 Toast not using correct style
```tsx
// Standard toast (DESIGN_SYSTEM §4.7):
// - Fixed, bottom-20, centered, bg #0F172A, text white
// - 12px font, 600 weight, 9px 18px padding, border-radius 8px
// - Appears for 2.5s then fades (opacity transition, not display toggle)
// - z-index 99, pointer-events none

const showToast = (message: string) => {
  setToastMsg(message);
  setToastVisible(true);
  setTimeout(() => setToastVisible(false), 2500);
};

// JSX:
<div
  className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white 
              text-xs font-semibold px-[18px] py-[9px] rounded-lg whitespace-nowrap 
              z-[99] pointer-events-none transition-opacity duration-200 
              ${toastVisible ? 'opacity-100' : 'opacity-0'}`}
>
  {toastMsg}
</div>
```

### 7.8 Bottom nav not hiding on desktop / sidebar not hiding on mobile
```tsx
// Bottom nav — hide on md+ breakpoint:
<nav className="fixed bottom-0 left-0 right-0 md:hidden ...">

// Sidebar — hide on mobile, show md+:
<aside className="hidden md:flex w-[160px] ...">
```

---

## 8. Severity Guide

| Level | Definition | Examples |
|-------|------------|---------|
| **P0** | App is broken or unusable — crashes, auth failures, data loss | JS crash on page load, login fails, data not saving |
| **P1** | Major deviation from spec — wrong component pattern, broken flow, missing required feature | Wrong button colours throughout, accordion not working, status transition broken |
| **P2** | Visible design deviation — wrong spacing/colours/typography on specific element | Badge colour slightly off, shadow missing on one card, font weight wrong |
| **P3** | Polish issue — minor inconsistency or nice-to-have | Hover animation missing, transition easing wrong, minor alignment |

**Fix in this order: P0 → P1 → P2 → P3.**

---

## 9. Before You Finish — Verification Checklist

After completing all fixes, run:

```bash
npm run typecheck   # Must pass with 0 errors
npm run lint        # Must pass with 0 errors
npm run build       # Must complete successfully
npm test            # Vitest unit tests — must pass
npm run check:i18n  # EN/FR parity — must pass
```

Also verify:
- [ ] No `any` TypeScript types introduced
- [ ] No hardcoded strings added (all via `t()`)
- [ ] No inline styles except toggle switches (per Design System §3.5)
- [ ] No new UI libraries added
- [ ] Both `en.json` and `fr.json` updated for any new i18n keys
- [ ] All new interactive elements have `aria-label` or visible text label
- [ ] Touch targets minimum 44×44px on mobile

---

*Reference: All spec documents live in `docs/`. The source of truth for visual design is `docs/DESIGN_SYSTEM.md`. The source of truth for screen layouts is `docs/SCREEN_SPECS.md`. The source of truth for app behaviour is `docs/APP_FLOW.md` and `docs/MVP1_PRD.md`.*
