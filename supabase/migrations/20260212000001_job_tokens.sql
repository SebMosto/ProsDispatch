-- Create job_tokens table
create table job_tokens (
  token uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  status text not null check (status in ('pending', 'used', 'expired')) default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

-- Index for performance
create index job_tokens_job_id_idx on job_tokens(job_id);
create index job_tokens_token_idx on job_tokens(token);

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

-- Policy: Contractor can create tokens for their own jobs
create policy "job_tokens_insert_own"
  on job_tokens for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

-- Note: Public access (Service Role) will bypass RLS in Edge Functions
