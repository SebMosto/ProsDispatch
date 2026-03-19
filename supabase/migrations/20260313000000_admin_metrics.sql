-- Create RPC get_admin_metrics

CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
    total_users int;
    total_jobs int;
    active_jobs int;
    result json;
BEGIN
    -- Check if calling user is an admin
    SELECT role INTO caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Calculate metrics
    SELECT count(*) INTO total_users FROM public.profiles;
    SELECT count(*) INTO total_jobs FROM public.jobs;
    SELECT count(*) INTO active_jobs FROM public.jobs WHERE status NOT IN ('draft', 'archived', 'paid');

    result := json_build_object(
        'total_users', total_users,
        'total_jobs', total_jobs,
        'active_jobs', active_jobs
    );

    RETURN result;
END;
$$;

-- Grant execution to authenticated users (the function itself checks the role)
GRANT EXECUTE ON FUNCTION public.get_admin_metrics() TO authenticated;
