-- Create get_admin_metrics RPC
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Required to bypass RLS to count all jobs/contractors
AS $$
DECLARE
  v_role text;
  v_active_contractors integer;
  v_total_jobs integer;
  v_total_invoices_paid integer;
BEGIN
  -- 1. Enforce Admin Role Check
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- 2. Calculate Metrics
  -- Active contractors (let's say all users with role contractor)
  SELECT count(*) INTO v_active_contractors
  FROM public.profiles
  WHERE role = 'contractor';

  -- Total jobs
  SELECT count(*) INTO v_total_jobs
  FROM public.jobs;

  -- Total invoices paid (assuming invoice_status enum has 'paid')
  SELECT count(*) INTO v_total_invoices_paid
  FROM public.invoices
  WHERE status = 'paid';

  -- 3. Return JSON
  RETURN json_build_object(
    'active_contractors', v_active_contractors,
    'total_jobs', v_total_jobs,
    'total_invoices_paid', v_total_invoices_paid
  );
END;
$$;
