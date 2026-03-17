# DESIGN_SYSTEM.md — ProsDispatch Visual Spec
**Version:** 1.0 — Approved  
**Owner:** Design (Seb Mosto)  
**Status:** Build-ready. All patterns in this document are approved and must be followed exactly.

---

## 1. Cursor Guardrails

These rules apply to every task that touches UI:

1. **Read this document before writing any component.** Do not infer tokens from existing code — use the values here.
2. **Do not change tokens, shadows, or border radii** unless explicitly instructed. A PR that changes `--color-primary` without a spec reference will be rejected.
3. **Scope discipline:** If a task says "build the Invoices screen", touch only files related to that screen. Do not refactor shared components, routing, or hooks unless the task explicitly requires it.
4. **No new UI libraries.** All components are custom Tailwind. Do not introduce shadcn defaults, MUI, Chakra, or any component library that overrides these tokens.
5. **Bilingual by default.** Every user-facing string must use the i18n `t()` function. No hardcoded EN or FR strings in JSX.
6. **Mobile-first.** All layouts are built mobile-first and enhanced for desktop with Tailwind responsive prefixes (`md:`, `lg:`).
7. **Verify before submitting.** Run `npm run typecheck`, `npm run lint`, `npm run build` before every PR. All three must pass clean.

---

## 2. Design Tokens

### 2.1 Colour Palette

#### Primary — Safety Orange
```
--color-primary:        #FF5C1B   /* Main CTA, active states, focus rings */
--color-primary-ink:    #1F1308   /* Text/icons on orange backgrounds */
--color-primary-hover:  #FF7A3C   /* Hover accent */
--color-primary-light:  #FFF1EC   /* Tinted backgrounds, avatar fills */
```

#### Neutral — Slate
```
--color-neutral-50:   #F8FAFC
--color-neutral-100:  #F1F5F9
--color-neutral-200:  #E2E8F0
--color-neutral-300:  #CBD5E1
--color-neutral-400:  #94A3B8   /* Muted text, placeholder, icons */
--color-neutral-500:  #64748B   /* Secondary text */
--color-neutral-600:  #475569
--color-neutral-700:  #334155
--color-neutral-800:  #1E293B
--color-neutral-900:  #0F172A   /* Brand navy — borders, headings, dark fills */
```

#### Background
```
--color-bg:           hsl(220 20% 97%)   /* Page background — warm off-white */
--color-surface:      #FFFFFF            /* Card / input backgrounds */
```

#### Semantic
```
--color-success:      #16A34A   /* Paid, completed, connected */
--color-success-bg:   #F0FDF4
--color-success-border: #16A34A
--color-warning:      #FF5C1B   /* Overdue, needs attention (re-uses orange) */
--color-warning-bg:   #FFF1EC
--color-destructive:  #EF4444   /* Errors, danger zone */
--color-destructive-bg: #FEF2F2
```

### 2.2 Shadows

All shadows use **hard drop-shadows** (brutalist-lite). No soft/diffuse shadows.

```css
/* Default — cards, action buttons */
box-shadow: 2px 2px 0 0 rgba(15, 23, 42, 0.9);

/* Elevated — primary CTA, profile card */
box-shadow: 3px 3px 0 0 rgba(15, 23, 42, 0.9);

/* Hero — large cards, modals */
box-shadow: 4px 4px 0 0 rgba(15, 23, 42, 0.9);

/* Success variant */
box-shadow: 2px 2px 0 0 rgba(22, 101, 52, 0.9);

/* Warning variant (orange) */
box-shadow: 2px 2px 0 0 rgba(255, 92, 27, 0.35);

/* Hover state — adds 2px to both axes */
/* e.g. default → 4px 4px on hover */
```

In Tailwind config, register:
```js
boxShadow: {
  'brutal':         '2px 2px 0 0 rgba(15,23,42,0.9)',
  'brutal-md':      '3px 3px 0 0 rgba(15,23,42,0.9)',
  'brutal-lg':      '4px 4px 0 0 rgba(15,23,42,0.9)',
  'brutal-success': '2px 2px 0 0 rgba(22,101,52,0.9)',
  'brutal-warning': '2px 2px 0 0 rgba(255,92,27,0.35)',
}
```

### 2.3 Typography

**Font:** Inter (sans-serif only — no serif or display fonts in the app).

