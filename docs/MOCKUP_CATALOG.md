# Mockup Catalog — HTML → App Pages

This document maps the attached HTML mockups to ProsDispatch routes and pages. Use it with `docs/DESIGN_SYSTEM.md` and `docs/SCREEN_SPECS.md` when implementing or auditing each screen.

| Mockup file | Route | Page / component | Status |
|-------------|--------|-------------------|--------|
| `register_screen_v2.html` | `/register` | `src/pages/auth/SignUpPage.tsx` | To align |
| `forgot_password_v1.html` | `/forgot-password` | New: `SignInPage` link only; add `ForgotPasswordPage.tsx` + route | To add |
| `dashboard_v4.html` | `/dashboard` | `src/pages/DashboardPage.tsx` | To align |
| `jobs_list_v2.html` | `/jobs` | `src/pages/jobs/JobsListPage.tsx` | To align |
| `client_detail_v2.html` | `/clients/:id` | `src/pages/clients/ClientDetailPage.tsx` | To align |
| `invoices_v4.html` | `/invoices` | Need list page (e.g. `InvoicesListPage` or existing invoices route) | To align |
| `settings_v2.html` | `/settings` | `src/pages/SettingsPage.tsx` | To align |

---

## 1. Register (`register_screen_v2.html`)

- **Shell:** Public topbar (bg `hsl(220 20% 97%)`, border `1px #CBD5E1`), no sidebar.
- **Card:** max-width 460px, centered; bg #fff, border 2px #0F172A, rounded 14px, shadow 4px 4px; padding 40px 40px 36px.
- **Content order:** Orange label → Title → Subtitle → Field row (First name | Last name) → Business name → Trade (dropdown + “Other” expand) → Divider “Account credentials” → Email → Password | Confirm → CTA “Create account” → Terms (with ToS/Privacy links) → “Already have an account? Sign in →”.
- **Trade options:** Plumbing, HVAC, Electrical, General contractor, Roofing, Other; “Other” reveals text input (orange border, focus ring).
- **i18n:** Use `register.*` keys per SCREEN_SPECS §2.

---

## 2. Forgot Password (`forgot_password_v1.html`)

- **Shell:** Same public topbar as Register/Login.
- **Card:** max-width 420px; two states in one card (JS visibility).
- **Default state:** Back link “Back to sign in” → Lock icon (22px, 2px navy border, rounded 10px) → Orange label “Password reset” → Title “Forgot your password?” → Subtitle → Email field → CTA “Send reset link”.
- **Success state:** Green check icon box → “Check your email” → Body with bold email → Outline “Back to sign in” → “Didn’t receive it? Send again” (returns to default).
- **i18n:** Use `forgot.*` keys per SCREEN_SPECS §3.

---

## 3. Dashboard (`dashboard_v4.html`)

- **Shell:** Authenticated topbar + sidebar (Main: Dashboard, Jobs, Clients, Invoices; Account: Settings).
- **Alert banner:** Only when overdue invoices; orange border, white bg; “[N] overdue invoices — $[amount] outstanding. Last sent [N] days ago.” + “View invoices →”.
- **Page header:** “Good morning, [first_name].” (19px 700) + date below; right: “New client” (secondary) + “New job” (primary).
- **Stats grid:** 4 cards — Need attention | Overdue invoices | Revenue (March) | Total clients (needs-action = orange border/shadow, success = green).
- **Two-col:** Left = Recent jobs card (address + status chip, description · client, date); Right (280px) = Overdue invoices card + Upcoming card (date badge + job + client · time).
- **Toasts:** Status updates, resend reminders.

---

## 4. Jobs List (`jobs_list_v2.html`)

- **Header:** “Jobs” + search (200px, icon left) + “New job” primary.
- **Filter tabs:** Active | Draft | Awaiting approval | Completed | All (Active = default).
- **Table grid:** 110px 2fr 1.5fr 80px 36px (Status | Job | Client | Date | Chevron).
- **Accordion rows:** One open at a time; chevron 180° + orange when open; detail panel max-height 300px, 3-col grid (Address, Client, Service date, Description, Last updated, Job ID) + context actions (Send for approval, Start job, Mark completed, Create invoice, Edit job).
- **Status chips:** Tappable with ↻; dates within 3 days in orange 700.
- **Empty state:** “No jobs match this filter.”

---

## 5. Client Detail (`client_detail_v2.html`)

- **Breadcrumb:** “← Clients / [Client name]”.
- **Profile card:** 48px avatar, name (19px 700), primary meta (address, phone link, email link), “New job” + “Edit”; secondary meta row (Language | Source | Client since | Property) with dividers.
- **KPI strip:** 4 cards — Total jobs | Revenue (green) | Last service | Outstanding (orange if overdue).
- **Unified history card:** Sticky header with Jobs | Invoices tabs (active tab 2.5px orange bottom border), property filter (Jobs tab only); scroll max-height 400px; Jobs grid 2fr 80px 90px; Invoices grid 70px 1fr 90px 90px; amount colours overdue/orange, paid/green.

---

## 6. Invoices (`invoices_v4.html`)

- **Header:** “Invoices” + “New invoice” primary.
- **Summary strip:** 4 cards — Overdue | Awaiting payment | Paid (March) | Total (March) (needs-action / success variants).
- **Filter tabs:** All | Overdue | Sent | Paid | Draft (count badges on tabs).
- **Table grid:** 56px 2fr 66px 74px 78px 90px (Invoice | Client | Amount | Date | Status | Actions).
- **Row actions by status:** Overdue → Resend; Sent → Mark paid; Draft → Send (then Resend); Paid → none. Mark paid → Undo (8s); toasts per DESIGN_SYSTEM §4.2–4.4.
- **Row click:** Navigate to invoice; actions column uses stopPropagation.

---

## 7. Settings (`settings_v2.html`)

- **Sections:** Profile | Language | Notifications | Billing & subscription | Stripe Connect | Password & security | Données & confidentialité (Law 25) | Danger zone.
- **Profile:** Field rows 160px 1fr auto (label | input | spare); Trade select; Save changes button.
- **Language:** Toggle EN/FR (segmented control style).
- **Notifications:** Rows with title + description; toggle ON (orange #FF5C1B track) / OFF (grey); description colour ON #374151, OFF #94A3B8.
- **Security rows:** Flex space-between; label + value left, “Change” / “Reset” right (30px height, 1.5px orange border).
- **Danger zone:** Section label red; card red border + red shadow; “Delete account” button red outline.
- **Toggles:** 44×24px (or 40×22 in mockup), knob 18px; use inline styles per DESIGN_SYSTEM §3.5.

---

## Implementation order (suggested)

1. **Register** — SignUpPage rebuild (public topbar + card from mockup).
2. **Forgot Password** — New ForgotPasswordPage + route; link from Login.
3. **Dashboard** — DashboardPage layout and components to match mockup.
4. **Jobs List** — JobsListPage table, filters, accordion.
5. **Client Detail** — ClientDetailPage profile card, KPIs, history tabs.
6. **Invoices List** — Invoices list page (or existing route) to match invoices_v4.
7. **Settings** — SettingsPage sections and toggles to match settings_v2.

All copy via `t()`; add keys to `en.json` / `fr.json`. Do not change auth or repository logic; only UI and i18n.
