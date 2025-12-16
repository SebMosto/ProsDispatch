-- Security Patch: Restrict Profile Access
DROP POLICY "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Ensure Update policy is also secure (if not already)
-- CREATE POLICY "Users can update own profile" ON public.profiles
-- FOR UPDATE USING (auth.uid() = id);
