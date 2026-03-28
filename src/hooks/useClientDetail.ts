import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../lib/auth';
import { clientRepository } from '../repositories/clientRepository';
import { invoiceRepository, type InvoiceRecord } from '../repositories/invoiceRepository';
import { jobRepository, type JobRecord } from '../repositories/jobRepository';
import { propertyRepository, type PropertyRecord } from '../repositories/propertyRepository';
import type { RepositoryError } from '../repositories/base';
import type { ClientSummary } from '../types/clients';

export type ClientDetailData = {
  client: Awaited<ReturnType<typeof clientRepository.get>>['data'];
  properties: PropertyRecord[];
  jobs: JobRecord[];
  invoices: InvoiceRecord[];
  summary: ClientSummary;
};

function computeSummary(jobs: JobRecord[], invoices: InvoiceRecord[]): ClientSummary {
  const completedOrPaid = jobs.filter(
    (j) => j.status === 'completed' || j.status === 'paid'
  );
  const lastServicedAt =
    completedOrPaid.length > 0
      ? completedOrPaid.reduce((latest, j) => {
          const updated = j.updated_at ?? j.created_at ?? '';
          return updated > latest ? updated : latest;
        }, '')
      : null;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);
  const outstandingBalance = totalInvoiced - totalPaid;

  return {
    totalJobs: jobs.length,
    lastServicedAt,
    totalInvoiced,
    totalPaid,
    outstandingBalance,
  };
}

export function useClientDetail(clientId: string | undefined) {
  const { user } = useAuth();
  const queryKey = useMemo(() => ['clientDetail', clientId], [clientId]);

  const clientFn = useCallback(async () => {
    if (!clientId) throw new Error('clientId required');
    const result = await clientRepository.get(clientId);
    if (result.error || !result.data) throw result.error ?? new Error('Unable to load client');
    return result.data;
  }, [clientId]);

  const propertiesFn = useCallback(async () => {
    if (!clientId) return [];
    const result = await propertyRepository.list({ clientId });
    if (result.error) throw result.error;
    return result.data ?? [];
  }, [clientId]);

  const jobsFn = useCallback(async () => {
    if (!clientId) return [];
    const result = await jobRepository.listByClient(clientId);
    if (result.error) throw result.error;
    return result.data ?? [];
  }, [clientId]);

  const invoicesFn = useCallback(async () => {
    if (!clientId) return [];
    const result = await invoiceRepository.listByClient(clientId);
    if (result.error) throw result.error;
    return result.data ?? [];
  }, [clientId]);

  const results = useQueries({
    queries: [
      {
        queryKey: [queryKey[0], queryKey[1], 'client'],
        queryFn: clientFn,
        enabled: !!user && Boolean(clientId),
      },
      {
        queryKey: [queryKey[0], queryKey[1], 'properties'],
        queryFn: propertiesFn,
        enabled: !!user && Boolean(clientId),
      },
      {
        queryKey: [queryKey[0], queryKey[1], 'jobs'],
        queryFn: jobsFn,
        enabled: !!user && Boolean(clientId),
      },
      {
        queryKey: [queryKey[0], queryKey[1], 'invoices'],
        queryFn: invoicesFn,
        enabled: !!user && Boolean(clientId),
      },
    ],
  });

  const [clientQuery, propertiesQuery, jobsQuery, invoicesQuery] = results;

  const loading =
    clientQuery.isLoading ||
    propertiesQuery.isLoading ||
    jobsQuery.isLoading ||
    invoicesQuery.isLoading;

  const error = useMemo((): RepositoryError | null => {
    const e =
      clientQuery.error ??
      propertiesQuery.error ??
      jobsQuery.error ??
      invoicesQuery.error;
    if (!e) return null;
    if (typeof e === 'object' && e !== null && 'reason' in e) return e as RepositoryError;
    return { message: (e as Error).message, reason: 'unknown' as const, cause: e };
  }, [
    clientQuery.error,
    propertiesQuery.error,
    jobsQuery.error,
    invoicesQuery.error,
  ]);

  const data = useMemo((): ClientDetailData | null => {
    const client = clientQuery.data ?? null;
    if (!client) return null;
    const properties = propertiesQuery.data ?? [];
    const jobs = jobsQuery.data ?? [];
    const invoices = invoicesQuery.data ?? [];
    const summary = computeSummary(jobs, invoices);
    return {
      client,
      properties,
      jobs,
      invoices,
      summary,
    };
  }, [
    clientQuery.data,
    propertiesQuery.data,
    jobsQuery.data,
    invoicesQuery.data,
  ]);

  const refetch = useCallback(() => {
    void clientQuery.refetch();
    void propertiesQuery.refetch();
    void jobsQuery.refetch();
    void invoicesQuery.refetch();
  }, [clientQuery, propertiesQuery, jobsQuery, invoicesQuery]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refetch,
    }),
    [data, loading, error, refetch]
  );
}

export type UseClientDetailReturn = ReturnType<typeof useClientDetail>;
