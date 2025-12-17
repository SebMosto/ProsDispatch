-- 1. CLEANUP: Drop existing objects (Safe Mode)
-- We use a DO block to ensure we don't try to drop triggers/policies on a missing table
do $$
begin
  -- Only attempt to drop objects if the 'profiles' table actually exists
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'profiles') then
    drop trigger if exists set_profile_updated_at on public.profiles;
    drop policy if exists "Users can view own profile" on public.profiles;
    drop policy if exists "Users can update own profile" on public.profiles;
  end if;
end $$;

-- Drop auth trigger (auth.users always exists, so this is safe)
drop trigger if exists on_auth_user_created on auth.users;

-- Drop functions (Safe to drop if exists)
drop function if exists public.handle_new_user();
drop function if exists public.set_profile_updated_at();


-- 2. TABLE: Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  business_name text,
  role text not null default 'contractor',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Enable RLS immediately
alter table public.profiles enable row level security;


-- 3. FUNCTIONS: Handle new user creation
-- Uses CREATE OR REPLACE for idempotency
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
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'business_name', 
    'contractor'
  )
  on conflict (id) do update set
    email = excluded.email,
    -- Only update name/business if new data is provided, otherwise keep existing
    full_name = coalesce(excluded.full_name, profiles.full_name),
    business_name = coalesce(excluded.business_name, profiles.business_name),
    updated_at = timezone('utc', now());
  return new;
end;
$func$;


-- 4. TRIGGER: Wire up the handle_new_user function
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- 5. FUNCTION: Auto-update timestamp
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


-- 6. TRIGGER: Wire up the timestamp function
create trigger set_profile_updated_at
  before update on public.profiles
  for each row 
  execute function public.set_profile_updated_at();


-- 7. POLICIES: Create RLS policies
-- We already dropped these safely in Step 1, so we can just create them now
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
