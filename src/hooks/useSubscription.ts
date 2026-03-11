import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export const useSubscription = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          returnUrl: window.location.origin,
        },
      });

      if (error) {
        console.error("🔴 Supabase Function Error:", error);
        throw error;
      }

      if (data?.url) {
        console.log("🟢 Success! Redirecting to:", data.url);
        window.location.href = data.url;
      } else {
        console.error("🔴 No URL returned from backend:", data);
        setError(t('errors.checkoutNoUrl'));
      }

    } catch (err: unknown) {
      console.error('🔴 Checkout Exception:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError(t('errors.unexpected'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, isLoading, error };
};