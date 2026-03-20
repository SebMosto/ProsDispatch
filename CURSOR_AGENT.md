# CURSOR_AGENT.md — ProsDispatch Overnight Bug Fix Run
# Generated: 2026-03-19 | Based on live audit of pro.prosdispatch.com
# Mode: Cursor Agent (autonomous, unattended)

## BEFORE YOU WRITE A SINGLE LINE OF CODE

Read these files fully in this order:
1. CLAUDE.md
2. AGENTS.md
3. .beads/beads.jsonl

Then read the relevant mockup HTML before touching any UI file:
- Dashboard: docs/mockups/dashboard_v4.html
- Jobs:      docs/mockups/jobs_list_v2.html
- Invoices:  docs/mockups/invoices_v4.html
- Clients:   docs/mockups/client_detail_v2.html
- Settings:  docs/mockups/settings_v2.html
- Register:  docs/mockups/register_screen_v2.html
- Forgot PW: docs/mockups/forgot_password_v1.html

These HTML files are the ONLY visual ground truth. When in doubt, open them.

## SUPABASE STATUS — CONFIRMED HEALTHY (no DB changes needed)

Auth user:           f1709a56-58e8-40cb-8721-64850e3b9084
Email:               sebmostovac@gmail.com
Profile row:         EXISTS in profiles table
full_name:           Sebastien Mostovac
role:                contractor
subscription_status: trialing (resolves to isSubscribed=true)
Last migration:      approve_job_via_token
vercel.json:         ALREADY CORRECT — rewrite rule exists, BUG-011 is done

The AbortError is 100% a frontend bug. Do NOT touch Supabase.

## THE RALPH LOOP

For every bead:
  1. READ the bead definition below
  2. READ the context_files listed
  3. READ the relevant mockup if it is a UI task
  4. PLAN your changes before typing
  5. ACT — minimum changes only
  6. VERIFY — run the Stop Hook
  7. FAIL — read error, fix, return to step 5
  8. PASS — append bead to .beads/beads.jsonl as closed
  9. COMMIT: git add -A && git commit -m "fix(BUG-XXX): description"
  10. Move to next bead

## STOP HOOK — ALL must pass before every commit

  npm run typecheck
  npm run lint
  npm run test
  npm run check:i18n
  npm run check:stack

If Stop Hook fails 3 times on the same bead:
  Add "BLOCKED: [reason]" to that bead history in .beads/beads.jsonl
  Move to next bead. Do NOT leave broken code committed.

## ABSOLUTE RULES — NEVER VIOLATE

1. Never call supabase directly from components — use src/repositories/ only
2. Never hardcode strings — use t('key'), update BOTH en.json AND fr.json
3. Never use red #EF4444 for anything except delete/destroy buttons
4. Never use Tailwind blue/indigo on interactive elements
5. Never add routes outside src/App.tsx
6. Never use Next.js APIs or imports
7. Never add new npm packages without explaining why
8. Never hard-delete job records — use deleted_at soft delete
9. Never transition job status directly — use transition_job_state RPC
10. Never expose raw error.message or error.name to the UI

## KEY DESIGN TOKENS

Primary orange CTA:  #FF5C1B bg, #1F1308 text
Brand navy:          #0F172A (borders, headings, active states, logo)
Success green:       #16A34A (paid, completed, connected, revenue)
Destructive red:     #EF4444 (DELETE/DESTROY buttons ONLY — nowhere else)
Muted grey:          #94A3B8 (placeholders, captions, disabled)
Secondary text:      #64748B
Toggle OFF:          #CBD5E1
Page background:     hsl(220 20% 97%)
Card border:         2px solid #0F172A
Card shadow:         2px 2px 0 0 rgba(15,23,42,0.9)  — HARD shadow, not soft
Auth card shadow:    4px 4px 0 0 rgba(15,23,42,0.9)
Button radius:       7px (inline actions: 6px)
Active nav:          border-left 3px solid #FF5C1B — NOT a filled pill badge
Filter tabs active:  background #0F172A NAVY — NOT orange
Settings toggle ON:  #0F172A NAVY — NOT orange (mockup overrides design system)
Font:                Inter, base 13px

