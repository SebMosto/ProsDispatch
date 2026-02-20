-- 1. Create Job Tokens Table
create table job_tokens (
  token uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now() + interval '7 days')
);

-- 2. Indexes for Performance
create index job_tokens_job_id_idx on job_tokens(job_id);

-- 3. Security & RLS
alter table job_tokens enable row level security;

-- Policy: Contractor can only insert tokens for their own jobs
create policy "job_tokens_insert_own"
  on job_tokens for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

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

-- Policy: Contractor can delete tokens for their own jobs
create policy "job_tokens_delete_own"
  on job_tokens for delete
  using (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

-- Note: Public access (SELECT) will be handled via "security definer" functions
-- or Service Role in Edge Functions, not direct table RLS policies for anonymous users.
