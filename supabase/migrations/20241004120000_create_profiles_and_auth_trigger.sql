-- ============================================================================
-- MIGRATION: Create Profiles Table and Auth Triggers
-- ============================================================================
-- Purpose: Establish user profile management with automatic profile creation
--          when new users sign up via Supabase Auth.
--
-- Features:
--   1. Profiles table linked to auth.users with cascade delete
--   2. Auto-population trigger on user signup
--   3. Auto-updating timestamp trigger on profile updates
--   4. Row Level Security (RLS) policies for data isolation
--
-- Idempotency: This migration can be run multiple times safely.
--              All operations use IF EXISTS/IF NOT EXISTS clauses.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Clean up existing objects (proper dependency order)
-- ----------------------------------------------------------------------------
-- Drop triggers first (they depend on functions)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists set_profile_updated_at on public.profiles;

-- Drop functions (they may be referenced by policies or triggers)
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_profile_updated_at() cascade;

-- Drop all possible policy variations to ensure clean slate
-- (Handles cases where policy names may have changed over time)
-- Note: Using explicit list rather than dynamic query to avoid accidentally
--       dropping policies that should be kept in future versions
do $policy_cleanup$
begin
  -- Drop all existing policies on profiles table
  drop policy if exists "Users can view own profile" on public.profiles;
  drop policy if exists "Users can update own profile" on public.profiles;
  drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
  drop policy if exists "Enable read access for users based on user_id" on public.profiles;
  drop policy if exists "Enable update for users based on user_id" on public.profiles;
end $policy_cleanup$;

-- ----------------------------------------------------------------------------
-- STEP 2: Create or update profiles table
-- ----------------------------------------------------------------------------
-- Table stores contractor profile information mirroring auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  business_name text,
  role text not null default 'contractor',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Enable Row Level Security on profiles table
alter table public.profiles enable row level security;

-- ----------------------------------------------------------------------------
-- STEP 3: Create functions for automated profile management
-- ----------------------------------------------------------------------------

-- Function: Auto-create profile when new user signs up
-- Security: Runs with elevated privileges (security definer) to bypass RLS
-- Note: Uses ON CONFLICT DO UPDATE to keep email in sync if user already exists
--       For MVP1, all users are contractors (role is not updated on conflict)
--       Extracts full_name and business_name from user metadata if provided
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $func$
begin
  insert into public.profiles (id, email, full_name, business_name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'business_name', null),
    'contractor'
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = timezone('utc', now());
  return new;
end;
$func$;

-- Function: Auto-update timestamp when profile is modified
-- Security: Runs with elevated privileges (security definer) to bypass RLS during automated updates
-- Purpose: Maintains data integrity by tracking when profiles are last modified
create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $func$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$func$;

-- ----------------------------------------------------------------------------
-- STEP 4: Create triggers to execute functions automatically
-- ----------------------------------------------------------------------------

-- Trigger: Execute handle_new_user() after auth.users insert
-- This ensures every new signup automatically gets a profile row
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Trigger: Execute set_profile_updated_at() before profile updates
-- This maintains the updated_at timestamp automatically
create trigger set_profile_updated_at
  before update on public.profiles
  for each row 
  execute function public.set_profile_updated_at();

-- ----------------------------------------------------------------------------
-- STEP 5: Create Row Level Security (RLS) policies
-- ----------------------------------------------------------------------------
-- These policies ensure contractors can only access their own profile data
-- following the principle of least privilege.

-- Policy: Allow users to view their own profile only
create policy "Users can view own profile" on public.profiles
  for select 
  using (auth.uid() = id);

-- Policy: Allow users to update their own profile only
-- The WITH CHECK clause ensures users can't change their profile ID
create policy "Users can update own profile" on public.profiles
  for update 
  using (auth.uid() = id) 
  with check (auth.uid() = id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Verification Steps (run these manually after migration):
--   1. SELECT * FROM public.profiles; -- Should be accessible only to owner
--   2. INSERT INTO auth.users (...); -- Should auto-create profile
--   3. UPDATE public.profiles SET full_name = 'Test'; -- Should auto-update timestamp
-- ============================================================================
