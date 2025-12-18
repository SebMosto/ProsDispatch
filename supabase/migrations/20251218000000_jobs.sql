-- 1. Create Enum for Job Status
create type job_status as enum (
  'draft',
  'sent',
  'approved',
  'in_progress',
  'completed',
  'invoiced',
  'paid',
  'archived'
);

-- 2. Jobs Table (With Soft Delete)
create table jobs (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references auth.users(id),
  client_id uuid not null references clients(id),
  property_id uuid not null references properties(id),
  
  title text not null,
  description text,
  
  status job_status not null default 'draft',
  
  service_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- Soft Delete for Tax Integrity
);

-- 3. Indexes for Performance
create index jobs_contractor_id_idx on jobs(contractor_id);
create index jobs_client_id_idx on jobs(client_id);
create index jobs_property_id_idx on jobs(property_id);
create index jobs_status_idx on jobs(status);

-- 4. Security & RLS (Row Level Security)
alter table jobs enable row level security;

-- Policy: Contractor can only select their own jobs
create policy "jobs_select_own"
  on jobs for select
  using (auth.uid() = contractor_id);

-- Policy: Contractor can only insert jobs with their own contractor_id
create policy "jobs_insert_own"
  on jobs for insert
  with check (auth.uid() = contractor_id);

-- Policy: Contractor can only update their own jobs
create policy "jobs_update_own"
  on jobs for update
  using (auth.uid() = contractor_id)
  with check (auth.uid() = contractor_id);

-- Policy: Contractor can only delete their own jobs
create policy "jobs_delete_own"
  on jobs for delete
  using (auth.uid() = contractor_id);
