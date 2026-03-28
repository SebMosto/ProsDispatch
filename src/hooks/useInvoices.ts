import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
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

export const useInvoice = (id?: string) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const queryFn = useCallback(async () => {
    if (!id) {
      throw { message: tRef.current('validation.invoiceIdRequired'), reason: 'validation' } satisfies RepositoryError;
    }
    const result = await invoiceRepository.get(id);
    if (result.error || !result.data) {
      throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
    }
    return result.data;
  }, [id]);

  const queryKey = useMemo(() => ['invoice', id], [id]);

  const query = useQuery<InvoiceWithItems, RepositoryError>({
    queryKey,
    queryFn,
    enabled: !!user && Boolean(id),
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
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const queryFn = useCallback(async ({ signal }: { signal?: AbortSignal }) => {
    if (!token) {
      throw { message: tRef.current('validation.invoiceTokenRequired'), reason: 'validation' } satisfies RepositoryError;
    }
    let query = supabase.rpc('get_invoice_by_token', { p_token: token });
    if (signal) {
      query = query.abortSignal(signal);
    }
    const { data, error } = await query;

    if (error) {
      // Surface a generic validation-style error for invalid/expired tokens
      const message =
        error.message?.includes('TOKEN_INVALID_OR_EXPIRED') ?
          tRef.current('public.invoice.expired') :
          tRef.current('public.invoice.expired');
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
      throw { message: tRef.current('public.invoice.expired'), reason: 'validation' } satisfies RepositoryError;
    }

    const fullInvoice: InvoiceWithItems & { contractor_name?: string | null } = {
      ...(envelope.invoice as InvoiceRecord),
      invoice_items: (envelope.items ?? []) as InvoiceItemRecord[],
      contractor_name: envelope.contractor_name ?? null,
      pdf_url: envelope.pdf_url ?? envelope.invoice.pdf_url,
    };

    return fullInvoice;
  }, [token]);

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
  const { user } = useAuth();
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
    enabled: !!user && Boolean(jobId),
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
  const { user } = useAuth();
  const queryKey = useMemo(() => ['invoices', { scope: 'contractor' }], []);

  const queryFn = useCallback(async ({ signal }: { signal?: AbortSignal }) => {
    const result = await invoiceRepository.listByContractor(signal);
    if (result.error) throw result.error;
    return result.data ?? [];
  }, []);

  const query = useQuery<InvoiceRecord[], RepositoryError>({
    queryKey,
    queryFn,
    enabled: !!user,
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

