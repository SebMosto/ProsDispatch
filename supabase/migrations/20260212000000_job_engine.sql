-- 1. Job Events Table (Audit Log for State Transitions)
create table job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  previous_status job_status, -- Nullable for initial creation
  new_status job_status not null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references auth.users(id) default auth.uid()
);

-- Index for performance
create index job_events_job_id_idx on job_events(job_id);

-- RLS
alter table job_events enable row level security;

-- Policy: Contractor can view events for their own jobs
create policy "job_events_select_own"
  on job_events for select
  using (
    exists (
      select 1 from jobs
      where jobs.id = job_events.job_id
      and jobs.contractor_id = auth.uid()
    )
  );

-- 2. RPC: Create Job
create or replace function create_job(
  client_id uuid,
  property_id uuid,
  title text,
  description text default null,
  service_date date default null
)
returns json
language plpgsql
security definer
as $$
declare
  new_job_id uuid;
  new_job_record record;
begin
  -- Validate inputs (handled by constraints mostly, but extra check doesn't hurt)
  if client_id is null or property_id is null or title is null then
    raise exception 'client_id, property_id, and title are required';
  end if;

  -- Insert Job
  insert into jobs (
    contractor_id,
    client_id,
    property_id,
    title,
    description,
    service_date,
    status
  ) values (
    auth.uid(),
    client_id,
    property_id,
    title,
    description,
    service_date,
    'draft'
  )
  returning * into new_job_record;

  new_job_id := new_job_record.id;

  -- Log Initial Event
  insert into job_events (
    job_id,
    previous_status,
    new_status,
    created_by
  ) values (
    new_job_id,
    null,
    'draft',
    auth.uid()
  );

  return to_json(new_job_record);
end;
$$;

-- 3. Helper Function: Validate Job State Transition
-- This enforces the state machine rules defined in src/lib/stateMachines.ts
create or replace function is_valid_job_transition(
  from_status job_status,
  to_status job_status
)
returns boolean
language plpgsql
immutable
as $$
begin
  -- Allow no-op transitions
  if from_status = to_status then
    return true;
  end if;

  -- Define valid transitions based on the state machine
  return case from_status
    when 'draft' then to_status in ('sent', 'archived')
    when 'sent' then to_status in ('approved', 'draft', 'archived')
    when 'approved' then to_status in ('in_progress', 'sent', 'archived')
    when 'in_progress' then to_status in ('completed', 'approved', 'archived')
    when 'completed' then to_status in ('invoiced', 'in_progress', 'archived')
    when 'invoiced' then to_status in ('paid', 'completed', 'archived')
    when 'paid' then to_status in ('archived')
    when 'archived' then to_status in ('draft')
    else false
  end;
end;
$$;

-- 4. RPC: Transition Job State
create or replace function transition_job_state(
  job_id uuid,
  new_status job_status
)
returns boolean
language plpgsql
security definer
as $$
declare
  current_status job_status;
  job_contractor_id uuid;
begin
  -- Get current status and contractor_id
  select status, contractor_id into current_status, job_contractor_id
  from jobs
  where id = job_id;

  if not found then
    raise exception 'Job not found';
  end if;

  -- Verify ownership
  if job_contractor_id != auth.uid() then
    raise exception 'Unauthorized';
  end if;

  -- Prevent no-op
  if current_status = new_status then
    return true;
  end if;

  -- Validate state transition
  if not is_valid_job_transition(current_status, new_status) then
    raise exception 'Invalid state transition from % to %', current_status, new_status;
  end if;

  -- Update Job
  update jobs
  set status = new_status,
      updated_at = timezone('utc', now())
  where id = job_id;

  -- Log Event
  insert into job_events (
    job_id,
    previous_status,
    new_status,
    created_by
  ) values (
    job_id,
    current_status,
    new_status,
    auth.uid()
  );

  return true;
end;
$$;
