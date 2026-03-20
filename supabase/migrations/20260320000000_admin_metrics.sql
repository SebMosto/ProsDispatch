-- Migration: 20260320000000_admin_metrics.sql
-- Description: Creates the get_admin_metrics RPC for the admin dashboard.

CREATE OR REPLACE FUNCTION get_admin_metrics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  total_jobs BIGINT,
  active_jobs BIGINT,
  total_revenue_cents BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Validate caller has the 'admin' role
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_role IS NULL OR v_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Requires admin role';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles) AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE updated_at >= NOW() - INTERVAL '30 days') AS active_users,
    (SELECT COUNT(*) FROM jobs) AS total_jobs,
    (SELECT COUNT(*) FROM jobs WHERE status NOT IN ('draft', 'archived', 'paid')) AS active_jobs,
    (SELECT COALESCE(SUM(total_amount), 0)::BIGINT FROM invoices WHERE status = 'paid') AS total_revenue_cents;
END;
$$;

-- Grant execution to authenticated users (role check is internal)
GRANT EXECUTE ON FUNCTION get_admin_metrics() TO authenticated;
