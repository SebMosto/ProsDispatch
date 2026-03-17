-- Create RPC for admin metrics
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_total_users int;
  v_total_jobs int;
  v_active_jobs int;
BEGIN
  -- 1. Check if the user is an admin
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role IS NULL OR v_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access these metrics';
  END IF;

  -- 2. Gather metrics
  SELECT count(*) INTO v_total_users FROM public.profiles;
  SELECT count(*) INTO v_total_jobs FROM public.jobs;

  -- Active jobs are those not in draft, archived, or paid
  SELECT count(*) INTO v_active_jobs
  FROM public.jobs
  WHERE status NOT IN ('draft', 'archived', 'paid');

  -- 3. Return as JSON
  RETURN json_build_object(
    'total_users', v_total_users,
    'total_jobs', v_total_jobs,
    'active_jobs', v_active_jobs
  );
END;
$$;

-- Grant execute permission to authenticated users (the function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.get_admin_metrics TO authenticated;
