BEGIN;
SELECT plan(3);

-- Helper to mock auth
CREATE OR REPLACE FUNCTION tests.authenticate_as(user_id uuid) RETURNS void AS $$
BEGIN
    PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$ LANGUAGE plpgsql;

-- 1. Setup Test Data
-- Create 3 users: Provider A, Provider B, Client A
WITH new_users AS (
    SELECT '11111111-1111-1111-1111-111111111111'::uuid as id, 'provider_a' as role UNION
    SELECT '22222222-2222-2222-2222-222222222222'::uuid as id, 'provider_b' as role UNION
    SELECT '33333333-3333-3333-3333-333333333333'::uuid as id, 'client_a' as role
)
INSERT INTO auth.users (id, email)
SELECT id, role || '@test.com' FROM new_users;

-- Insert Profiles
INSERT INTO public.profiles (id, email, role) VALUES
('11111111-1111-1111-1111-111111111111', 'provider_a@test.com', 'contractor'),
('22222222-2222-2222-2222-222222222222', 'provider_b@test.com', 'contractor'),
('33333333-3333-3333-3333-333333333333', 'client_a@test.com', 'client');

-- Insert Dummy Job for Provider A
INSERT INTO public.jobs (id, title, contractor_id, client_id, property_id, status)
VALUES
('aaaa1111-1111-1111-1111-111111111111', 'Job A', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'cccc1111-1111-1111-1111-111111111111', 'draft');

-- 2. Smoke Tests

-- Scenario: Provider B (wrong account_id) tries to view Provider A's job
SELECT tests.authenticate_as('22222222-2222-2222-2222-222222222222');

SELECT is_empty(
    'SELECT * FROM public.jobs WHERE id = ''aaaa1111-1111-1111-1111-111111111111''',
    'Provider B should not see Provider A''s job (Wrong Account ID)'
);

-- Scenario: Client A tries to update Provider A's job status (Role Mismatch for mutation)
SELECT tests.authenticate_as('33333333-3333-3333-3333-333333333333');

PREPARE client_update AS UPDATE public.jobs SET status = 'approved' WHERE id = 'aaaa1111-1111-1111-1111-111111111111';
SELECT throws_ok(
    'client_update',
    'new row violates row-level security policy for table "jobs"', -- or similar error
    'Client cannot update job status directly if RLS prevents it'
);

-- Scenario: Provider A can see their job
SELECT tests.authenticate_as('11111111-1111-1111-1111-111111111111');

SELECT results_eq(
    'SELECT title FROM public.jobs WHERE id = ''aaaa1111-1111-1111-1111-111111111111''',
    ARRAY['Job A'],
    'Provider A can see their own job'
);

SELECT * FROM finish();
ROLLBACK;
