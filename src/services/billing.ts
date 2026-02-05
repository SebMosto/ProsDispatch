import { supabase } from '../lib/supabase';

export interface CreateInvoiceCheckoutParams {
  invoiceToken: string;
  returnUrl: string;
}

export const billingService = {
  createInvoiceCheckoutSession: async ({
    invoiceToken,
    returnUrl,
  }: CreateInvoiceCheckoutParams): Promise<{ url: string }> => {
    const { data, error } = await supabase.functions.invoke<{ url: string }>(
      'create-invoice-checkout',
      {
        body: { invoiceToken, returnUrl },
      }
    );

    if (error) {
      console.error('Billing Service Error:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned');
    }

    return data;
  },
};
