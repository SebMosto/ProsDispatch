-- Create read-only metrics function for admins
create or replace function public.get_admin_metrics()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  is_admin boolean;
  metrics jsonb;
  total_users integer;
  total_jobs integer;
  active_jobs integer;
begin
  -- Check if user is an admin
  select (role = 'admin') into is_admin from public.profiles where id = auth.uid();

  if not coalesce(is_admin, false) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  -- Calculate metrics
  select count(*) into total_users from public.profiles where role = 'contractor';
  select count(*) into total_jobs from public.jobs;
  select count(*) into active_jobs from public.jobs where status not in ('draft', 'archived', 'paid');

  -- Build metrics object
  metrics := jsonb_build_object(
    'total_contractors', total_users,
    'total_jobs', total_jobs,
    'active_jobs', active_jobs
  );

  return metrics;
end;
$$;
