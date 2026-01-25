import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (priceId: string) => {
    setIsLoading(true);
    setError(null);

    // 1. Get the current website URL (e.g., http://localhost:5173)
    const returnUrl = window.location.origin;

    console.log("🔵 Checkout initiated for Price ID:", priceId);
    console.log("📍 Return URL:", returnUrl);

    try {
      // 2. Send both priceId AND returnUrl
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          returnUrl // <--- CRITICAL FIX
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
        setError("Failed to start checkout: No URL returned.");
      }

    } catch (err: any) {
      console.error('🔴 Checkout Exception:', err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, isLoading, error };
};