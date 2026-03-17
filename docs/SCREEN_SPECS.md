# SCREEN_SPECS.md — ProsDispatch Screen Layout Specifications
**Version:** 1.0 — Approved  
**Owner:** Design (Seb Mosto)  
**Companion doc:** `docs/DESIGN_SYSTEM.md` — load that first before implementing any screen.

---

## How to use this document

Each section covers one screen. When Cursor is assigned a screen task:
1. Load `DESIGN_SYSTEM.md` for tokens and components.
2. Load only the relevant section(s) from this document.
3. Do not touch screens not covered by the current task.

---

## Screen Index

1. Login
2. Register
3. Forgot Password
4. Dashboard
5. Jobs List
6. Client List
7. Client Detail
8. Invoices
9. Settings

---

## 1. Login

**Route:** `/login`  
**Shell:** Public (no sidebar)

### Layout
- Full-page background: `hsl(220 20% 97%)`
- Public topbar (see DESIGN_SYSTEM §3.8 — public variant)
- Single card centered vertically and horizontally: `max-width: 420px`

### Topbar contents (left to right)
- Hammer logo icon + "Dispatch | Labs" wordmark
- Language pill (FR toggle with translate icon)
- Moon icon (dark mode toggle)
- Separator (1px, #CBD5E1)
- "Pilot Program" text link (muted, 13px)
- "Login" bold text link (navy, 13px, 700)

### Card contents (top to bottom)
1. Orange uppercase label: "Contractor access" (11px, #FF5C1B, letter-spacing 1.2px)
2. Title: "Sign in to Dispatch" (24px, 700)
3. Subtitle: "Manage your jobs, clients, and payments." (14px, muted)
4. Email field (label: "EMAIL" — uppercase, 11px, 700)
5. Password field (label: "PASSWORD")
6. "Forgot password?" — right-aligned, 12px, muted, hover orange
7. Primary CTA button: "Sign in" — full width, 48px height
8. Divider with text: "no account yet?"
9. Register link: "Create your contractor account →" — centered, orange, 700

### Card styling
```
background: #fff
border: 2px solid #0F172A
border-radius: 14px
box-shadow: 4px 4px 0 0 rgba(15,23,42,0.9)
padding: 40px
```

### i18n keys required
`login.label`, `login.title`, `login.subtitle`, `login.email`, `login.password`,
`login.forgot`, `login.cta`, `login.divider`, `login.register`

---

## 2. Register

**Route:** `/register`  
**Shell:** Public (no sidebar)

### Layout
- Same topbar as Login
- Single card centered: `max-width: 460px`

### Card contents (top to bottom)
1. Orange label: "New contractor account"
2. Title: "Create your account"
3. Subtitle: "Get set up in minutes. No training required."
4. Required field note: `* Required field` (11px, muted — asterisk in #FF5C1B)
5. Two-column row: First name * | Last name *
6. Business name (optional — no asterisk)
7. Trade dropdown * — options: Plumbing, HVAC, Electrical, General contractor, Roofing, Other
8. Other behaviour: selecting "Other" reveals a text input below with smooth expand animation (max-height 0 to 60px, opacity 0 to 1, transition 0.2s ease). Input has orange border (#FF5C1B) and focus ring. Auto-focuses on reveal.
9. Divider: "Account credentials"
10. Email *
11. Two-column row: Password | Confirm
12. Primary CTA: "Create account" — full width, 48px
13. Terms text (11px, muted) with links to Terms of Service and Privacy Policy
14. Sign in link: "Already have an account? Sign in →"

### Required field asterisks
First name, Last name, Trade, Email — asterisk in #FF5C1B appended after label text.

### i18n keys required
`register.label`, `register.title`, `register.subtitle`, `register.required_note`,
`register.first`, `register.last`, `register.biz`, `register.trade`, `register.trade_other`,
`register.email`, `register.password`, `register.confirm`, `register.cta`,
`register.terms`, `register.signin`

---

## 3. Forgot Password

**Route:** `/forgot-password`  
**Shell:** Public (no sidebar)

### Two states — same card, JS controls visibility

#### Default state
1. Back link: "← Back to sign in" (12px, muted, hover navy)
2. Lock icon in a bordered box (22px SVG, 2px navy border, border-radius 10px)
3. Orange label: "Password reset"
4. Title: "Forgot your password?"
5. Subtitle: "Enter the email address linked to your account. We'll send you a link to reset your password."
6. Email field
7. Primary CTA: "Send reset link" — full width, 48px

#### Success state (after submit)
1. Green checkmark icon box (border: #16A34A, background: #F0FDF4, shadow: 2px 2px 0 0 rgba(22,101,52,0.9))
2. Title: "Check your email"
3. Body: "If an account exists for [email entered], a reset link has been sent. Check your inbox and spam folder." — email address rendered in bold
4. Outline CTA: "Back to sign in" — full width, navy border
5. Resend link: "Didn't receive it? Send again" — clicking returns to default state

### i18n keys required
`forgot.label`, `forgot.title`, `forgot.subtitle`, `forgot.email`, `forgot.cta`,
`forgot.success_title`, `forgot.success_body`, `forgot.back`, `forgot.resend`

---

## 4. Dashboard

**Route:** `/dashboard`  
**Shell:** Authenticated (topbar + left sidebar)

### Page header
- Left: "Good morning, [first_name]." (19px, 700) + current date below (12px, muted)
- Right: "New client" secondary button + "New job" primary button

### Calm alert banner
Only renders when overdue invoices exist. Orange border, white background. See DESIGN_SYSTEM §4.8.
Copy pattern: "[N] overdue invoices — $[amount] outstanding. Last sent [N] days ago."
Action link: "View invoices →"

### KPI stat cards — 4-column grid, gap 10px
| Label | Content | Variant |
|---|---|---|
| Need attention | Count of jobs needing action | Orange border + shadow |
| Overdue invoices | Count + total $ | Orange border + shadow |
| Revenue (current month) | Total paid this month | Green border + shadow |
| Total clients | Count | Default |

### Two-column layout
Left column (flex: 1): Recent Jobs card
Right column (280px): Overdue Invoices card + Upcoming card, stacked, gap 14px

### Recent Jobs card
Address-first row layout:
- Top line: address (13px, 700) inline with status chip (9px, 700, tappable)
- Bottom line: job description · Client name (11px, muted)
- Far right: date (10px, muted)

Status chips are tappable — advancing the status updates it inline. See DESIGN_SYSTEM §4.1.

### Overdue Invoices card
Per row: Client name (700) | Amount + INV-### | "N days overdue" | Resend button
Resend: one-click, shows toast, no state change. See DESIGN_SYSTEM §4.4.

### Upcoming card
Per row: Date badge (month in orange, day in navy, navy border, border-radius 6px) | Job name + Client · time

### Semantic colour rules
Orange border on stat cards = needs action only.
Green border on stat cards = money or completion only.
Never use red on the dashboard — reserve for Settings danger zone only.

---

## 5. Jobs List

**Route:** `/jobs`  
**Shell:** Authenticated

### Page header
- Left: "Jobs" (19px, 700)
- Right: search input (200px) + "New job" primary button

### Search input
Wrapper: `position: relative`.
Icon: `position: absolute; left: 10px; top: 50%; transform: translateY(-50%)`.
Input: `padding-left: 30px` — mandatory to prevent icon overlap.
Filters list in real-time via `data-search` attribute on each row wrapper.

### Filter tabs
Active | Draft | Awaiting approval | Completed | All

Active filter = statuses: progress, approved, sent, invoiced.
Active is the default tab on page load.

### Table grid (mandatory — do not deviate)
```css
grid-template-columns: 110px 2fr 1.5fr 80px 36px;
/* Status | Job | Client | Date | Chevron */
```

Headers: Status, Job, Client, Date — all left-aligned. Fifth column: empty header.

### Accordion row wrapper
```
.job-row-wrap — contains .job-row + .job-detail
Entire .job-row is tap target
Only one row open at a time — close others on open
Chevron rotates 180deg and turns #FF5C1B on open
```

### Expanded detail panel
```
max-height: 0 closed / max-height: 300px open
transition: 0.25s ease
background: hsl(220 20% 97%)
padding: 14px 16px 16px
```

Three-column detail grid inside: Address | Client | Service date / Description (spans) | Last updated | Job ID

Context-sensitive primary action buttons:
- Draft → "Send for approval" (primary orange)
- Approved → "Start job" (primary orange)
- In progress → "Mark completed" (primary orange)
- Completed → "Create invoice" (orange outline)

Always include "Edit job" (navy outline) on every expanded row.

### Date colouring
Dates within 3 days: `color: #FF5C1B; font-weight: 700`

---

## 6. Client List

**Route:** `/clients`  
**Shell:** Authenticated

### Page header
- Left: "Clients" (19px, 700)
- Right: search input + "New client" primary button

### Stats strip — 3-column grid, gap 10px
Total clients (default) | Active this month (green) | New this month (default)

### Table grid (mandatory)
```css
grid-template-columns: 2fr 1.5fr 100px 60px 36px;
/* Client | Address | Last job | Jobs count | Chevron */
```

### Client name cell
32px circle avatar: `border: 1.5px solid #0F172A`
Avatar colour rotation (by index mod 5):
```
0: bg #FFF1EC, color #FF5C1B
1: bg #EFF6FF, color #2563EB
2: bg #F0FDF4, color #16A34A
3: bg #F5F3FF, color #7C3AED
4: bg #FFF7ED, color #EA580C
```
Name: 13px, 700. Email: 10px, muted. Stacked vertically.

### Last job date colouring
This month: `color: #16A34A; font-weight: 600`
Older: `color: #64748B`

### Accordion expanded panel
- 3-column detail grid: Phone (orange link) | Address | Client since
- Recent jobs mini-list: address | date | status badge
- Actions: "New job" primary + "View profile" navy outline

---

## 7. Client Detail

**Route:** `/clients/:id`  
**Shell:** Authenticated

### Page structure (single column, no right column)
1. Breadcrumb: "← Clients / [Client name]"
2. Profile header card
3. KPI strip (4 cards)
4. Unified history card

### Profile header card
```
border: 2px solid #0F172A
border-radius: 10px
box-shadow: 3px 3px 0 0 rgba(15,23,42,0.9)
padding: 20px 22px
```

Top section (flex, space-between):
- Left: 48px avatar + name (19px, 700) + primary meta row (address, phone link, email link)
- Right: "New job" primary + "Edit" outline

Secondary meta strip (separated by border-top 1px #F1F5F9):
Four items with border-right dividers: Language | Source | Client since | Property
Each: label 10px uppercase muted + value 12px 600 navy

### KPI strip — 4 cards
Total jobs (default) | Revenue all time (green) | Last service (default, value 14px) | Outstanding (orange if overdue, default if none)

### Unified history card

Sticky header (position: sticky, top: 0, background #fff, z-index 2, border-bottom 1.5px solid #0F172A):
- Left: "Jobs" tab | "Invoices" tab
- Active tab: border-bottom 2.5px solid #FF5C1B, color #0F172A, font-weight 600
- Right: property filter select (only visible on Jobs tab — hide on Invoices tab)

Scroll area: `max-height: 400px; overflow-y: auto`

Jobs tab row grid: `2fr 80px 90px` — Address+desc | Date | Status badge
Invoices tab row grid: `70px 1fr 90px 90px` — INV-### | Description | Amount | Status

Amount colour rules:
- Overdue: #FF5C1B
- Paid: #16A34A
- Default: #0F172A

---

## 8. Invoices

**Route:** `/invoices`  
**Shell:** Authenticated

### Page header
- Left: "Invoices" (19px, 700)
- Right: "New invoice" primary button

### Summary strip — 4-column grid, gap 10px
| Label | Content | Variant |
|---|---|---|
| Overdue | $amount + N invoices | Orange |
| Awaiting payment | $amount + N sent | Orange |
| Paid (month) | $amount + N invoices | Green |
| Total (month) | $amount + N invoices | Default |

### Filter tabs
All | Overdue | Sent | Paid | Draft
Orange badge on Overdue with count.

### Table grid (mandatory — do not deviate)
```css
grid-template-columns: 56px 2fr 66px 74px 78px 90px;
/* Invoice | Client | Amount | Date | Status | Actions */
```

All column headers left-aligned.

### Row behaviour
Entire row is clickable (cursor: pointer, hover background).
Actions column must use `onclick="event.stopPropagation()"` to prevent row navigation.

### Client column
Name (12px, 700) + address (10px, muted) stacked.

### Date column
Overdue: `color: #FF5C1B; font-weight: 700` + append ` · Nd` (N = days overdue)
Normal: `color: #64748B`

### Actions by status
| Status | Action |
|---|---|
| Overdue | Resend button (orange border) |
| Sent | Mark paid button (green border) |
| Draft | Send button → becomes Resend after click |
| Paid | No actions rendered |

Mark paid → Undo: See DESIGN_SYSTEM §4.2
Send → Resend: See DESIGN_SYSTEM §4.3

---

## 9. Settings

**Route:** `/settings`  
**Shell:** Authenticated

### Layout
Single scrollable page. `margin-bottom: 24px` between sections.
Each section: section label (10px, uppercase, muted) above section card.

### Standard field row (Profile, Billing)
```css
display: grid;
grid-template-columns: 160px 1fr auto;
gap: 12px;
align-items: center;
padding: 13px 18px;
border-bottom: 1px solid #F1F5F9;
```

### Security row (Password & security — different layout)
```css
display: flex;
align-items: center;
justify-content: space-between;
padding: 13px 18px;
gap: 16px;
```
Left: label (11px, uppercase, muted) + value stacked.
Right: action button — `height: 30px; padding: 0 12px; border: 1.5px solid #FF5C1B; color: #FF5C1B; border-radius: 5px`
"Change" and "Reset" buttons must be pixel-identical in size.

### Notification row
```css
display: flex;
align-items: center;
justify-content: space-between;
padding: 13px 18px;
gap: 16px;
```
Left: title (11px, uppercase, 700) + description (12px).
Right: toggle switch.

Toggle — MUST use inline styles, not CSS classes:
```js
// ON
track.style.backgroundColor = '#FF5C1B';
knob.style.left = '23px';
desc.style.color = '#374151';

// OFF
track.style.backgroundColor = '#CBD5E1';
knob.style.left = '3px';
desc.style.color = '#94A3B8';
```

Toggle dimensions: `width: 44px; height: 24px; border-radius: 999px`
Knob: `width: 18px; height: 18px; top: 3px; position: absolute`
Must include `role="switch"` and `aria-checked` for accessibility.

Default toggle states:
- Job approvals: ON
- Invoice paid: ON
- Overdue reminders: ON
- Marketing emails: OFF

### Danger zone section
```css
/* Section label */
color: #EF4444;

/* Card */
border: 2px solid #EF4444;
box-shadow: 2px 2px 0 0 rgba(239,68,68,0.3);
```
Single row: label + descriptive sub-text on left | "Delete account" danger button on right.

---

## Appendix A — Routing Table

| Screen | Route | Auth required |
|---|---|---|
| Login | `/login` | No |
| Register | `/register` | No |
| Forgot password | `/forgot-password` | No |
| Dashboard | `/dashboard` | Yes |
| Jobs list | `/jobs` | Yes |
| Job detail | `/jobs/:id` | Yes |
| Client list | `/clients` | Yes |
| Client detail | `/clients/:id` | Yes |
| Invoices | `/invoices` | Yes |
| Invoice detail | `/invoices/:id` | Yes |
| Settings | `/settings` | Yes |

---

## Appendix B — i18n Key Convention

Format: `[screen].[element]`

Examples:
- `dashboard.greeting` → "Good morning, [name]."
- `jobs.filter.active` → "Active"
- `invoices.status.overdue` → "Overdue"
- `settings.notifications.job_approvals.title` → "Job approvals"

FR-CA is canonical. EN is secondary. All copy must pass the RBQ litmus test (see COPY_STYLE_GUIDE.md).

---

## Appendix C — Files Cursor Must Not Touch

When implementing any single screen, do not modify:
- `src/repositories/**`
- `src/hooks/**`
- `src/schemas/**`
- `src/i18n/locales/**` (add keys only, never remove)
- `supabase/**`
- Any other screen's component files
- `tailwind.config.js` (flag first if a token is missing)
