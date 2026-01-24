-- 1. Profiles additions
-- We add these first so they exist for the policy check later
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text not null default 'incomplete',
  add column if not exists subscription_end_date timestamptz;

-- Add constraints (safe to re-run due to unique names)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_stripe_customer_id_key') then
    alter table public.profiles add constraint profiles_stripe_customer_id_key unique (stripe_customer_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_subscription_status_check') then
    alter table public.profiles add constraint profiles_subscription_status_check
    check (subscription_status in (
      'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused'
    ));
  end if;
end $$;

-- Index for subscription_status
create index if not exists profiles_subscription_status_idx on public.profiles (subscription_status);

-- 2. Stripe events table
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  event_created_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  status text not null default 'pending',
  constraint stripe_events_status_check check (status in ('pending', 'processed', 'failed'))
);

-- 3. RLS for profiles billing fields
-- FIXED: Using ROW() comparisons to avoid SQLSTATE 42601 error

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile" on public.profiles
  for update 
  using (auth.uid() = id)
  with check (
    -- Prevent users from modifying billing fields by requiring new values match current values.
    -- We use ROW() explicitly to ensure we are comparing a composite value to a composite value.
    ROW(stripe_customer_id, subscription_status, subscription_end_date) IS NOT DISTINCT FROM
    (
      select ROW(stripe_customer_id, subscription_status, subscription_end_date)
      from public.profiles
      where id = auth.uid()
    )
  );

-- Service role can update billing fields (for webhook handlers)
drop policy if exists "Service role can update billing fields" on public.profiles;
create policy "Service role can update billing fields" on public.profiles
  for update
  to service_role
  using (true)
  with check (true);

-- 4. RLS for stripe_events
alter table public.stripe_events enable row level security;

drop policy if exists "stripe_events_service_role_only" on public.stripe_events;
create policy "stripe_events_service_role_only"
  on public.stripe_events
  for all
  to service_role
  using (true)
  with check (true);
