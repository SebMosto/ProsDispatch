import { supabase } from '../lib/supabase';

/**
 * Centralized Billing Service
 *
 * All interactions with Stripe must go through this service.
 * Direct calls to Stripe SDK or Edge Functions from components are prohibited.
 */

export const billingService = {
  /**
   * Creates a Stripe Checkout Session for a subscription
   */
  async createCheckoutSession(priceId: string, returnUrl: string): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, returnUrl },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }

    if (!data?.url) {
        throw new Error('No Checkout URL returned');
    }

    return data;
  },

  /**
   * Creates a Stripe Checkout Session for an invoice
   */
  async createInvoiceCheckoutSession(invoiceToken: string, returnUrl: string): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke('create-invoice-checkout', {
      body: { invoiceToken, returnUrl },
    });

    if (error) {
      console.error('Error creating invoice checkout session:', error);
      throw error;
    }

    if (!data?.url) {
        throw new Error('No Checkout URL returned');
    }

    return data;
  }
};
