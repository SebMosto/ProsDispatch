import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useInvoiceByToken, useFinalizeInvoice } from './useInvoices';
import { supabase } from '../lib/supabase';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('../lib/supabase');
  return {
    ...actual,
    supabase: {
      ...actual.supabase,
      rpc: vi.fn(actual.supabase.rpc),
      functions: {
        ...actual.supabase.functions,
        invoke: vi.fn(actual.supabase.functions.invoke),
      },
    },
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useInvoices hooks', () => {
  beforeEach(() => {
    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockReset();
    (supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it('useInvoiceByToken returns invoice from RPC envelope', async () => {
    const mockAbortSignal = vi.fn().mockResolvedValue({
      data: {
        invoice: {
          id: 'inv-1',
          job_id: 'job-1',
          contractor_id: 'ctr-1',
          invoice_number: 'INV-001',
          status: 'sent',
          subtotal: 1000,
          tax_data: [],
          total_amount: 1000,
          pdf_url: null,
        },
        items: [
          {
            id: 'item-1',
            invoice_id: 'inv-1',
            description: 'Test line',
            quantity: 1,
            unit_price: 1000,
            amount: 1000,
          },
        ],
        contractor_name: 'Test Contractor',
        pdf_url: null,
      },
      error: null,
    });
    const mockRpc = { abortSignal: mockAbortSignal };
    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockRpc);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInvoiceByToken('test-token'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.invoice).not.toBeNull();
    });

    expect(result.current.invoice?.id).toBe('inv-1');
    expect(result.current.invoice?.invoice_items).toHaveLength(1);
  });

  it('useFinalizeInvoice calls finalize-and-send-invoice edge function', async () => {
    (supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useFinalizeInvoice(), { wrapper });

    await waitFor(async () => {
      await result.current.mutateAsync('inv-123');
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('finalize-and-send-invoice', {
      body: { invoice_id: 'inv-123' },
    });
  });
});

