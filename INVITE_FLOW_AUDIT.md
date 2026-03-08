# Invite Flow Audit — Pre-Bead Investigation

> **Purpose:** Answer the two questions raised before writing the next "bead":
> 1. What did the existing "Invite Flow" actually implement?
> 2. Which of the 15 open PRs touch the approval flow, email notifications, or guest pages and could cause conflicts?

---

## Question 1 — What files actually exist?

PR #391 mentioned that Jules "verified existing edge functions and `verify_jwt = false` config". The questions were whether three specific files existed. Here is the ground truth:

### Files asked about vs. what exists

| File asked about | Status | Actual file in repo |
|---|---|---|
| `supabase/functions/send-job-approval/index.ts` | ❌ Does NOT exist | `supabase/functions/send-job-invite/index.ts` |
| `supabase/functions/approve-job/index.ts` | ❌ Does NOT exist | `supabase/functions/respond-to-job-invite/index.ts` |
| `src/pages/JobApprovePage.tsx` | ❌ Does NOT exist | `src/pages/JobApprovalPage.tsx` |

### What the Invite Flow actually includes

The full Invite Flow **is already implemented** in `main`. It covers:

#### Edge Functions (`supabase/functions/`)

| Function | `verify_jwt` | Purpose |
|---|---|---|
| `send-job-invite` | `true` (requires auth) | Contractor calls this to generate a token, update job status to `sent`, and send the invite email via Resend |
| `get-job-by-token` | `false` (public) | Homeowner's browser calls this to load sanitized job details by token |
| `respond-to-job-invite` | `false` (public) | Homeowner calls this with `{ token, action: "approve" }` to approve; uses the `approve_job_via_token` SQL RPC |

#### Database (`supabase/migrations/`)

| Migration | Purpose |
|---|---|
| `20260212150000_create_job_tokens.sql` | Creates the `job_tokens` table with RLS policies |
| `20260212160000_approve_job_via_token.sql` | Creates `approve_job_via_token` RPC — runs as `SECURITY DEFINER`, skips JWT ownership check (token validation is the auth mechanism) |

#### Frontend (`src/`)

| File | Purpose |
|---|---|
| `src/pages/JobApprovalPage.tsx` | Public, unauthenticated guest page at `/jobs/approve/:token` — shows job details and an "Approve Job" button |
| `src/lib/router.tsx` | Centralized route patterns; includes `routePatterns.jobApproval` and `routePaths.jobApproval` |
| `src/App.tsx` | Registers the public `/jobs/approve/:token` route (no `ProtectedRoute` wrapper) |

#### i18n

Both `en.json` and `fr.json` include a complete `jobApproval` namespace with all keys used by `JobApprovalPage.tsx`.

### Summary

The naming discrepancy was the only issue. No new files are needed — the flow is complete under slightly different names:
- `send-job-invite` (not `send-job-approval`)
- `respond-to-job-invite` (not `approve-job`)
- `JobApprovalPage.tsx` (not `JobApprovePage.tsx`)

---

## Question 2 — Which open PRs conflict?

There are **15 open PRs** total. Below is an analysis of each.

### ⚠️ HIGH CONFLICT — Touch approval flow, invite email, or guest pages

These 9 PRs all implement some version of the same "Homeowner Invite Flow" and directly overlap with the existing code:

| PR | Title | Conflict area |
|---|---|---|
| #377 | Implement Job Invite Flow | Edge functions (`invite-homeowner`, `get-job-by-token`, `respond-to-job-invite`), DB tokens, guest page, `JobDetailPage`, i18n |
| #376 | Implement Homeowner Invite Flow | Edge functions, DB tokens, `PublicRepository`, guest page `JobInvitePage`, `JobDetailPage`, routing |
| #375 | Implement Invite Flow & Public Job Access | Edge functions (`invite-homeowner`, `get-job-by-token`, `respond-to-job-invite`), DB tokens, `JobInvitePage`, `JobDetailPage`, routing |
| #374 | Implement Homeowner Invite Flow | Edge functions, DB tokens, `get_job_by_token` RPC, `PublicJobPage`, `JobDetailPage` |
| #373 | Implement Job Invite Flow | Edge functions, `PublicRepository`, `JobInvitePage`, `JobDetailPage`, i18n, type fixes |
| #367 | Implement Invite Flow | Edge functions (`invite-homeowner`, `respond-to-job-invite`), `PublicRepository`, `JobInvitePage`, routing, `JobDetailPage` |
| #366 | Implement Homeowner Invite Flow | Edge functions, DB tokens, guest page, `JobDetailPage` |
| #364 | Implement Homeowner Invite Flow | Edge functions, DB tokens, guest page, `JobDetailPage`, Zod schemas |
| #363 | Implement Homeowner Invite Flow | Edge functions, DB tokens, `approve-job` RPC, guest page, `JobDetailPage` |

**Recommendation:** All 9 of these PRs are **stale/superseded** by the implementation already on `main`. They should be closed before writing the next bead to avoid confusion and merge conflicts.

### ⚠️ SECONDARY IMPACT — Touch related infrastructure

| PR | Title | Impact |
|---|---|---|
| #370 | 🛡️ Sentinel: Fix Open Redirect in Payment Flows | Adds `supabase/functions/_shared/security.ts` and modifies `create-checkout-session` / `create-portal-session` Edge Functions. Does not touch invite/approval functions directly, but modifies shared infrastructure. |
| #369 | ⚡ Bolt: Optimize JobRepository.update | Changes `src/repositories/jobRepository.ts`. Could conflict if a new bead also modifies the job update path. |
| #368 | Refactor Zod Schemas for Strict Localization | Changes all Zod schema files in `src/schemas/`. Could conflict if the new bead adds schema fields. |

### ✅ LOW RISK — Unrelated to approval/invite

| PR | Title | Notes |
|---|---|---|
| #393 | [WIP] Verify file paths exist and correct naming conventions | Investigation/doc PR, no code changes expected |
| #392 | Fix test failures and pass environment checks | Fixes `@types/node`, removes a redundant test file — low risk |
| #394 | [WIP] Investigate existing files for invite flow and approval process | **This PR** |

---

## Architecture Notes for the Next Bead

1. **Invite URL** is hardcoded in the `send-job-invite` edge function as `${SITE_URL}/jobs/approve/${token}`. This matches `routePatterns.jobApproval` added to `src/lib/router.tsx`.
2. **Public route** `/jobs/approve/:token` is registered in `App.tsx` with no `ProtectedRoute` wrapper and renders inside a minimal public shell (header + language switcher only).
3. **Token expiry**: 7 days, enforced in both `get-job-by-token` and `respond-to-job-invite` edge functions.
4. **State machine**: `approve_job_via_token` RPC enforces `sent → approved` transition via the existing `is_valid_job_transition` function. Trying to approve a job not in `sent` status returns an error.
5. **Contractor notification**: `respond-to-job-invite` sends a "Job Approved" email to the contractor via Resend after a successful approval.
