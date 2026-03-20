# QA Context — ProsDispatch
**Read before executing any flow.**

---

## The App in One Paragraph

ProsDispatch is a job management and payments tool for small home service contractors in Quebec — plumbers, HVAC techs, electricians, general contractors. The core promise: a contractor can create a job, send it to a client for approval, do the work, send an invoice, and get paid — all from their phone — in under 48 hours. The product is French-first, Law 25 compliant, and built to feel like a professional Quebec trade tool, not a Silicon Valley startup.

Live app: [pro.prosdispatch.com](https://pro.prosdispatch.com)

---

## Who You Are Simulating

**Persona: Marc Tremblay, plombier, Laval QC**

- 1-person shop, occasionally hires a helper
- Phone is an older Android (Chrome browser). Sometimes on iOS Safari.
- Uses the app in between jobs — in the truck, at a job site, sometimes in a basement with spotty signal
- Not tech-literate. He will not read instructions. He expects things to be obvious.
- Speaks French as his primary language. Understands English but defaults to French.
- Trusts tools that look professional and serious. Distrusts anything that feels like a startup pitch.
- Does not tolerate slow load times, broken buttons, or confusing labels.
- **He does not need the app to be beautiful. He needs it to work, fast, every time.**

**What Marc cares about:**
1. Can I create a job quickly without hunting for a button?
2. Does the client see something that looks professional?
3. Can I send the invoice and get paid without calling anyone?
4. Is my client data private?
5. Does it work when I'm offline or have bad signal?

**What will make Marc abandon the app:**
- Any error message that doesn't tell him what to do next
- A button that doesn't respond to his tap
- French text that sounds like a translated English startup
- A screen that requires scrolling left/right on his phone
- Anything that makes him feel like he needs training

---

## Brand & Tone Rules

These apply to all copy you evaluate during testing. Copy that violates these rules is a **P1 finding**.

### Voice: RBQ-Inspired Calm Authority

The app should read like a tool from the Régie du bâtiment du Québec — structured, direct, professional, protective. Not a startup.

**Correct tone:**
- "Travaux créés. Envoi au client en cours."
- "Une information est manquante. Veuillez vérifier le formulaire."
- "Conforme à la Loi 25."

**Wrong tone (file as P1):**
- "Oups! Quelque chose s'est mal passé 😅"
- "Super! Votre travail a été créé!"
- "Optimisez votre flux opérationnel"
- Any emoji in error states or success notifications
- Exclamation marks in system messages
- "Bienvenue!" with excessive enthusiasm

### French Copy Rules

| Use | Avoid |
|-----|-------|
| travaux | jobs (anglicisme) |
| entrepreneur / gens de métier | contractor (anglicisme direct) |
| tableau de bord | dashboard (anglicisme) |
| dossiers | records (anglicisme) |
| vous (always formal) | tu |
| Phrases courtes, actives | Subordonnées multiples |

### English Copy Rules

English UI should be equally direct and non-startup. No exclamation marks in functional copy. No "Amazing!" confirmations.

### Law 25 Compliance (Non-Negotiable)

- Privacy/data language must be present in the footer or settings
- No copy that implies data is sold or shared
- Export capability must be communicated somewhere in settings

---

## Design System Expectations

These are the correct design tokens. Flag mismatches as P2 (cosmetic) unless they break contrast or accessibility, in which case P1.

| Token | Value |
|-------|-------|
| Brand Orange (primary action) | `#FF5C1B` |
| Brand Navy (headings/backgrounds) | `#0F172A` |
| Light Grey (page background) | `#F9FAFB` / `#F8FAFC` |
| Success | `#16A34A` |
| Error/Destructive | `#EF4444` |
| Warning | `#F59E0B` |
| Font (body) | Inter |
| Border radius | 12px (`--radius-lg`) |
| Touch targets | Minimum 44px height |

### Visual Style Notes

The app uses a "brutal/direct" aesthetic — not playful, not pastel. If you encounter:
- Rounded bubbly UI that looks like a consumer lifestyle app → P2
- Purple gradients → P2 (not on brand)
- Generic "AI slop" components with no character → P2

The aesthetic should feel **industrial-utilitarian** — tools, not toys.

---

## Mobile Behaviour Expectations

You are always simulating a 390px wide mobile viewport (iPhone 12/13 equivalent).

| Expectation | Severity if violated |
|-------------|---------------------|
| No horizontal scroll on any page | P0 |
| No text smaller than 16px body copy | P1 |
| All buttons minimum 44px tap target | P1 |
| Bottom Tab Bar visible: Dashboard / Jobs / Clients / Settings | P1 |
| FAB (Floating Action Button) for primary action on Dashboard and Jobs | P1 |
| Cards stacked vertically (not in a grid) on mobile | P1 |
| Offline banner appears when network is simulated offline | P1 |
| SyncBadge visible on Job Create / Edit / Detail views | P1 |

---

## Feature Scope Reference

### In scope for MVP1 (test these)
- Contractor registration and onboarding
- Job lifecycle: draft → sent → approved → in_progress → completed → invoiced
- Client and property management (Shadow Registry)
- Invoice creation and send
- Public invoice view (homeowner token-based)
- Bilingual EN/FR toggle
- Offline banner / sync badge
- Settings: profile, language preference

### Out of scope for MVP1 (do not test, do not file as bugs)
Per [`docs/MVP1_PRD.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/MVP1_PRD.md):
- Marketplace / lead gen
- Bidding / proposals
- In-app messaging
- Calendar / scheduling
- Native mobile app
- Inventory management
- Dashboard analytics charts
- Homeowner portal (separate account)

### Known stubs (do not file as bugs — tracked separately)
- **Stripe payment flow on public invoice page** — `PublicInvoicePage.tsx` has `console.log` placeholder only. Backend schema is ready; frontend not wired. Do not file.
- **SaaS subscription checkout** — `/subscribe` flow is pending. Backend ready. Do not file.

---

## Spec References for Each Area

| Area | Canonical Spec |
|------|---------------|
| Job lifecycle and state machine | [`SPEC-003`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/SPEC-003_%20Job%20Management%20%28MVP1%29.md) |
| Invoice and payments | [`SPEC-004`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/SPEC-004_%20Invoices%20%28MVP1%29.md) / [`SPEC-005`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/SPEC-005_%20Monetization%20%28SaaS%20Billing%20%2B%20Job%20Payments%29.md) |
| App routes and navigation | [`docs/APP_FLOW.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/APP_FLOW.md) |
| Copy and tone | [`Dispatch Language Style Guide`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/Dispatch%20Language%20Style%20Guide%20%26%20Samples.md) |
| Mobile UX rules | [`docs/patterns/UX-Responsive-01.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/patterns/UX-Responsive-01.md) |
| Design tokens | [`docs/FRONTEND_GUIDELINES.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/FRONTEND_GUIDELINES.md) |
| Full feature scope | [`docs/MVP1_PRD.md`](https://raw.githubusercontent.com/SebMosto/ProsDispatch/main/docs/MVP1_PRD.md) |