Add to tailwind.config.js extend.boxShadow:
  brutal:        '2px 2px 0 0 rgba(15,23,42,0.9)'
  brutal-auth:   '4px 4px 0 0 rgba(15,23,42,0.9)'
  brutal-orange: '2px 2px 0 0 rgba(255,92,27,0.35)'
  brutal-green:  '2px 2px 0 0 rgba(22,101,52,0.3)'
  brutal-red:    '2px 2px 0 0 rgba(239,68,68,0.3)'

## BUG EXECUTION ORDER — top to bottom, no skipping

---

### BUG-009 [P0] AbortError on all data fetches
Files: src/hooks/useJobs.ts, src/hooks/useClients.ts, src/hooks/useInvoices.ts

ROOT CAUSE confirmed by reading source:
useJobs.ts wraps queryFn in useCallback with [params, t] as deps.
t() from useTranslation() returns a NEW REFERENCE on every render.
queryFn is recreated constantly, TanStack Query cancels the prior
AbortController mid-flight and throws AbortError.
Same bug in useClients.ts and useInvoices.ts.

FIX in all three hooks:
  Remove t from useCallback deps.
  Remove manual AbortController, setTimeout, clearTimeout entirely.
  Use TanStack Query built-in signal via queryFn argument:

    const queryFn = useCallback(
      async ({ signal }: { signal?: AbortSignal }) => {
        const result = await repository.list(params, signal);
        if (result.error) throw result.error;
        return result.data ?? [];
      },
      [params]
    );

    const query = useQuery<RecordType[], RepositoryError>({
      queryKey,
      queryFn,
      staleTime: FIVE_MINUTES,
      retry: false,
    });

Error display — both keys already exist in en.json and fr.json:
  errors.timeout    = "Unable to load your data. Please check your connection and try again."
  errors.unexpected = "An unexpected error occurred."
Map RepositoryError.reason to these. Never render error.message in JSX.

Commit: fix(BUG-009): remove t() from queryFn deps, use TanStack native signal

---

### BUG-010 [P0] settings.error raw i18n key shown in Settings
File: src/pages/SettingsPage.tsx (find actual path first)

Settings renders the literal string "settings.error" in a pink box.
Correct key path in en.json is settings.profile.error (already exists):
  value: "Unable to update profile."

Fix: change t('settings.error') to t('settings.profile.error').

Commit: fix(BUG-010): correct i18n key path settings.error to settings.profile.error

---

### BUG-011 [ALREADY DONE] vercel.json SPA rewrite
vercel.json already exists with correct rewrite rule. Skip this bug.

---

### BUG-012 [P1] Page titles and subtitles wrong
Files: find JobsListPage, ClientsListPage, InvoicesListPage, DashboardPage in src/pages/

en.json already has the correct keys:
  t('jobs.list.pageTitle')     = "Jobs"
  t('clients.list.pageTitle')  = "Clients"
  t('invoices.list.pageTitle') = "Invoices"

Use these for the H1 on each page. Remove subHeader subtitle paragraphs entirely.

Dashboard greeting:
  Loaded:   t('dashboard.greeting', { name: firstName })
  Fallback: t('dashboard.greetingFallback')
  firstName = useAuth().profile?.full_name?.split(' ')[0] ?? null

Commit: fix(BUG-012): correct page titles, remove subtitles, fix greeting name

---

### BUG-013 [P1] Create Job form has debug content and raw UUID fields
File: find CreateJobPage in src/pages/jobs/

1. Remove defaultValue "Testing platform" from job title input
2. Remove "Ready to submit" SyncBadge from card header
3. H1 breadcrumb: t('jobs.createPage.breadCrumb') = "Jobs"
4. Card title: t('jobs.create.title') = "Create job"
5. Remove subtitle t('jobs.createPage.subHeader')
6. Remove description warning t('jobs.create.descriptionWarning')

