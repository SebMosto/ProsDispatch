import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (priceId: string) => {
    setIsLoading(true);
    setError(null);
    console.log("🔵 Checkout initiated for Price ID:", priceId);

    try {
      // 1. Call the Edge Function
      console.log("🔄 Calling create-checkout-session...");
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });

      // 2. Handle Supabase Errors
      if (error) {
        console.error("🔴 Supabase Function Error:", error);
        throw error;
      }

      // 3. Redirect
      if (data?.url) {
        console.log("🟢 Success! Redirecting to:", data.url);
        window.location.href = data.url;
      } else {
        console.error("🔴 No URL returned from backend:", data);
        setError("Failed to start checkout: No URL returned.");
      }

    } catch (err: any) {
      console.error('🔴 Checkout Exception:', err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const manageSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("🔄 Opening Customer Portal...");
      const { data, error } = await supabase.functions.invoke('create-portal-session');

      if (error) throw error;
      if (data?.url) {
        console.log("🟢 Redirecting to Portal:", data.url);
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Portal error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, manageSubscription, isLoading, error };
};
