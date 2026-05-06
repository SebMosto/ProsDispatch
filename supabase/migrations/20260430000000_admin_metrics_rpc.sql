-- Admin Metrics RPC
create or replace function get_admin_metrics()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    v_role text;
    v_total_users int;
    v_total_jobs int;
    v_total_invoices int;
    v_metrics jsonb;
begin
    -- Check if the current user is an admin
    select role into v_role from profiles where id = auth.uid();

    if v_role != 'admin' then
        raise exception 'Access denied. Only admins can access these metrics.';
    end if;

    -- Calculate metrics
    select count(*) into v_total_users from profiles;
    select count(*) into v_total_jobs from jobs;
    select count(*) into v_total_invoices from invoices;

    -- Build the JSON object
    v_metrics := jsonb_build_object(
        'total_users', v_total_users,
        'total_jobs', v_total_jobs,
        'total_invoices', v_total_invoices
    );

    return v_metrics;
end;
$$;
