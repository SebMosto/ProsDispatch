-- 1. Profiles additions
alter table public.profiles
  add column stripe_customer_id text,
  add column subscription_status text not null default 'incomplete',
  add column subscription_end_date timestamptz;

alter table public.profiles
  add constraint profiles_stripe_customer_id_key unique (stripe_customer_id);

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'unpaid',
    'paused'
  ));

-- Index for subscription_status (checked on every authenticated route)
create index profiles_subscription_status_idx on public.profiles (subscription_status);

-- 2. Stripe events table
create table public.stripe_events (
  id text primary key,
  type text not null,
  event_created_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  status text not null default 'pending',
  constraint stripe_events_status_check check (status in ('pending', 'processed', 'failed'))
);

-- 3. RLS for profiles billing fields
-- 
-- SECURITY: Billing fields (stripe_customer_id, subscription_status, subscription_end_date)
-- must ONLY be writable by service_role (webhook handlers), not by authenticated users.
-- 
-- Per SPEC-005 §3.4: "Stripe is canonical" - these fields mirror Stripe state via webhooks.
-- Allowing user updates would enable self-service privilege escalation (e.g., marking 
-- subscription_status='active' to bypass paywall).
--
-- Strategy:
-- 1. Recreate user update policy with CHECK constraint that blocks billing field changes
-- 2. Add service_role-only policy for webhook handlers to update billing fields

drop policy if exists "Users can update own profile" on public.profiles;

-- Users can update their own profile, but NOT billing fields
-- The WITH CHECK clause ensures the new values match the current values for billing fields
create policy "Users can update own profile" on public.profiles
  for update 
  using (auth.uid() = id)
  with check (
    -- Prevent users from modifying billing fields by requiring new values match current values
    -- Using "IS NOT DISTINCT FROM" to handle NULL values correctly
    -- Single subquery for performance (avoids multiple table scans)
    (stripe_customer_id, subscription_status, subscription_end_date) is not distinct from 
    (select stripe_customer_id, subscription_status, subscription_end_date 
     from public.profiles 
     where id = auth.uid())
  );

-- Service role can update billing fields (for webhook handlers)
create policy "Service role can update billing fields" on public.profiles
  for update
  to service_role
  using (true)
  with check (true);

-- 4. RLS for stripe_events
alter table public.stripe_events enable row level security;

create policy "stripe_events_service_role_only"
  on public.stripe_events
  for all
  to service_role
  using (true)
  with check (true);
