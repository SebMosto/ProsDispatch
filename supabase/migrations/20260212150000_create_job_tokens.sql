create table job_tokens (
  token text primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  opened_at timestamptz
);

-- Enable RLS
alter table job_tokens enable row level security;

-- Contractor can see/manage tokens for their jobs
create policy "job_tokens_select_own"
  on job_tokens for select
  using (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

create policy "job_tokens_insert_own"
  on job_tokens for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

create policy "job_tokens_delete_own"
  on job_tokens for delete
  using (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

-- Indexes
create index job_tokens_job_id_idx on job_tokens(job_id);
