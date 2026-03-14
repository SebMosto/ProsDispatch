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

-- Security: Prevent users from self-assigning an elevated role.
-- The "Users can update own profile" policy created in 20260117000000_monetization.sql only
-- protects billing fields, leaving 'role' freely writable. Any authenticated user could set
-- role = 'admin' and then pass the check above to call this SECURITY DEFINER function.
--
-- We extend the policy with ALTER POLICY (no gap, no DROP window) to also make 'role'
-- immutable for regular users. Only the service_role (used by privileged Edge Functions)
-- is permitted to change it via the separate "Service role can update billing fields" policy.
--
-- NOTE: The WITH CHECK clause only has access to new row values, not OLD; subqueries are
-- the standard way to read the current persisted value for comparison in this context.
ALTER POLICY "Users can update own profile" ON public.profiles
  WITH CHECK (
    -- Billing fields must not change (carried over from monetization migration).
    ROW(stripe_customer_id, subscription_status, subscription_end_date) IS NOT DISTINCT FROM (
      SELECT ROW(stripe_customer_id, subscription_status, subscription_end_date)
      FROM public.profiles
      WHERE id = auth.uid()
    )
    AND
    -- Role must not change; only service_role / privileged functions may alter it.
    role IS NOT DISTINCT FROM (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    )
  );
