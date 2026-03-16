-- Function to get admin metrics
create or replace function public.get_admin_metrics()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_role text;
  v_total_users int;
  v_active_jobs int;
  v_total_revenue numeric;
  v_result json;
begin
  -- 1. Verify caller is an admin
  select role into v_user_role
  from public.profiles
  where id = auth.uid();

  if v_user_role is null or v_user_role != 'admin' then
    raise exception 'Unauthorized: Only admins can access metrics';
  end if;

  -- 2. Calculate Total Users
  select count(*) into v_total_users
  from public.profiles;

  -- 3. Calculate Active Jobs
  -- "Active jobs are defined as jobs whose status is not 'draft', 'archived', or 'paid'."
  select count(*) into v_active_jobs
  from public.jobs
  where status not in ('draft', 'archived', 'paid');

  -- 4. Calculate Total Revenue (completed payments)
  select coalesce(sum(total_amount), 0) into v_total_revenue
  from public.invoices
  where status = 'paid';

  -- 5. Construct JSON result
  v_result := json_build_object(
    'total_users', v_total_users,
    'active_jobs', v_active_jobs,
    'total_revenue', v_total_revenue
  );

  return v_result;
end;
$$;
