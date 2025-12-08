# SPEC-001: Auth & Profiles (Foundation)

**Status:** APPROVED
**Phase:** 1.1
**Owner:** Codex (Implementation) / Gemini (Audit)

## 1. Feature Summary
Establish the core Authentication and User Profile system for **Contractors Only**.
This includes Sign Up, Sign In (Email/Password), Logout, and the creation of a public `profiles` table that mirrors `auth.users`.

## 2. Canonical Constraints
* **Stack:** Supabase Auth (Client-side PKCE), React Context.
* **Role:** `contractor` (Hardcoded for MVP1). Homeowners are guest-only (no auth).
* **Data Residency:** No constraints for MVP1 dev, but prepared for future.
* **Forbidden:** Server-side auth helpers (`@supabase/ssr`), Next.js patterns, third-party auth providers (Google/Facebook) for MVP1.

## 3. Data Model (Schema)

### Table: `profiles`
* `id` (uuid, PK, FK -> `auth.users.id`)
* `email` (text, unique, not null)
* `full_name` (text, nullable)
* `business_name` (text, nullable)
* `role` (text, default 'contractor')
* `created_at` (timestamptz)
* `updated_at` (timestamptz)

### RLS Policies
1.  **SELECT:** Users can view their own profile.
2.  **UPDATE:** Users can update their own profile.
3.  **INSERT:** Triggered automatically via Postgres Function on `auth.users` creation (Safety net).

## 4. Functional Requirements

### F1. Sign Up (Contractor)
* User enters Email, Password, Full Name, Business Name.
* System creates `auth.user`.
* System automatically creates `public.profiles` row via Database Trigger.
* **Constraint:** Prevent signups if user is not intended to be a contractor (implicit for MVP1 site).

### F2. Sign In
* Standard Email/Password flow using `supabase.auth.signInWithPassword`.
* On success, redirect to `/dashboard`.

### F3. Auth Context (Global State)
* Create `AuthProvider` wrapping the app.
* Expose `user`, `profile`, `loading`, `signOut`.
* Handle session persistence via `supabase-js` default behavior (Local Storage).

### F4. Protected Routes
* Create `<ProtectedRoute>` layout wrapper.
* Redirect unauthenticated users to `/login`.
* Redirect authenticated users away from `/login` to `/dashboard`.

## 5. Security & Compliance
* **PII:** Email and Names are PII. RLS must strictly isolate this data.
* **Audit:** All auth events are logged by Supabase automatically.
* **Direct Charges:** No impact on payments yet (Foundation only).

## 6. Implementation Plan (Codex)
1.  **DB:** Create `profiles` table and `handle_new_user` trigger in Supabase.
2.  **RLS:** Apply strict policies to `profiles`.
3.  **Types:** Generate TypeScript definitions for the database.
4.  **UI:** Build `SignUpForm`, `SignInForm` using shadcn/ui.
5.  **Logic:** Build `AuthContext.tsx` and `ProtectedRoute.tsx`.
6.  **Route:** Wire up `/login`, `/register`, `/dashboard`.

## 7. Acceptance Criteria
* [ ] I can sign up with a new email.
* [ ] I am redirected to Dashboard after signup.
* [ ] My data appears in the `profiles` table.
* [ ] I cannot access Dashboard without logging in.
* [ ] I cannot view another user's profile data.
