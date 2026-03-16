-- Migration: Add Admin Metrics RPC
-- Description: Creates a secure RPC for admins to retrieve basic platform metrics.

create or replace function public.get_admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_role text;
  v_total_users integer;
  v_total_jobs integer;
  v_active_jobs integer;
begin
  -- 1. Check if the current user has the 'admin' role
  select role into v_user_role
  from public.profiles
  where id = auth.uid();

  if v_user_role is distinct from 'admin' then
    raise exception 'Access denied: Admin role required.';
  end if;

  -- 2. Calculate metrics
  -- Total contractors
  select count(*) into v_total_users
  from public.profiles
  where role = 'contractor';

  -- Total jobs
  select count(*) into v_total_jobs
  from public.jobs;

  -- Active jobs (not draft, archived, or paid)
  select count(*) into v_active_jobs
  from public.jobs
  where status not in ('draft', 'archived', 'paid');

  -- 3. Return as JSON
  return jsonb_build_object(
    'total_contractors', v_total_users,
    'total_jobs', v_total_jobs,
    'active_jobs', v_active_jobs
  );
end;
$$;
