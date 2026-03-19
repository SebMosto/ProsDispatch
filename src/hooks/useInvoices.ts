import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { InvoiceDraftInput } from '../schemas/invoice';
import type { RepositoryError } from '../repositories/base';
import {
  invoiceRepository,
  type InvoiceItemRecord,
  type InvoicePaymentMethod,
  type InvoiceRecord,
  type InvoiceWithItems,
} from '../repositories/invoiceRepository';
import { supabase } from '../lib/supabase';

const FIVE_MINUTES = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

const TIMEOUT_ERROR: RepositoryError = {
  message: 'Unable to load your data. Please check your connection and try again.',
  reason: 'network',
};

export const useInvoice = (id?: string) => {
  const { t } = useTranslation();

  const queryFn = useCallback(async () => {
    if (!id) {
      throw { message: t('validation.invoiceIdRequired'), reason: 'validation' } satisfies RepositoryError;
    }
    const result = await invoiceRepository.get(id);
    if (result.error || !result.data) {
      throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
    }
    return result.data;
  }, [id, t]);

  const queryKey = useMemo(() => ['invoice', id], [id]);

  const query = useQuery<InvoiceWithItems, RepositoryError>({
    queryKey,
    queryFn,
    enabled: Boolean(id),
    staleTime: FIVE_MINUTES,
  });

  return {
    invoice: query.data ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export const useInvoiceByToken = (token?: string) => {
  const { t } = useTranslation();

  const queryFn = useCallback(async () => {
    if (!token) {
      throw { message: t('validation.invoiceTokenRequired'), reason: 'validation' } satisfies RepositoryError;
    }
    const { data, error } = await supabase.rpc('get_invoice_by_token', { p_token: token });

    if (error) {
      // Surface a generic validation-style error for invalid/expired tokens
      const message =
        error.message?.includes('TOKEN_INVALID_OR_EXPIRED') ?
          t('public.invoice.expired') :
          t('public.invoice.expired');
      throw { message, reason: 'validation', cause: error } satisfies RepositoryError;
    }

    // get_invoice_by_token returns a JSON envelope:
    // { invoice, items, contractor_name, pdf_url }
    const envelope = (data ?? null) as
      | {
          invoice: InvoiceRecord;
          items: InvoiceItemRecord[];
          contractor_name?: string | null;
          pdf_url?: string | null;
        }
      | null;

    if (!envelope?.invoice) {
      throw { message: t('public.invoice.expired'), reason: 'validation' } satisfies RepositoryError;
    }

    const fullInvoice: InvoiceWithItems & { contractor_name?: string | null } = {
      ...(envelope.invoice as InvoiceRecord),
      invoice_items: (envelope.items ?? []) as InvoiceItemRecord[],
      contractor_name: envelope.contractor_name ?? null,
      pdf_url: envelope.pdf_url ?? envelope.invoice.pdf_url,
    };

    return fullInvoice;
  }, [token, t]);

  const queryKey = useMemo(() => ['invoice', 'public', token], [token]);

  const query = useQuery<InvoiceWithItems, RepositoryError>({
    queryKey,
    queryFn,
    enabled: Boolean(token),
    staleTime: FIVE_MINUTES,
  });

  return {
    invoice: query.data ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export const useJobInvoices = (jobId?: string) => {
  const queryKey = useMemo(() => ['invoices', { jobId }], [jobId]);

  const queryFn = useCallback(async () => {
    if (!jobId) {
      return [];
    }
    const result = await invoiceRepository.listByJob(jobId);
    if (result.error) {
      throw result.error;
    }
    return result.data ?? [];
  }, [jobId]);

  const query = useQuery<InvoiceWithItems[], RepositoryError>({
    queryKey,
    queryFn,
    enabled: Boolean(jobId),
    staleTime: FIVE_MINUTES,
  });

  return {
    invoices: query.data ?? [],
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export type CreateInvoiceDraftArgs = {
  jobId: string;
  input: InvoiceDraftInput;
};

export type UpdateInvoiceDraftArgs = {
  id: string;
  input: InvoiceDraftInput;
};

export type MarkInvoicePaidArgs = {
  id: string;
  method: InvoicePaymentMethod;
  note?: string;
};

export const useInvoiceMutations = () => {
  const queryClient = useQueryClient();

  const createDraft = useMutation<InvoiceWithItems, RepositoryError, CreateInvoiceDraftArgs>({
    mutationFn: async ({ jobId, input }) => {
      const result = await invoiceRepository.createDraft(jobId, input);
      if (result.error || !result.data) {
        throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] }).catch(() => {
        // noop
      });
    },
  });

  const updateDraft = useMutation<InvoiceWithItems, RepositoryError, UpdateInvoiceDraftArgs>({
    mutationFn: async ({ id, input }) => {
      const result = await invoiceRepository.updateDraft(id, input);
      if (result.error || !result.data) {
        throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] }).catch(() => {
        // noop
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] }).catch(() => {
        // noop
      });
    },
  });

  const finalize = useMutation<void, RepositoryError, string>({
    mutationFn: async (id) => {
      const { data, error } = await supabase.functions.invoke('finalize-and-send-invoice', {
        body: { invoice_id: id },
      });

      if (error || data?.error) {
        throw (error ?? { message: data?.error ?? 'Unknown error', reason: 'unknown' }) as RepositoryError;
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] }).catch(() => {
        // noop
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] }).catch(() => {
        // noop
      });
    },
  });

  const markAsPaid = useMutation<InvoiceWithItems | null, RepositoryError, MarkInvoicePaidArgs>({
    mutationFn: async ({ id, method, note }) => {
      const result = await invoiceRepository.markAsPaid(id, method, note);
      if (result.error) {
        throw result.error;
      }
      const invoiceResult = await invoiceRepository.get(id);
      if (invoiceResult.error) {
        throw invoiceResult.error;
      }
      return invoiceResult.data ?? null;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] }).catch(() => {
        // noop
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] }).catch(() => {
        // noop
      });
    },
  });

  return useMemo(
    () => ({
      createDraft,
      updateDraft,
      finalize,
      markAsPaid,
    }),
    [createDraft, finalize, markAsPaid, updateDraft],
  );
};

// Additional hook helpers matching SPEC-000 naming

export const useInvoicesByJob = (jobId: string) => useJobInvoices(jobId);

export const useInvoicesByContractor = () => {
  const queryKey = useMemo(() => ['invoices', { scope: 'contractor' }], []);

  const queryFn = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const result = await invoiceRepository.listByContractor(controller.signal);
      if (result.error) throw result.error;
      return result.data ?? [];
    } catch (err) {
      if (controller.signal.aborted) throw TIMEOUT_ERROR;
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const query = useQuery<InvoiceRecord[], RepositoryError>({
    queryKey,
    queryFn,
    staleTime: FIVE_MINUTES,
    retry: false,
  });

  return {
    invoices: query.data ?? [],
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export const useCreateInvoiceDraft = () => {
  const { createDraft } = useInvoiceMutations();
  return createDraft;
};

export const useFinalizeInvoice = () => {
  const { finalize } = useInvoiceMutations();
  return finalize;
};

export const useVoidInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<void, RepositoryError, string>({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('void-invoice', {
        body: { invoice_id: id },
      });

      if (error || data?.error) {
        throw (error ?? { message: data?.error ?? 'Unknown error', reason: 'unknown' }) as RepositoryError;
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] }).catch(() => {
        // noop
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] }).catch(() => {
        // noop
      });
    },
  });
};

