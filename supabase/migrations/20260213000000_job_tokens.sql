-- Create job_tokens table
create table job_tokens (
  token text primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'used', 'expired'
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Index for lookup
create index job_tokens_job_id_idx on job_tokens(job_id);

-- RLS
alter table job_tokens enable row level security;

-- Policies
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

-- Function to get job details by token
create or replace function get_job_by_token(token_input text)
returns json
language plpgsql
security definer
as $$
declare
  v_job_id uuid;
  v_job record;
begin
  -- Validate token
  select job_id into v_job_id
  from job_tokens
  where token = token_input
  and expires_at > now();

  if v_job_id is null then
    return null;
  end if;

  -- Fetch job details joined with client and property
  select
    j.id,
    j.title,
    j.description,
    j.service_date,
    j.status,
    j.contractor_id,
    c.name as client_name,
    p.address_line1 || ', ' || p.city || ', ' || p.province as property_address,
    json_build_object(
      'name', pr.full_name,
      'business_name', pr.business_name,
      'email', pr.email
    ) as contractor
  into v_job
  from jobs j
  join clients c on j.client_id = c.id
  join properties p on j.property_id = p.id
  join profiles pr on j.contractor_id = pr.id
  where j.id = v_job_id;

  return row_to_json(v_job);
end;
$$;
