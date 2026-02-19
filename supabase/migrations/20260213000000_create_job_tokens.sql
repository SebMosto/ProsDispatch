-- 1. Enums
create type job_token_status as enum (
  'pending',
  'viewed',
  'accepted',
  'declined'
);

-- 2. Job Tokens Table
create table job_tokens (
  token uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  status job_token_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index job_tokens_job_id_idx on job_tokens(job_id);
create index job_tokens_status_idx on job_tokens(status);

-- 3. RLS
alter table job_tokens enable row level security;

-- Contractors can view tokens for their own jobs
create policy "job_tokens_select_own"
  on job_tokens for select
  using (
    exists (
      select 1
      from jobs
      where jobs.id = job_tokens.job_id
        and jobs.contractor_id = auth.uid()
    )
  );

-- Service Role can do everything (default bypass RLS, but explicitly allowing if needed)
-- (No explicit policy needed for service role as it bypasses RLS)
