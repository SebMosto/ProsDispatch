-- 1. Create Job Tokens Table
create table job_tokens (
  token text primary key default encode(gen_random_bytes(16), 'hex'),
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null default 'pending', -- pending, viewed, approved, declined
  expires_at timestamptz not null default (timezone('utc', now()) + interval '7 days'),
  created_at timestamptz not null default timezone('utc', now()),
  opened_at timestamptz
);

-- Index for performance
create index job_tokens_job_id_idx on job_tokens(job_id);

-- 2. RLS
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

-- Policy: Contractor can insert tokens for their own jobs
create policy "job_tokens_insert_own"
  on job_tokens for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

-- 3. Secure Public Access Function
create or replace function get_job_by_token(token_input text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  -- Fetch job details if token is valid and not expired
  select json_build_object(
    'id', j.id,
    'title', j.title,
    'description', j.description,
    'service_date', j.service_date,
    'status', j.status,
    'client_name', c.name,
    'property_address', p.address_line1 || ', ' || p.city || ', ' || p.province,
    'contractor_business_name', pr.business_name,
    'contractor_name', pr.full_name
  ) into result
  from jobs j
  join job_tokens t on t.job_id = j.id
  join clients c on j.client_id = c.id
  join properties p on j.property_id = p.id
  join profiles pr on j.contractor_id = pr.id
  where t.token = token_input
  and t.expires_at > timezone('utc', now());

  if result is null then
    raise exception 'Invalid or expired token';
  end if;

  -- Update opened_at
  update job_tokens
  set opened_at = timezone('utc', now()),
      status = case when status = 'pending' then 'viewed' else status end
  where token = token_input;

  return result;
end;
$$;
