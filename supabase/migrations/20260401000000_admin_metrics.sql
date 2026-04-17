-- Migration to add admin metrics RPC
CREATE OR REPLACE FUNCTION get_admin_metrics()
RETURNS TABLE (
  total_users BIGINT,
  active_subscriptions BIGINT,
  total_jobs BIGINT,
  total_revenue_cents BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Verify caller is an admin
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();

  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles) AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE subscription_status = 'active') AS active_subscriptions,
    (SELECT COUNT(*) FROM jobs) AS total_jobs,
    COALESCE((SELECT SUM(total_amount) FROM invoices WHERE status = 'paid'), 0)::BIGINT AS total_revenue_cents;
END;
$$;
