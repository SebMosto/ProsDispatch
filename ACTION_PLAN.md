# Action Plan: Repository Decision Matrix

This document provides concrete, actionable steps based on your decision.

---

## Decision Tree

```
START HERE
    ↓
Do you have 2-3 weeks for a clean rebuild?
    ↓                           ↓
   YES                         NO
    ↓                           ↓
→ RESTART                  Can you spend 45-60 hours refactoring?
  (Recommended)                 ↓                    ↓
                              YES                   NO
                               ↓                    ↓
                          → CONTINUE           → PAUSE & REASSESS
                         (High risk)          (Get more resources)
```

---

## Path A: RESTART (Recommended)

### Prerequisites
- [ ] Secure 2-3 weeks of focused development time
- [ ] Access to Lovable/Cursor/Copilot for AI scaffolding
- [ ] Stripe Connect account (or test mode)
- [ ] Supabase project (free tier is fine)

### Week 1: Planning & Foundation (8-10 hours)

#### Day 1-2: PRD & Architecture (3 hours)
```markdown
Task: Write MVP1 Product Requirements Document

Template:
1. Product Overview
   - Canada-only contractor job management
   - Direct booking (no marketplace)
   - Stripe Connect Standard for direct charges
   
2. Core Features (MVP1 ONLY)
   - Contractor registration & profile
   - Job creation (by contractors)
   - Direct job assignment (via link/invitation)
   - Payment processing (Stripe Direct Charges)
   - Email notifications (bilingual EN/FR)
   
3. Explicitly OUT OF SCOPE for MVP1
   - ❌ Homeowners
   - ❌ Job proposals/bidding
   - ❌ Escrow payments
   - ❌ Stored payment methods
   - ❌ Marketplace browsing
   
4. Tech Stack
   - Frontend: Vite + React 18 + TypeScript
   - Backend: Supabase (PostgreSQL + Auth + Storage)
   - Payments: Stripe Connect Standard
   - UI: Tailwind + shadcn/ui
   - State: React Context + TanStack Query
   
5. Database Schema (minimal)
   - profiles (role: contractor only)
   - jobs (homeowner_id can be null for MVP1)
   - job_assignments (direct booking)
   - payment_transactions (Stripe charges)
```

**Deliverable:** `docs/MVP1_PRD.md` (2-3 pages)

#### Day 3: Scaffold New Repository (2 hours)
```bash
# Option 1: Use Lovable template
# Go to lovable.dev → New Project → Vite + React + Supabase template

# Option 2: Manual scaffold
npm create vite@latest dispatch-mvp1 -- --template react-ts
cd dispatch-mvp1
npm install

# Add core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install @tanstack/react-query
npm install zod react-hook-form @hookform/resolvers
npm install tailwindcss@latest postcss autoprefixer
npm install -D @types/node

# Initialize Tailwind
npx tailwindcss init -p
```

**Deliverable:** Clean Vite project with zero lines of business logic

#### Day 4-5: Copy Reusable Modules (3-5 hours)
```bash
# From OLD repo → NEW repo
# Copy these directories/files:

# UI Components (high value)
cp -r old-repo/src/components/ui/ new-repo/src/components/ui/
cp old-repo/tailwind.config.ts new-repo/
cp old-repo/components.json new-repo/

# Security utilities (reusable)
cp -r old-repo/src/utils/security/ new-repo/src/utils/security/
cp -r old-repo/src/utils/auth/security/ new-repo/src/utils/auth/security/

# Schemas (Zod validators)
cp -r old-repo/src/schemas/ new-repo/src/schemas/
# REVIEW and remove proposal-related schemas

# i18n (if needed)
cp -r old-repo/src/i18n/ new-repo/src/i18n/

# Configuration
cp old-repo/vitest.config.ts new-repo/
cp old-repo/playwright.config.ts new-repo/
cp old-repo/.prettierrc new-repo/
cp old-repo/.lintstagedrc new-repo/

# Documentation
cp old-repo/ACCESSIBILITY.md new-repo/
cp old-repo/SECURITY.md new-repo/
cp old-repo/TESTING.md new-repo/
```

**Manual Review Required:**
- Remove any imports of `@supabase/auth-helpers-nextjs`
- Update Supabase client creation to use `@supabase/supabase-js` only
- Check for any proposal/bidding logic in copied files

**Deliverable:** Clean repo with reusable utilities, no business logic yet

### Week 2: Core MVP1 Features (15-20 hours)

#### Day 6-7: Authentication & Profiles (5 hours)
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
    },
  }
);

// No createServerComponentClient!
```

**Tasks:**
- [ ] Setup Supabase client with env vars
- [ ] Create auth context (email/password + 2FA)
- [ ] Build registration flow (contractors only)
- [ ] Build login/logout
- [ ] Copy rate limiting from old repo
- [ ] Copy security logging from old repo

**Database:**
```sql
-- profiles table (contractors only for now)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'contractor',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Day 8-10: Job Management (5 hours)
```typescript
// src/types/job.ts
export type Job = {
  id: string;
  title: string;
  description: string;
  contractor_id: string; // Creator (no homeowner in MVP1)
  location: string;
  budget?: number;
  status: 'draft' | 'open' | 'assigned' | 'completed';
  created_at: string;
};

// NO bid_amount, NO proposals!
```

