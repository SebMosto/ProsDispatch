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

-- 2. Stripe events table
create table public.stripe_events (
  id text primary key,
  type text not null,
  event_created_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  status text not null default 'pending',
  constraint stripe_events_status_check check (status in ('pending', 'processed', 'failed'))
);

-- 3. RLS
alter table public.stripe_events enable row level security;

create policy "stripe_events_service_role_only"
  on public.stripe_events
  for all
  to service_role
  using (true)
  with check (true);