```
Font family: 'Inter', ui-sans-serif, system-ui, sans-serif
Weights used: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

Page title:       20px / 700
Section heading:  16px / 700
Card title:       13px / 700
Body:             13px / 400
Secondary:        12px / 400 — color: #64748B
Caption / label:  10–11px / 700 / uppercase / letter-spacing: 0.7px — color: #94A3B8
```

### 2.4 Border

All borders are **2px solid #0F172A** (brand navy) on interactive elements and cards.  
Dividers inside cards use **1px solid #F1F5F9** (very light).  
Section dividers use **1px solid #E2E8F0**.

```css
/* Card / input / button border */
border: 2px solid #0F172A;

/* Internal card row divider */
border-bottom: 1px solid #F1F5F9;

/* Section separator */
border-bottom: 1px solid #E2E8F0;
```

### 2.5 Border Radius

```
Cards:       border-radius: 10px   (rounded-[10px])
Inputs:      border-radius: 7px
Buttons:     border-radius: 7px
Badges/pills: border-radius: 4px
Tags / chips: border-radius: 4–6px
Full circle: border-radius: 9999px
```

### 2.6 Spacing

Base grid: **4px**. All padding/margin values are multiples of 4.

```
xs:   4px
sm:   8px
md:   12px
base: 16px
lg:   20px
xl:   24px
2xl:  32px
3xl:  40px
```

Card internal padding: `16px 18px` (vertical / horizontal).

---

## 3. Component Patterns

### 3.1 Buttons

#### Primary CTA
```css
height: 36–40px;
background: #FF5C1B;
color: #1F1308;
border: 2px solid #0F172A;
border-radius: 7px;
font-size: 12–13px;
font-weight: 700;
box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9);
padding: 0 13px;

/* Hover */
box-shadow: 4px 4px 0 0 rgba(15,23,42,0.9);
transform: translate(-1px, -1px);

/* Active */
box-shadow: 1px 1px 0 0 rgba(15,23,42,0.9);
transform: translate(1px, 1px);
```

#### Secondary / Outline
```css
height: 36px;
background: #FFFFFF;
color: #0F172A;
border: 2px solid #0F172A;
border-radius: 7px;
font-weight: 700;
box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9);
/* Hover/active: same as primary */
```

#### Inline Action (small)
```css
height: 30px;
padding: 0 10–12px;
font-size: 11px;
font-weight: 700;
border-radius: 5–6px;
border: 1.5px solid;
/* Orange variant: color + border = #FF5C1B */
/* Navy variant: color + border = #0F172A */
/* Destructive: color + border = #EF4444 */
```

#### Danger
```css
color: #EF4444;
border: 1.5px solid #EF4444;
background: transparent;
border-radius: 6px;
padding: 5px 12px;
font-size: 11px;
font-weight: 700;
/* Hover: background: #FEF2F2 */
```

### 3.2 Cards

All cards share:
```css
background: #FFFFFF;
border: 2px solid #0F172A;
border-radius: 10px;
box-shadow: 2px 2px 0 0 rgba(15,23,42,0.9);
overflow: hidden;
```

Section cards (e.g. "Recent jobs") have a sticky/fixed header row:
```css
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  border-bottom: 1px solid #E2E8F0;
  font-size: 12px;
  font-weight: 700;
  color: #0F172A;
}
```

### 3.3 Inputs

```css
height: 44px;                          /* Standard form input */
border: 2px solid #0F172A;
border-radius: 10px;
padding: 0 14px;
font-size: 14px;
background: hsl(220 20% 97%);
color: #0F172A;

/* Focus */
border-color: #FF5C1B;
box-shadow: 0 0 0 3px rgba(255, 92, 27, 0.15);

/* Placeholder */
color: #94A3B8;

/* Settings fields (compact) */
height: 36px;
border: 1.5px solid #CBD5E1;
border-radius: 7px;
font-size: 13px;
```

Search inputs must use `padding-left: 30px` to clear the icon, with the icon absolutely positioned at `left: 10px`.

### 3.4 Status Badges / Chips

All status elements share this base:
```css
display: inline-flex;
align-items: center;
font-size: 9–10px;
font-weight: 700;
letter-spacing: 0.4px;
text-transform: uppercase;
padding: 3px 6–8px;
border-radius: 4px;
border: 1.5px solid;
white-space: nowrap;
```

