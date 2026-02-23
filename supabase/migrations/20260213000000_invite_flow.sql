-- Enable pgcrypto for random bytes generation if not already enabled
create extension if not exists "pgcrypto";

-- 1. Job Tokens Table (Secure Guest Access)
create type token_status as enum ('active', 'used', 'expired');

create table job_tokens (
  token text primary key default encode(gen_random_bytes(16), 'hex'),
  job_id uuid not null references jobs(id) on delete cascade,
  status token_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now() + interval '7 days')
);

-- Index for performance
create index job_tokens_job_id_idx on job_tokens(job_id);
create index job_tokens_status_idx on job_tokens(status);

-- RLS
alter table job_tokens enable row level security;

-- Policy: Contractors can view tokens for their own jobs
create policy "job_tokens_select_own"
  on job_tokens for select
  using (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

-- Policy: Contractors can create tokens for their own jobs
create policy "job_tokens_insert_own"
  on job_tokens for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );
