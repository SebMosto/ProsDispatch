import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (priceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const manageSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');

      if (error) throw error;
      if (!data?.url) throw new Error('No portal URL returned');

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Portal error:', err);
      setError(err.message || 'Failed to open billing portal');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkout,
    manageSubscription,
    isLoading,
    error,
  };
}
