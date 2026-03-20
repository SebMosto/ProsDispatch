-- 1. Create get_admin_metrics RPC
create or replace function get_admin_metrics()
returns json
language plpgsql
security definer
as $$
declare
  is_admin boolean;
  total_users integer;
  total_jobs integer;
  active_jobs integer;
begin
  -- Check if current user is an admin
  select role = 'admin' into is_admin
  from public.profiles
  where id = auth.uid();

  if is_admin is not true then
    raise exception 'Unauthorized: Admin access required';
  end if;

  -- Get total users count
  select count(*) into total_users from auth.users;

  -- Get total jobs count
  select count(*) into total_jobs from public.jobs;

  -- Get active jobs count (not draft, archived, or paid)
  select count(*) into active_jobs from public.jobs where status not in ('draft', 'archived', 'paid');

  return json_build_object(
    'total_users', total_users,
    'total_jobs', total_jobs,
    'active_jobs', active_jobs
  );
end;
$$;
