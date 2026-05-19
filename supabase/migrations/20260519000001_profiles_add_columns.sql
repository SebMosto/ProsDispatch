ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS stripe_connect_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text DEFAULT 'QC',
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS phone text;
