-- Migration: Add get_admin_metrics RPC for Admin Portal

create or replace function get_admin_metrics()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_role text;
  v_total_users int;
  v_total_jobs int;
  v_total_revenue numeric;
begin
  -- Enforce admin role check
  select role into v_user_role
  from profiles
  where id = auth.uid();

  if v_user_role is distinct from 'admin' then
    raise exception 'Access denied: Admin privileges required';
  end if;

  -- Gather minimal stub metrics
  select count(*) into v_total_users from profiles;
  select count(*) into v_total_jobs from jobs;
  select coalesce(sum(amount), 0) into v_total_revenue from invoices where status = 'paid';

  return json_build_object(
    'total_users', v_total_users,
    'total_jobs', v_total_jobs,
    'total_revenue', v_total_revenue
  );
end;
$$;
