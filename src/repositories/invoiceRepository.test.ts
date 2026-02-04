import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
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
      (supabase.functions.invoke as Mock).mockResolvedValue({
        data: { success: true, token: mockToken, pdfUrl: mockPdfUrl },
        error: null,
      });

      // Mock fetchInvoiceWithItems response (implied internal call)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null }),
        }),
      });

      // We need to handle the chain for fetchInvoiceWithItems: .from('invoices').select(...).eq('id', id).single()
      (supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'invoices') {
          return {
            select: mockSelect,
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

      (supabase.functions.invoke as Mock).mockResolvedValue({
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

      (supabase.functions.invoke as Mock).mockResolvedValue({
        data: { error: mockLogicError },
        error: null,
      });

      const result = await invoiceRepository.finalizeAndSend(mockId);

      expect(result.error).toEqual({ message: mockLogicError, reason: 'validation' });
      expect(result.data).toBeNull();
    });
  });
});
