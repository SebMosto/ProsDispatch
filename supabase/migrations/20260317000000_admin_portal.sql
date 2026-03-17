-- Admin Portal RPCs

-- Returns aggregate metrics for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_total_users int;
  v_total_jobs int;
  v_total_revenue numeric;
  v_active_subscriptions int;
BEGIN
  -- 1. Check if user is an admin
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access denied. User is not an admin.';
  END IF;

  -- 2. Calculate metrics
  SELECT count(*) INTO v_total_users FROM public.profiles WHERE role != 'admin';
  SELECT count(*) INTO v_total_jobs FROM public.jobs;
  SELECT COALESCE(sum(total_amount), 0) INTO v_total_revenue FROM public.invoices WHERE status = 'paid';
  SELECT count(*) INTO v_active_subscriptions FROM public.profiles WHERE subscription_status = 'active';

  -- 3. Return JSON object
  RETURN json_build_object(
    'total_users', v_total_users,
    'total_jobs', v_total_jobs,
    'total_revenue', v_total_revenue,
    'active_subscriptions', v_active_subscriptions
  );
END;
$$;
