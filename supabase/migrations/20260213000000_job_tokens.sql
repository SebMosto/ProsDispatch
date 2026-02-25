-- 1. Job Tokens Table (for Homeowner Invite Links)
create table job_tokens (
  token uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'used', 'expired'
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '7 days')
);

-- Index for performance
create index job_tokens_job_id_idx on job_tokens(job_id);
create index job_tokens_token_idx on job_tokens(token);

-- RLS
alter table job_tokens enable row level security;

-- Policy: Contractor can manage tokens for their own jobs (Create, Read, Update, Delete)
create policy "job_tokens_all_own"
  on job_tokens for all
  using (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

-- Note: Public access to validate tokens is handled via Edge Functions using service_role key.
