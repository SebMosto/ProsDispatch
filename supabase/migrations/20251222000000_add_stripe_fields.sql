-- Add Stripe fields to profiles table
DO $$
BEGIN
    -- Add stripe_customer_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_customer_id text UNIQUE;
    END IF;

    -- Add stripe_account_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_account_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_account_id text UNIQUE;
    END IF;

    -- Add subscription_status if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status text;
    END IF;

    -- Add subscription_end_date if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_end_date') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date timestamptz;
    END IF;
END $$;
