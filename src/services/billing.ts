import { supabase } from '../lib/supabase';

export const billingService = {
  async createCheckoutSession(priceId: string, returnUrl: string) {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, returnUrl }
    });

    if (error) throw error;
    return CheckoutSessionResponseSchema.parse(data);
  },
};
