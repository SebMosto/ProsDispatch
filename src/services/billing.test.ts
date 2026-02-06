import { describe, it, expect, vi, beforeEach } from 'vitest';
import { billingService } from './billing';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('billingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInvoiceCheckoutSession', () => {
    it('should call invoke with correct parameters', async () => {
      const mockResponse = { data: { url: 'https://checkout.stripe.com/...' }, error: null };
      (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

      const result = await billingService.createInvoiceCheckoutSession('inv_123', 'http://localhost/pay');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-invoice-checkout', {
        body: { invoiceId: 'inv_123', returnUrl: 'http://localhost/pay' },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error if invoke fails', async () => {
      const mockError = new Error('Function failed');
      (supabase.functions.invoke as any).mockResolvedValue({ data: null, error: mockError });

      await expect(billingService.createInvoiceCheckoutSession('inv_123', 'http://url')).rejects.toThrow(mockError);
    });

    it('should throw error if no url returned', async () => {
       (supabase.functions.invoke as any).mockResolvedValue({ data: {}, error: null });
       await expect(billingService.createInvoiceCheckoutSession('inv_123', 'http://url')).rejects.toThrow('No Checkout URL returned');
    });
  });
});