7. Replace Client ID text input with a combobox:
   - useClients() hook at src/hooks/useClients.ts
   - Display client.name in options, store client.id as value
   - react-hook-form Controller pattern (already used in repo)
   - Loading state while hook fetches
   - Empty state: "No clients yet"

8. Replace Property ID text input with a dependent select:
   - Only render after client is selected
   - Filter properties by selected client_id
   - Display property address in options
   - Store property.id as value

Commit: fix(BUG-013): replace UUID inputs with selectors, remove debug content

---

### BUG-014 [P1] Sidebar and topbar do not match mockup
Files: find Layout components in src/components/Layout/
READ docs/mockups/dashboard_v4.html .sidebar and .topbar CSS before writing code.

SIDEBAR:
  w-[160px] flex-shrink-0 bg-white border-r-[1.5px] border-[#0F172A] flex flex-col py-3
  hidden md:flex

  Section labels:
    text-[9px] font-bold uppercase tracking-[1px] text-[#CBD5E1] px-3 mt-[14px] mb-1

  Nav items inactive:
    flex items-center gap-2 px-3 py-2 w-full text-[12px] font-medium text-[#64748B]
    border-l-[3px] border-transparent
    hover:bg-[hsl(220_20%_97%)] hover:text-[#0F172A] transition-colors

  Nav items active:
    font-bold text-[#0F172A] border-l-[3px] border-[#FF5C1B] bg-[hsl(220_20%_97%)]
    Remove navy "Active" pill badge — left border is the only active indicator.

  Nav icons: SVG 14x14 strokeWidth 1.8 stroke currentColor

  Count badges:
    ml-auto bg-[#FF5C1B] text-[#1F1308] text-[9px] font-bold rounded-full px-[5px] py-[1px]

  Footer:
    mt-auto border-t border-[#E2E8F0] pt-[10px] px-3
    Avatar: w-[26px] h-[26px] bg-[#FF5C1B] border-[1.5px] border-[#0F172A] rounded-full
    Name: text-[11px] font-bold text-[#0F172A]
    Role: text-[10px] text-[#94A3B8] — profile.trade or "Contractor"
    Show initials from profile.full_name

  BottomNav mobile only:
    fixed bottom-0 left-0 right-0 md:hidden
    bg-white border-t-[1.5px] border-[#0F172A] h-[56px]

TOPBAR authenticated:
  h-[52px] border-b-[1.5px] border-[#0F172A] bg-white px-5
  flex items-center justify-between flex-shrink-0

  Logo:
    Box: w-[30px] h-[30px] bg-[#0F172A] rounded-[7px] flex items-center justify-center
    Wordmark: "Dispatch" + divider (w-px h-[15px] bg-[#94A3B8] mx-2) + "Labs"
    Both: text-[14px] font-bold text-[#0F172A]

  Right:
    Language pill: bg-[#F1F5F9] rounded-full px-3 py-1 text-[12px]
                   flex items-center gap-[5px] — globe SVG + language label
                   NOT a segmented double-button
    User avatar: w-[30px] h-[30px] bg-[#FF5C1B] border-2 border-[#0F172A] rounded-full
                 text-[11px] font-bold text-[#1F1308] — initials from profile.full_name

  Remove dark mode moon icon — not in spec.

Commit: fix(BUG-014): rebuild sidebar and topbar to match dashboard_v4.html

---

### BUG-015 [P1] Settings page missing 6 of 7 required sections
File: find SettingsPage in src/pages/
READ docs/mockups/settings_v2.html before making any changes.
Current state: only has Profile section.

Add sections in this order:

1. Profile (fix layout):
   grid-cols-[160px_1fr_auto] items-center px-[18px] py-[13px] border-b border-[#F1F5F9]
   Fields: First name, Last name, Business name, Trade dropdown, Phone
   Save: bg-[#FF5C1B] text-[#1F1308] border border-[#0F172A] h-[30px] rounded-[5px]

2. Language:
   Segmented EN/FR — active bg-[#0F172A] text-white, inactive bg-white text-[#64748B]
   On change: i18n.changeLanguage()

3. Notifications (4 toggles):
   w-[40px] h-[22px] rounded-full — ON bg-[#0F172A] NAVY, OFF bg-[#CBD5E1]
   Knob: absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full
         ON translate-x-[18px], OFF translate-x-0
   role="switch" aria-checked={isOn} on every button
   Description ON text-[#374151], OFF text-[#94A3B8]
   Defaults: Job approvals ON, Invoice paid ON, Overdue ON, Marketing OFF

4. Billing: subscriptionStatus + trialDaysRemaining from useAuth()
   Use billing.* keys in en.json. Link to /settings/billing.

5. Stripe Connect: profile.stripe_account_id state
   Use settings.stripe.* keys in en.json. Link to /settings/stripe.

6. Password and Security:
   Change email + Reset password rows
   h-[30px] border-[1.5px] border-[#FF5C1B] text-[#FF5C1B] rounded-[5px] px-3

7. Loi 25 / Data privacy:
   Data protection text + Export, Privacy policy, Contact officer buttons
   i18n content already exists in en.json and fr.json

8. Danger zone:
   Section label: text-[#EF4444]
   Card: border-2 border-[#EF4444] shadow-brutal-red rounded-[10px]
   Delete button: text-[#EF4444] border-[1.5px] border-[#EF4444] bg-transparent
   Red is used ONLY HERE. Nowhere else.

Commit: fix(BUG-015): add all missing settings sections per settings_v2.html

---

### BUG-016 [P2] Design polish
Files: tailwind.config.js + components with wrong colours or shadows

1. Add brutal shadow tokens to tailwind.config.js extend.boxShadow (see KEY DESIGN TOKENS)

2. Retry buttons — from red to orange:
   bg-[#FF5C1B] text-[#1F1308] border-2 border-[#0F172A] rounded-[7px]
   h-[36px] px-[13px] text-xs font-bold shadow-brutal

3. New Client button on /clients — from navy fill to orange primary:
   bg-[#FF5C1B] text-[#1F1308] border-2 border-[#0F172A]

4. All section cards — replace soft shadows:
   shadow-brutal border-2 border-[#0F172A] rounded-[9px] overflow-hidden

5. Auth cards: shadow-brutal-auth border-2 border-[#0F172A] rounded-[14px]

6. Hero CTA copy in both locale files:
   en.json: hero.primaryCta = "Create your account"
   fr.json: hero.primaryCta = "Creer votre compte"

Commit: fix(BUG-016): brutal shadows, fix button colours, update CTA copy

---

## AFTER ALL BUGS — update beads ledger

Append this line to .beads/beads.jsonl:
{"id":"bead_009_ui_audit_fixes","title":"UI Audit Fix Run — AbortError, i18n, nav, settings, polish","status":"closed","created_at":"2026-03-19T00:00:00Z","history":["BUG-009: Removed t() from queryFn useCallback deps in useJobs/useClients/useInvoices","BUG-010: Fixed settings.error key to settings.profile.error","BUG-011: Already done — vercel.json rewrite existed","BUG-012: Fixed page titles, removed subtitles, wired first name to greeting","BUG-013: Replaced Client/Property UUID inputs with selectors, removed debug content","BUG-014: Rebuilt sidebar and topbar to match dashboard_v4.html","BUG-015: Added all 8 settings sections per settings_v2.html","BUG-016: Brutal shadow tokens, orange retry buttons, CTA copy"]}

---

## HALLUCINATION PREVENTION — CHECK BEFORE EVERY EDIT

Before editing any file:
  Read the actual source file — never assume its structure
  Read the matching mockup HTML for every UI change
  Check en.json before creating any i18n key — it likely already exists
  Check src/hooks/ before creating a new hook — it likely already exists
  Check src/repositories/ before writing any Supabase query

If about to write a Supabase query in a component — STOP. Use repositories.
If about to hardcode a string — STOP. Add to en.json AND fr.json.
If about to use a soft shadow — STOP. Use shadow-brutal.
If about to use red for non-delete — STOP. Use #FF5C1B orange.
If about to add a new route — STOP. Routes only in src/App.tsx.
