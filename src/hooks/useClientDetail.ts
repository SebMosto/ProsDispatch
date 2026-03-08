import { useState, useEffect } from 'react';
import { clientRepository } from '../repositories/clientRepository';
import { propertyRepository } from '../repositories/propertyRepository';
import { jobRepository } from '../repositories/jobRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';
import type { ClientRecord } from '../repositories/clientRepository';
import type { PropertyRecord } from '../repositories/propertyRepository';
import type { JobRecord } from '../schemas/job';
import type { InvoiceRecord } from '../repositories/invoiceRepository';

export interface ClientSummary {
  totalJobs: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  lastServicedAt: string | null;
}

export interface ClientDetailData {
  client: ClientRecord;
  properties: PropertyRecord[];
  jobs: JobRecord[];
  invoices: InvoiceRecord[];
  summary: ClientSummary;
}

export function useClientDetail(clientId: string) {
  const [data, setData] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!clientId) return;

      setLoading(true);
      setError(null);

      try {
        const [
          clientRes,
          propertiesRes,
          jobsRes,
          invoicesRes
        ] = await Promise.all([
          clientRepository.get(clientId),
          propertyRepository.list({ client_id: clientId }),
          jobRepository.listByClient(clientId),
          invoiceRepository.listByClient(clientId)
        ]);

        if (!mounted) return;

        if (clientRes.error) throw new Error(clientRes.error.message);

        const client = clientRes.data!;
        const properties = propertiesRes.data || [];
        const jobs = jobsRes.data || [];
        const invoices = invoicesRes.data || [];

        const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const outstandingBalance = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

        const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'invoiced' || j.status === 'paid');
        const sortedCompleted = completedJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastServicedAt = sortedCompleted.length > 0 ? (sortedCompleted[0]!.service_date || sortedCompleted[0]!.created_at) : null;

        setData({
          client,
          properties,
          jobs,
          invoices,
          summary: {
            totalJobs: jobs.length,
            totalInvoiced,
            totalPaid,
            outstandingBalance,
            lastServicedAt
          }
        });
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [clientId]);

  return { data, loading, error };
}
