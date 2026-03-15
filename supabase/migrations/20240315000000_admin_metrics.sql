-- Create the admin metrics RPC

CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
  metrics json;
BEGIN
  -- Validate caller is admin
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Compile metrics
  SELECT json_build_object(
    'total_contractors', (SELECT count(*) FROM public.profiles WHERE role = 'contractor'),
    'total_jobs', (SELECT count(*) FROM public.jobs),
    'total_invoices', (SELECT count(*) FROM public.invoices)
  ) INTO metrics;

  RETURN metrics;
END;
$$;
