-- 1. Job Tokens Table
create table if not exists job_tokens (
  token text primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  opened_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists job_tokens_job_id_idx on job_tokens(job_id);

-- 2. RLS
alter table job_tokens enable row level security;

-- Policies
drop policy if exists "job_tokens_select_own" on job_tokens;
create policy "job_tokens_select_own" on job_tokens for select
  using (exists (select 1 from jobs where jobs.id = job_tokens.job_id and jobs.contractor_id = auth.uid()));

drop policy if exists "job_tokens_insert_own" on job_tokens;
create policy "job_tokens_insert_own" on job_tokens for insert
  with check (exists (select 1 from jobs where jobs.id = job_tokens.job_id and jobs.contractor_id = auth.uid()));

drop policy if exists "job_tokens_delete_own" on job_tokens;
create policy "job_tokens_delete_own" on job_tokens for delete
  using (exists (select 1 from jobs where jobs.id = job_tokens.job_id and jobs.contractor_id = auth.uid()));

-- 3. Public Access Function
create or replace function public.get_job_by_token(access_token text)
returns setof jobs
language sql
security definer set search_path = public
as $func$
  with touched as (
    update job_tokens
    set opened_at = coalesce(opened_at, timezone('utc', now()))
    where token = access_token
      and expires_at > timezone('utc', now())
    returning job_id
  )
  select jobs.*
  from jobs
  join touched on touched.job_id = jobs.id;
$func$;
