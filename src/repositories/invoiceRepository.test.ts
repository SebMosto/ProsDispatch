import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoiceRepository } from './invoiceRepository';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('InvoiceRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('finalizeAndSend', () => {
    it('should call finalize-invoice edge function', async () => {
      const mockId = 'test-invoice-id';
      const mockToken = 'test-token';
      const mockPdfUrl = 'https://example.com/invoice.pdf';
      const mockInvoice = { id: mockId, status: 'sent', invoice_items: [] };

      // Mock invoke response
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { success: true, token: mockToken, pdfUrl: mockPdfUrl },
        error: null,
      });

      // Mock fetchInvoiceWithItems response (implied internal call)
      // We need to spy on the repository's private/internal method or mock the supabase chain it uses.
      // Since fetchInvoiceWithItems uses `this.client.from...`, we need to mock that chain.
      // But `invoiceRepository` extends `BaseRepository` which uses `supabase`.
      // The `client` property in `BaseRepository` is protected.
      // We can mock `supabase.from` which is what `client` likely refers to if `BaseRepository` uses the global supabase instance or initializes one.
      // `BaseRepository` likely imports `supabase` from `../lib/supabase`.

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null })
        })
      });

      // We need to handle the chain for fetchInvoiceWithItems: .from('invoices').select(...).eq('id', id).single()
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'invoices') {
          return {
            select: mockSelect
          };
        }
        return { select: vi.fn() };
      });

      const result = await invoiceRepository.finalizeAndSend(mockId);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('finalize-invoice', {
        body: { invoice_id: mockId },
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        invoice: mockInvoice,
        token: mockToken,
        pdfUrl: mockPdfUrl,
      });
    });

    it('should handle edge function errors', async () => {
      const mockId = 'test-invoice-id';
      const mockError = 'Function execution failed';

      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: mockError },
      });

      const result = await invoiceRepository.finalizeAndSend(mockId);

      expect(result.error).toEqual({ message: mockError, reason: 'unknown' });
      expect(result.data).toBeNull();
    });

    it('should handle logic errors returned by edge function', async () => {
        const mockId = 'test-invoice-id';
        const mockLogicError = 'Invoice not found';

        (supabase.functions.invoke as any).mockResolvedValue({
          data: { error: mockLogicError },
          error: null,
        });

        const result = await invoiceRepository.finalizeAndSend(mockId);

        expect(result.error).toEqual({ message: mockLogicError, reason: 'validation' });
        expect(result.data).toBeNull();
      });
  });
});