#### Status values:
| Status | Background | Text | Border |
|---|---|---|---|
| Draft | `#F1F5F9` | `#475569` | `#CBD5E1` |
| Sent / Awaiting | `#FFF7ED` | `#EA580C` | `#EA580C` |
| Approved | `#EFF6FF` | `#2563EB` | `#2563EB` |
| In progress | `#F5F3FF` | `#7C3AED` | `#7C3AED` |
| Completed | `#F0FDF4` | `#16A34A` | `#16A34A` |
| Invoiced | `#FFF7ED` | `#EA580C` | `#EA580C` |
| Paid | `#F0FDF4` | `#16A34A` | `#16A34A` |
| Overdue | `#FFF1EC` | `#FF5C1B` | `#FF5C1B` |

Tappable chips (status advancement) append ` ↻` suffix and have:
```css
cursor: pointer;
/* Hover: transform: translateY(-1px) */
```

### 3.5 Toggle Switch

State is driven by **JavaScript inline styles**, not CSS classes, to ensure reliable rendering.

```js
const ON_COLOR  = '#FF5C1B';   // Safety orange track when ON
const OFF_COLOR = '#CBD5E1';   // Grey track when OFF
const KNOB_ON   = '23px';      // knob left position when ON (for 44px wide toggle)
const KNOB_OFF  = '3px';       // knob left position when OFF
const ON_DESC   = '#374151';   // Description text colour when ON
const OFF_DESC  = '#94A3B8';   // Description text colour when OFF
```

Structure:
```html
<button class="toggle" role="switch" aria-checked="true/false" onclick="toggleSwitch(i)">
  <div class="knob"></div>
</button>
```

```css
.toggle {
  width: 44px; height: 24px;
  border-radius: 999px;
  border: none; padding: 0;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}
.knob {
  position: absolute;
  top: 3px;
  width: 18px; height: 18px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: left 0.2s;
}
```

Always include `role="switch"` and `aria-checked` for accessibility.

### 3.6 Accordion Rows

Used in Jobs list, Client list.

```
- Wrapper:    .job-row-wrap / .client-row-wrap
- Trigger:    clicking the main row div (entire row is tap target)
- Open state: add class `open` to wrapper
- Detail panel: max-height: 0 → max-height: 300px, transition: 0.25s ease
- Chevron: rotates 180deg on open, colour changes to #FF5C1B
- Only one row open at a time — close others on open
```

Detail panel content includes: address, client, dates, description, job ID, and context-sensitive action buttons.

**Context-sensitive actions by status:**
| Status | Primary action |
|---|---|
| Draft | Send for approval |
| Awaiting | (no primary — edit only) |
| Approved | Start job |
| In progress | Mark completed |
| Completed | Create invoice |

Always include Edit job button on every expanded row.

### 3.7 Navigation — Left Sidebar

```css
width: 160px;
background: #FFFFFF;
border-right: 1.5px solid #0F172A;
padding: 12px 0;
```

Nav item:
```css
display: flex; align-items: center; gap: 8px;
padding: 8px 12px;
font-size: 12px; font-weight: 500; color: #64748B;
border-left: 3px solid transparent;
/* Active: */
color: #0F172A; font-weight: 700;
border-left: 3px solid #FF5C1B;
background: hsl(220 20% 97%);
```

Nav badge (count):
```css
margin-left: auto;
background: #FF5C1B; color: #1F1308;
font-size: 9px; font-weight: 700;
padding: 1px 5px; border-radius: 999px;
```

Sidebar footer (user identity):
```css
margin-top: auto;
border-top: 1px solid #E2E8F0;
padding: 10px 12px 0;
/* Avatar: 26px circle, orange fill, navy border */
/* Name: 11px / 700 */
/* Role: 10px / 400 / muted */
```

### 3.8 Topbar

```css
background: #FFFFFF;          /* App topbar */
border-bottom: 1.5px solid #0F172A;
height: 52px;
padding: 0 20px;
display: flex; align-items: center; justify-content: space-between;
```

Logo wordmark: `Dispatch | Labs` — both words 700 weight, 14px, #0F172A. Divider is `1px solid #94A3B8`, height 15px.

Logo icon: 30×30px, `background: #0F172A`, `border-radius: 7px`, hammer SVG in white.

Language pill (FR/EN toggle):
```css
display: flex; align-items: center; gap: 6px;
background: #E2E8F0; border: none; border-radius: 999px;
padding: 5px 14px 5px 10px;
font-size: 13px; font-weight: 500;
/* Hover: background: #CBD5E1 */
```

