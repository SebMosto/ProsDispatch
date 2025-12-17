-- Security Patch: Restrict Profile Access
-- Use IF EXISTS so this doesn't fail if the policy is already gone (or never existed)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Ensure the secure policy is applied (Drop first to avoid 'policy already exists' errors)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);
