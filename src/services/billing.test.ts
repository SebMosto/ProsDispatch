import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { billingService } from './billing';
import { supabase } from '../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Billing Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('createInvoiceCheckoutSession calls invoke with correct parameters', async () => {
    const mockResponse = { data: { url: 'https://checkout.stripe.com/...' }, error: null };
    (supabase.functions.invoke as Mock).mockResolvedValue(mockResponse);

    const params = {
      invoiceToken: 'inv_123',
      returnUrl: 'https://app.com/invoice/inv_123',
    };

    const result = await billingService.createInvoiceCheckoutSession(params);

    expect(supabase.functions.invoke).toHaveBeenCalledWith('create-invoice-checkout', {
      body: params,
    });
    expect(result).toEqual({ url: 'https://checkout.stripe.com/...' });
  });

  it('createInvoiceCheckoutSession throws error on failure', async () => {
    const mockResponse = { data: null, error: { message: 'Edge Function Error' } };
    (supabase.functions.invoke as Mock).mockResolvedValue(mockResponse);

    const params = {
      invoiceToken: 'inv_123',
      returnUrl: 'https://app.com/invoice/inv_123',
    };

    await expect(billingService.createInvoiceCheckoutSession(params)).rejects.toThrow(
      'Edge Function Error'
    );
  });

    it('createInvoiceCheckoutSession throws error if no URL returned', async () => {
    const mockResponse = { data: {}, error: null }; // No url
    (supabase.functions.invoke as Mock).mockResolvedValue(mockResponse);

    const params = {
      invoiceToken: 'inv_123',
      returnUrl: 'https://app.com/invoice/inv_123',
    };

    await expect(billingService.createInvoiceCheckoutSession(params)).rejects.toThrow(
      'No checkout URL returned'
    );
  });
});