Moon icon button: 34×34px, transparent, border-radius 8px, stroke: #64748B.

Public topbar (landing/auth pages): background matches page (`hsl(220 20% 97%)`), border-bottom: `1px solid #CBD5E1`.

---

## 4. Interaction Behaviours

### 4.1 Status Advancement (Jobs)

Cycle: `Draft → Sent → Approved → In progress → Completed`

- Tapping a chip advances it one step.
- `Completed` has no further advancement — chip loses tappable state.
- On advancement to `Completed`, an Invoice button appears in the row actions.
- Show a toast confirmation on every state change: `"Status → [new status]"`

### 4.2 Mark Paid (Invoices)

1. User clicks "Mark paid" → invoice status flips to Paid immediately.
2. "Mark paid" button is replaced by an "Undo" button.
3. Undo button is visible for **8 seconds**, then hides automatically.
4. Clicking Undo fully reverts: status badge, actions, and dataset status.
5. Toast on mark paid: `"Marked as paid · [Client name]"`
6. Toast on undo: `"Undone — [Client name] back to [previous status]"`

### 4.3 Send → Resend (Invoices / Drafts)

- Draft invoices show a "Send" button.
- On click: status flips to Sent, button label changes to "Resend" immediately.
- Subsequent clicks on "Resend" trigger reminder toast only — no further state change.

### 4.4 Inline Resend (Overdue Invoices)

- Overdue invoice rows show a "Resend" button (send icon + label).
- Click fires a toast: `"Reminder sent to [Client name]"`
- No state change — invoice remains overdue until manually marked paid.

### 4.5 Search Filtering

- All search inputs filter the visible list in real-time on `oninput`.
- Search is case-insensitive and matches against a `data-search` attribute on each row.
- Empty state shown when no rows match: `"No [items] match this filter."`

### 4.6 Tab Switching (Client detail — Unified History)

- Two tabs: Jobs | Invoices.
- Active tab has bottom border: `2.5px solid #FF5C1B`.
- Property filter dropdown only visible on Jobs tab — hidden on Invoices tab.
- Scroll area capped at `max-height: 400px`, `overflow-y: auto`.
- Card header (tabs + filter) is `position: sticky; top: 0` within the card.

### 4.7 Toast Notifications

```css
position: fixed;
bottom: 80px;
left: 50%; transform: translateX(-50%);
background: #0F172A; color: #fff;
font-size: 12px; font-weight: 600;
padding: 9px 18px; border-radius: 8px;
opacity: 0; transition: opacity 0.2s;
pointer-events: none;
white-space: nowrap;
z-index: 99;
```

- Appears for **2.5 seconds**, then fades out.
- Only one toast visible at a time — reset timer on each new toast.

### 4.8 Calm Alert Banner (Dashboard)

Used for overdue invoice warnings:
```css
display: flex; align-items: center; gap: 10px;
background: #fff;
border: 1.5px solid #FF5C1B;
border-radius: 8px;
padding: 10px 14px;
box-shadow: 2px 2px 0 0 rgba(255,92,27,0.3);
```

- Orange dot indicator (8px circle).
- Factual copy only — no exclamation marks, no emoji.
- Action link flush right in orange.

---

## 5. Colour Semantics — Rules

These rules are non-negotiable for accessibility and brand consistency:

| Colour | Use for | Never use for |
|---|---|---|
| `#FF5C1B` (orange) | CTAs, active states, overdue, needs-attention, focus rings | Success, generic info |
| `#0F172A` (navy) | Borders, headings, inactive nav, dark fills | Error states |
| `#16A34A` (green) | Paid, completed, connected, revenue | Warnings, neutral info |
| `#EF4444` (red) | Destructive actions, delete only | Overdue (use orange) |
| `#94A3B8` (muted) | Placeholders, captions, disabled states | Active content |

**Semantic rule:** Orange = action needed. Green = money received or job closed. Red = permanent/destructive only.

---

## 6. Accessibility

- All interactive elements must have visible focus rings: `box-shadow: 0 0 0 3px rgba(255,92,27,0.35)` on focus-visible.
- Toggle switches must include `role="switch"` and `aria-checked="true/false"`.
- Icon-only buttons must include `aria-label` or a visually hidden `<span class="sr-only">`.
- Minimum tap target size on mobile: **44×44px**.
- Colour is never the sole means of conveying state — always pair with a label, icon, or position change.
- WCAG AA contrast required on all text.
