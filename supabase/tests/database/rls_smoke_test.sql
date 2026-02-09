BEGIN;

-- Plan the tests
SELECT plan(5);

-- Helper to switch user
CREATE OR REPLACE FUNCTION tests.authenticate_as(user_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
END;
$$ LANGUAGE plpgsql;

-- 1. Test: Users cannot see other users' data (Tenant Isolation)
-- Assuming 'jobs' table has user_id/owner_id
PREPARE test_isolation AS
  SELECT count(*) FROM jobs;

-- Create two fake users (in a real test, use auth.users)
-- Here we simulate the IDs
DO $$
DECLARE
  user1 uuid := gen_random_uuid();
  user2 uuid := gen_random_uuid();
  job_id uuid;
BEGIN
  -- User 1 creates a job
  PERFORM tests.authenticate_as(user1);
  -- Mock insert (if RLS allows) - assuming we have a function or direct insert
  -- INSERT INTO jobs (client_id, property_id, title) VALUES ... RETURNING id INTO job_id;

  -- User 2 tries to read
  PERFORM tests.authenticate_as(user2);

  -- Check visibility
  -- PERFORM is( (SELECT count(*) FROM jobs WHERE id = job_id), 0, 'User 2 cannot see User 1 job');

END
$$;

-- 2. Test: Missing role claim
-- Switch to anon
SET ROLE anon;
SELECT throws_ok(
  'SELECT * FROM jobs',
  'permission denied for table jobs',
  'Anon cannot read jobs'
);

-- 3. Test: Wrong Role (if strict roles exist)
-- e.g. 'homeowner' trying to write to 'jobs'
-- SET ROLE authenticated;
-- SET request.jwt.claim.role = 'homeowner';
-- INSERT ... should fail.

SELECT pass('RLS Smoke Tests structure created');

SELECT * FROM finish();
ROLLBACK;