**Tasks:**
- [ ] Create jobs table (no homeowner_id required)
- [ ] Build job creation form
- [ ] Build job list view
- [ ] Build job detail view
- [ ] NO proposals component

**Database:**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  contractor_id UUID REFERENCES auth.users(id) NOT NULL,
  location TEXT NOT NULL,
  budget DECIMAL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Day 11-12: Direct Booking (3 hours)
```typescript
// src/types/assignment.ts
export type JobAssignment = {
  id: string;
  job_id: string;
  assigned_to: string; // Contractor UUID
  assigned_by: string; // Creator UUID
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
};

// Direct assignment, no bidding!
```

**Tasks:**
- [ ] Create job_assignments table
- [ ] Build "assign job" flow (via email link)
- [ ] Build acceptance/rejection UI
- [ ] NO proposal submission form

#### Day 13-14: Payments (5 hours)
```typescript
// src/lib/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

// Direct charges only, NO escrow!
```

**Tasks:**
- [ ] Setup Stripe Connect Standard
- [ ] Build onboarding flow for contractors
- [ ] Create direct charge flow (homeowner pays directly to contractor's Stripe account)
- [ ] Build payment status tracking
- [ ] NO escrow, NO payment holding

**Database:**
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Week 3: Polish & Testing (8-12 hours)

#### Day 15-16: Bilingual Support (3 hours)
- [ ] Setup i18n (copy from old repo)
- [ ] Translate core strings (EN/FR)
- [ ] Test language switching

#### Day 17-18: Accessibility (3 hours)
- [ ] Run axe-core on all pages
- [ ] Fix WCAG 2.1 AA violations
- [ ] Test keyboard navigation
- [ ] Test screen reader

#### Day 19-20: Testing (4 hours)
- [ ] Write unit tests for utilities
- [ ] Write integration tests for job flows
- [ ] Write E2E tests for critical paths
- [ ] Run full test suite

#### Day 21: Deploy (2 hours)
- [ ] Setup Vercel project
- [ ] Configure environment variables
- [ ] Deploy to production
- [ ] Test live app

### Success Criteria
✅ Contractor can register, create profile  
✅ Contractor can create job  
✅ Contractor can invite another contractor via link  
✅ Invited contractor can accept/reject assignment  
✅ Payment flows via Stripe Connect (direct charges)  
✅ All text is bilingual (EN/FR)  
✅ WCAG 2.1 AA compliant  
✅ Zero TypeScript errors  
✅ All tests passing  

**Result:** Clean, spec-compliant MVP1 in 3 weeks

---

## Path B: CONTINUE (High Risk)

### Prerequisites
- [ ] 45-60 hours available for deep refactoring
- [ ] Willingness to accept risk of incomplete fixes
- [ ] Backup plan if refactoring fails

### Phase 1: Critical Fixes (15-20 hours)

#### Fix 1: Remove Next.js Dependencies (4 hours)
```bash
# Uninstall Next.js packages
npm uninstall @supabase/auth-helpers-nextjs @supabase/auth-helpers-shared

# Install correct packages
npm install @supabase/ssr@latest

# Files to update:
# - src/integrations/supabase/server.ts (DELETE THIS FILE)
# - src/integrations/supabase/client.ts (use createClient only)
# - src/tests/security/SupabaseServerClient.integration.test.ts (DELETE)
```

**Steps:**
1. Search codebase for `createServerComponentClient` - delete all usages
2. Search for `@supabase/auth-helpers-nextjs` imports - replace with `@supabase/supabase-js`
3. Update all auth flows to use client-side Supabase only
4. Test login/logout/registration flows

**Risk:** May break existing auth flows if server-side auth was actually being used somewhere

#### Fix 2: Environment Variables (2 hours)
```typescript
// Before (WRONG):
const SUPABASE_URL = "https://sroktrqzvksllsrmmcfd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOi...";

// After (CORRECT):
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}
```

**Steps:**
1. Move hardcoded values to `.env`
2. Update `src/integrations/supabase/client.ts`
3. Ensure `.env` is in `.gitignore`
4. **CRITICAL:** Rotate Supabase keys (old ones are exposed in git history)

#### Fix 3: Delete Proposals System (6 hours)
```bash
# Delete these directories:
rm -rf src/utils/jobs/proposals/
rm -rf src/components/jobs/proposals/
rm -rf src/contexts/jobs/hooks/proposals/

# Delete these files:
rm src/components/jobs/SubmitProposalCard.tsx

# Update database:
# - Write migration to drop job_proposals table
# - Update RLS policies
```

**Steps:**
1. Identify all imports of proposal-related code
2. Refactor JobContext to remove proposal actions
3. Update job detail pages to remove proposal UI
4. Delete proposal components
5. Create Supabase migration to drop `job_proposals` table
6. Test that job flows still work without proposals

**Risk:** HIGH - This will break many components. Budget 6+ hours for this alone.

#### Fix 4: Fix package.json (1 hour)
```json
// Remove duplicate scripts:
"scripts": {
  "ci": "npm run verify:ui-registry && npm run check:no-next && npm run lint:ci && npm run typecheck && npm run test:ci",
  "ci:full": "npm run check:no-next && npm run lint:ci && npm run typecheck && npm run test:ci && npm run build",
  // Only keep the second definitions
}
```

#### Fix 5: Update Dependencies (2 hours)
```bash
# Update deprecated packages
npm uninstall react-beautiful-dnd
npm install @dnd-kit/core @dnd-kit/sortable # If drag-drop needed

# Fix security vulnerabilities
npm audit fix

# Update Supabase packages
npm install @supabase/supabase-js@latest @supabase/ssr@latest
```

### Phase 2: Architectural Refactors (20-30 hours)

#### Refactor 6: Standardize Data Fetching (10 hours)
Choose ONE pattern and refactor all data access:

**Option A: React Query + Supabase**
```typescript
// Example: src/hooks/useJobs.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
```

**Steps:**
1. Audit all Supabase queries in codebase (100+ files)
2. Create custom hooks for each data access pattern
3. Refactor components to use hooks instead of direct queries
4. Remove direct supabase.from() calls from components

**Risk:** VERY HIGH - This touches 100+ files and can introduce bugs

#### Refactor 7: Remove Escrow References (2 hours)
```bash
# Already has guards, but clean up:
rm src/payments/escrow.ts
# Update stripeUtils.ts to remove deprecated functions
```

#### Refactor 8: Scope to Contractors (4 hours)
```bash
# Move homeowner features to separate directory:
mkdir src/pages/future/homeowner/
mv src/pages/jobs/CreateJob.tsx src/pages/future/homeowner/ # If homeowner-specific

# Update routing to exclude homeowner pages
# Update database to make homeowner_id nullable
```

#### Refactor 9: Implement Direct Charges (8 hours)
```typescript
// Build Stripe Connect Standard flow
// - Contractor onboarding
// - Direct payment intent creation
// - Webhook handling
// - Payment status tracking
```

**Steps:**
1. Setup Stripe Connect Standard accounts
2. Build onboarding UI
3. Create payment intent API
4. Handle webhooks
5. Test end-to-end payment flow

#### Refactor 10: Add Geo-fencing (2 hours)
```typescript
// Enforce Canada-only in registration
const validateLocation = (postalCode: string) => {
  const canadianPostalCodeRegex = /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i;
  if (!canadianPostalCodeRegex.test(postalCode)) {
    throw new Error('Only Canadian postal codes are accepted');
  }
};
```

### Phase 3: Testing & Validation (10 hours)
- [ ] Run full test suite
- [ ] Manual testing of all flows
- [ ] Security audit
- [ ] Performance testing
- [ ] Accessibility audit

### Success Criteria (CONTINUE Path)
✅ No Next.js imports remaining  
✅ All credentials in environment variables  
✅ Proposals system completely removed  
✅ Tests passing  
✅ Build succeeds  
✅ Direct Charges implemented  
✅ Canada-only enforced  

**Risk Assessment:**
- ⚠️ **High risk** of introducing new bugs
- ⚠️ **High effort** (45-60 hours)
- ⚠️ **Uncertain outcome** (may still have hidden issues)
- ⚠️ **No guarantee** of finding all problems

---

## Path C: PAUSE & REASSESS

If you have neither:
- 2-3 weeks for clean rebuild, NOR
- 45-60 hours for refactoring

**Recommended Actions:**
1. Pause feature development
2. Secure resources (time/budget/team)
3. Make decision: RESTART vs. CONTINUE
4. Schedule dedicated sprint for chosen path

**Don't:** Try to incrementally fix while adding features (recipe for disaster)

---

## Decision Matrix

| Factor | RESTART | CONTINUE |
|--------|---------|----------|
| **Time Required** | 20-30 hours | 45-60 hours |
| **Risk Level** | Low | High |
| **Code Quality** | Excellent | Moderate |
| **Future Maintainability** | High | Low |
| **Learning Curve** | Low (clean patterns) | High (understand debt) |
| **AI Tool Effectiveness** | High | Medium |
| **Spec Alignment** | 100% (build to PRD) | Unknown |
| **Technical Debt** | Zero | Reduced but not eliminated |

**Recommendation:** RESTART wins on every metric except "sunk cost fallacy"

---

## Next Steps

1. **Read this document** ✅ You are here
2. **Choose a path:** RESTART, CONTINUE, or PAUSE
3. **If RESTART:** Start with Week 1, Day 1 (Write PRD)
4. **If CONTINUE:** Start with Fix 1 (Remove Next.js)
5. **If PAUSE:** Schedule planning session

**Need Help?**
- Full analysis: See `REPO_AUDIT_REPORT.md`
- Quick summary: See `AUDIT_SUMMARY.md`

---

**This action plan provides concrete, executable steps. Choose your path and execute systematically.**
