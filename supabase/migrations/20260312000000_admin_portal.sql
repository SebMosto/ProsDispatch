-- Migration: Admin Portal Metrics RPC

-- Ensure the function only returns data for users with the 'admin' role.
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS TABLE (
  total_users BIGINT,
  total_jobs BIGINT,
  active_jobs BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get the role of the calling user
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();

  -- Check if the user is an admin
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Calculate metrics
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.jobs),
    (SELECT COUNT(*) FROM public.jobs WHERE status NOT IN ('draft', 'archived', 'paid'));
END;
$$;

-- Grant execution to authenticated users (the function itself checks for 'admin' role)
GRANT EXECUTE ON FUNCTION public.get_admin_metrics() TO authenticated;
