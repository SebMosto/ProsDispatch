-- Create Job Tokens Table
create table job_tokens (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  token text not null unique,
  status text not null default 'active' check (status in ('active', 'used', 'expired')),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now() + interval '7 days')
);

-- Index for Token Lookup
create index job_tokens_token_idx on job_tokens(token);
create index job_tokens_job_id_idx on job_tokens(job_id);

-- Enable RLS
alter table job_tokens enable row level security;

-- Policy: Contractor can view tokens for their own jobs
create policy "job_tokens_select_own"
  on job_tokens for select
  using (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

-- Policy: Service Role can do everything (default, but good to be explicit if needed, though service_role bypasses RLS)
-- No explicit policy needed for service_role as it bypasses RLS.
