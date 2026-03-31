import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { allowInvoiceFinalizeFallback, useInvoiceByToken, useFinalizeInvoice } from './useInvoices';
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

describe('allowInvoiceFinalizeFallback', () => {
  it('is true in dev', () => {
    expect(allowInvoiceFinalizeFallback({ DEV: true })).toBe(true);
  });

  it('is true when VITE flag is true even if not dev', () => {
    expect(
      allowInvoiceFinalizeFallback({ DEV: false, VITE_ALLOW_INVOICE_FINALIZE_FALLBACK: 'true' }),
    ).toBe(true);
  });

  it('is false in prod-like build without flag', () => {
    expect(allowInvoiceFinalizeFallback({ DEV: false })).toBe(false);
    expect(allowInvoiceFinalizeFallback({ DEV: false, VITE_ALLOW_INVOICE_FINALIZE_FALLBACK: 'false' })).toBe(
      false,
    );
  });
});

describe('useInvoices hooks', () => {
  beforeEach(() => {
    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockReset();
    (supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it('useInvoiceByToken returns invoice from RPC envelope', async () => {
    const envelope = {
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
    };

    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      abortSignal: vi.fn().mockResolvedValue(envelope),
      then: (resolve: (value: typeof envelope) => unknown) => Promise.resolve(resolve(envelope)),
      catch: () => Promise.resolve(),
      finally: () => Promise.resolve(),
    }));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInvoiceByToken('test-token'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.invoice).not.toBeNull();
    });

    expect(supabase.rpc).toHaveBeenCalledWith('get_invoice_by_token', { p_token: 'test-token' });
    expect(result.current.invoice?.id).toBe('inv-1');
    expect(result.current.invoice?.invoice_items).toHaveLength(1);
  });

  it('useInvoiceByToken retries with legacy access_token arg when p_token signature is unavailable', async () => {
    const envelope = {
      data: {
        invoice: {
          id: 'inv-legacy',
          job_id: 'job-1',
          contractor_id: 'ctr-1',
          invoice_number: 'INV-LEGACY',
          status: 'sent',
          subtotal: 1000,
          tax_data: [],
          total_amount: 1000,
          pdf_url: null,
        },
        items: [],
        contractor_name: 'Legacy Contractor',
        pdf_url: null,
      },
      error: null,
    };

    const rpcMock = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
    rpcMock
      .mockImplementationOnce(() => ({
        abortSignal: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'function public.get_invoice_by_token(p_token => text) does not exist' },
        }),
      }))
      .mockImplementationOnce(() => ({
        abortSignal: vi.fn().mockResolvedValue(envelope),
      }));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInvoiceByToken('legacy-token'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.invoice?.id).toBe('inv-legacy');
    });

    expect(rpcMock).toHaveBeenNthCalledWith(1, 'get_invoice_by_token', { p_token: 'legacy-token' });
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'get_invoice_by_token', { access_token: 'legacy-token' });
  });

  it('useInvoiceByToken accepts legacy direct-invoice RPC shape', async () => {
    const rpcMock = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
    rpcMock
      .mockImplementationOnce(() => ({
        abortSignal: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Could not find the function public.get_invoice_by_token(p_token) in the schema cache',
            code: 'PGRST202',
            details: 'schema cache mismatch',
          },
        }),
      }))
      .mockImplementationOnce(() => ({
        abortSignal: vi.fn().mockResolvedValue({
          data: {
            id: 'inv-legacy-flat',
            job_id: 'job-1',
            contractor_id: 'ctr-1',
            invoice_number: 'INV-LEGACY-FLAT',
            status: 'sent',
            subtotal: 1000,
            tax_data: [],
            total_amount: 1000,
            pdf_url: null,
          },
          error: null,
        }),
      }));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInvoiceByToken('legacy-flat-token'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.invoice?.id).toBe('inv-legacy-flat');
    });

    expect(result.current.invoice?.invoice_items).toEqual([]);
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

