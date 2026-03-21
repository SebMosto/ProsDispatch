-- Migration: admin_metrics
-- Description: Creates the get_admin_metrics RPC for the internal Admin Portal

create or replace function public.get_admin_metrics()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_role text;
  v_active_contractors int;
  v_total_jobs int;
begin
  -- 1. Check if the current user is an admin
  select role into v_role
  from public.profiles
  where id = auth.uid();

  if v_role is null or v_role != 'admin' then
    raise exception 'Unauthorized: Only admins can access metrics.';
  end if;

  -- 2. Calculate active contractors (those with role = 'contractor')
  select count(*) into v_active_contractors
  from public.profiles
  where role = 'contractor';

  -- 3. Calculate total jobs
  select count(*) into v_total_jobs
  from public.jobs;

  -- 4. Return as JSON
  return jsonb_build_object(
    'active_contractors', v_active_contractors,
    'total_jobs', v_total_jobs
  );
end;
$$;
