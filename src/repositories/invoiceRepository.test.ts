import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceRepository } from './invoiceRepository';
import { type InvoiceDraftInput } from '../schemas/invoice';

// Mock network reporting
vi.mock('../lib/network', () => ({
  reportApiOnline: vi.fn(),
  reportApiOffline: vi.fn(),
}));

describe('InvoiceRepository', () => {
  let repository: InvoiceRepository;
  let mockClient: {
    rpc: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    auth: {
      getUser: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      rpc: vi.fn(),
      from: vi.fn(),
      auth: {
        getUser: vi.fn(),
      },
    };

    // Instantiate repository
    repository = new InvoiceRepository();
    // @ts-expect-error - injecting mock client into protected property
    repository.client = mockClient;
  });

  describe('createDraft', () => {
    it('should create an invoice draft and its items', async () => {
      const jobId = 'job-123';
      const contractorId = 'contractor-456';
      const input: InvoiceDraftInput = {
        job_id: jobId,
        contractor_id: contractorId,
        invoice_number: 'INV-TEMP',
        status: 'draft',
        items: [
          { description: 'Item 1', quantity: 2, unit_price: 100, amount: 200 },
        ],
        subtotal: 200,
        tax_data: [],
        total_amount: 200,
      };

      const mockInvoiceId = 'inv-123';
      const mockInvoice = {
        id: mockInvoiceId,
        job_id: jobId,
        contractor_id: contractorId,
        invoice_number: 'INV-ABCD',
        status: 'draft',
      };

      const mockInvoiceWithItems = {
        ...mockInvoice,
        invoice_items: input.items,
      };

      // Mock auth.getUser
      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: contractorId } },
        error: null,
      });

      // Mock insert invoice returning the new invoice
      const mockInsertBuilder = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null }),
      };

      // Mock delete items
      const mockDeleteBuilder = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      // Mock insert items
      const mockInsertItemsBuilder = vi.fn().mockResolvedValue({ error: null });

      // Mock fetchInvoiceWithItems
      const mockFetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoiceWithItems, error: null }),
      };

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'invoices') {
          // In createDraft, we first insert, then fetch
          if (mockInsertBuilder.select.mock.calls.length === 0) {
            return { insert: () => mockInsertBuilder };
          }
          return mockFetchBuilder;
        } else if (table === 'invoice_items') {
          return {
            delete: () => mockDeleteBuilder,
            insert: mockInsertItemsBuilder,
          };
        }
      });

      const result = await repository.createDraft(jobId, input);

      expect(mockClient.auth.getUser).toHaveBeenCalled();
      expect(result.data).toEqual(mockInvoiceWithItems);
      expect(result.error).toBeUndefined();
    });

    it('should return error if not authenticated', async () => {
      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await repository.createDraft('job-123', {} as InvoiceDraftInput);
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('User must be authenticated to create an invoice');
    });
  });

  describe('updateDraft', () => {
    it('should update invoice fields and items', async () => {
      const invoiceId = 'inv-123';
      const input: InvoiceDraftInput = {
        job_id: 'job-123',
        contractor_id: 'contractor-456',
        invoice_number: 'INV-123',
        status: 'draft',
        items: [
          { description: 'Updated Item', quantity: 1, unit_price: 300, amount: 300 },
        ],
        subtotal: 300,
      };

      const mockInvoiceWithItems = {
        id: invoiceId,
        invoice_number: 'INV-123',
        status: 'draft',
        invoice_items: input.items,
      };

      // Mock update invoice
      const mockUpdateBuilder = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      // Mock delete items
      const mockDeleteBuilder = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      // Mock insert items
      const mockInsertItemsBuilder = vi.fn().mockResolvedValue({ error: null });

      // Mock fetchInvoiceWithItems
      const mockFetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoiceWithItems, error: null }),
      };

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'invoices') {
          return {
            update: () => mockUpdateBuilder,
            select: () => mockFetchBuilder, // fallback for fetch
          };
        } else if (table === 'invoice_items') {
          return {
            delete: () => mockDeleteBuilder,
            insert: mockInsertItemsBuilder,
          };
        }
      });

      // Actually, update calls `this.client.from('invoices').update(payload).eq('id', id)`
      // then `this.client.from('invoices').select...` so we need to mock it properly.
      // Above mock is a bit hacky but let's test.
      // Actually we need to make sure from('invoices') handles both update and select
      let invoiceCallCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'invoices') {
          invoiceCallCount++;
          if (invoiceCallCount === 1) {
            return { update: () => mockUpdateBuilder };
          } else {
            return mockFetchBuilder;
          }
        } else if (table === 'invoice_items') {
          return {
            delete: () => mockDeleteBuilder,
            insert: mockInsertItemsBuilder,
          };
        }
      });

      const result = await repository.updateDraft(invoiceId, input);

      expect(result.data).toEqual(mockInvoiceWithItems);
      expect(result.error).toBeUndefined();
    });
  });

  describe('finalizeAndSend', () => {
    it('should mark invoice as sent and generate token', async () => {
      const invoiceId = 'inv-123';
      const mockInvoice = {
        id: invoiceId,
        status: 'sent',
        pdf_url: 'https://example.com/invoices/inv-123.pdf',
      };

      // Mock invoice update returning the invoice
      const mockUpdateBuilder = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null }),
      };

      // Mock token insert
      const mockInsertTokenBuilder = vi.fn().mockResolvedValue({ error: null });

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'invoices') {
          return { update: () => mockUpdateBuilder };
        } else if (table === 'invoice_tokens') {
          return { insert: mockInsertTokenBuilder };
        }
      });

      const result = await repository.finalizeAndSend(invoiceId);

      expect(result.data?.invoice).toEqual(mockInvoice);
      expect(result.data?.token).toBeDefined();
      expect(result.data?.pdfUrl).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('getInvoiceByToken', () => {
    it('should call get_invoice_by_token RPC', async () => {
      const token = 'secret-token';
      const mockData = { id: 'inv-123', status: 'sent', invoice_items: [] };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
      mockClient.rpc.mockReturnValue({ single: mockSingle });

      const result = await repository.getInvoiceByToken(token);

      expect(mockClient.rpc).toHaveBeenCalledWith('get_invoice_by_token', { access_token: token });
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });
  });
});
