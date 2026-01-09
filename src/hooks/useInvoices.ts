import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const query = useQuery<InvoiceWithItems, RepositoryError>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) {
        throw { message: 'Invoice ID is required', reason: 'validation' } satisfies RepositoryError;
      }
      const result = await invoiceRepository.get(id);
      if (result.error || !result.data) {
        throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
      }
      return result.data;
    },
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
  const query = useQuery<InvoiceWithItems, RepositoryError>({
    queryKey: ['invoice', 'public', token],
    queryFn: async () => {
      if (!token) {
        throw { message: 'Invoice token is required', reason: 'validation' } satisfies RepositoryError;
      }
      const result = await invoiceRepository.getInvoiceByToken(token);
      if (result.error || !result.data) {
        throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
      }
      return result.data;
    },
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

  const query = useQuery<InvoiceWithItems[], RepositoryError>({
    queryKey,
    queryFn: async () => {
      if (!jobId) {
        return [];
      }
      const result = await invoiceRepository.listByJob(jobId);
      if (result.error) {
        throw result.error;
      }
      return result.data ?? [];
    },
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
