import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { InvoiceDraftInput } from '../schemas/invoice';
import type { RepositoryError } from '../repositories/base';
import {
  invoiceRepository,
  type FinalizeInvoiceResult,
  type InvoicePaymentMethod,
  type InvoiceWithItems,
} from '../repositories/invoiceRepository';

const FIVE_MINUTES = 5 * 60 * 1000;

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

  return useMemo(
    () => ({
      invoice: query.data ?? null,
      loading: query.isLoading,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [query.data, query.error, query.isLoading],
  );
};

export const useInvoiceByToken = (token?: string) => {
  const { t } = useTranslation();

  const queryFn = useCallback(async () => {
    if (!token) {
      throw { message: t('validation.invoiceTokenRequired'), reason: 'validation' } satisfies RepositoryError;
    }
    const result = await invoiceRepository.getInvoiceByToken(token);
    if (result.error || !result.data) {
      throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
    }
    return result.data;
  }, [token, t]);

  const queryKey = useMemo(() => ['invoice', 'public', token], [token]);

  const query = useQuery<InvoiceWithItems, RepositoryError>({
    queryKey,
    queryFn,
    enabled: Boolean(token),
    staleTime: FIVE_MINUTES,
  });

  return useMemo(
    () => ({
      invoice: query.data ?? null,
      loading: query.isLoading,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [query.data, query.error, query.isLoading],
  );
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

  return useMemo(
    () => ({
      invoices: query.data ?? [],
      loading: query.isLoading,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [query.data, query.error, query.isLoading, query.refetch],
  );
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

  const finalize = useMutation<FinalizeInvoiceResult, RepositoryError, string>({
    mutationFn: async (id) => {
      const result = await invoiceRepository.finalizeAndSend(id);
      if (result.error || !result.data) {
        throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
      }
      return result.data;
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
