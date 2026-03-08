-- RPC: Approve Job Via Token
-- Called from the respond-to-job-invite Edge Function which runs with no user JWT
-- (verify_jwt = false). The token validation in the Edge Function serves as the
-- authorization check, so we skip the auth.uid() ownership guard here.
-- We still enforce the state machine rule that only a 'sent' job can be 'approved'.
create or replace function approve_job_via_token(
  p_job_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_current_status job_status;
  v_contractor_id  uuid;
begin
  -- Fetch current status and contractor for event logging
  select status, contractor_id
    into v_current_status, v_contractor_id
    from jobs
   where id = p_job_id;

  if not found then
    raise exception 'Job not found';
  end if;

  -- Validate state machine: only sent -> approved is permitted here
  if not is_valid_job_transition(v_current_status, 'approved') then
    raise exception 'Invalid state transition from % to approved', v_current_status;
  end if;

  -- No-op guard
  if v_current_status = 'approved' then
    return true;
  end if;

  -- Update job status
  update jobs
     set status     = 'approved',
         updated_at = timezone('utc', now())
   where id = p_job_id;

  -- Audit log — attribute the event to the contractor (owner of the job)
  insert into job_events (job_id, previous_status, new_status, created_by)
  values (p_job_id, v_current_status, 'approved', v_contractor_id);

  return true;
end;
$$;
