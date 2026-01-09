import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, routePaths, useLocation, useNavigate } from '../../lib/router';
import { advanceJobStatus } from '../../lib/jobStatus';
import { useUpdateJobMutation } from '../../hooks/useJobMutations';
import { useJobInvoices } from '../../hooks/useInvoices';
import { jobRepository, type JobRecord } from '../../repositories/jobRepository';
import SyncBadge, { type SyncBadgeState } from '../../components/system/SyncBadge';
import { useNetworkStatus } from '../../lib/network';
import { formatCurrency } from '../../lib/currency';

const JobDetailPage = () => {
  const { t } = useTranslation();
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [actionError, setActionError] = useState<string | null>(null);
  const jobIdFromState = (state as { jobId?: string } | null)?.jobId;
  const jobIdFromPath = pathname.split('/').filter(Boolean)[1];
  const jobId = jobIdFromState || jobIdFromPath;
  const { invoices, loading: invoicesLoading, error: invoicesError } = useJobInvoices(jobId);

  const queryClient = useQueryClient();
  const updateMutation = useUpdateJobMutation(jobId ?? '');

  const query = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const result = await jobRepository.get(jobId ?? '');
      if (result.error || !result.data) {
        throw result.error ?? new Error('Job not found');
      }
      return result.data;
    },
    enabled: Boolean(jobId),
  });

  const job = query.data;

  const syncState: SyncBadgeState = useMemo(() => {
    if (!job) return 'ONLINE_SYNCING';
    if (job.id.startsWith('temp-')) {
      return isOnline ? 'ONLINE_SYNCING' : 'OFFLINE_DRAFT';
    }
    return isOnline ? 'ONLINE_SYNCED' : 'OFFLINE_DRAFT';
  }, [isOnline, job]);

  const performStatusChange = async (target: JobRecord['status']) => {
    if (!job) return;
    setActionError(null);

    let nextStatus: JobRecord['status'];
    try {
      nextStatus = advanceJobStatus(job.status, target);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update status';
      setActionError(message);
      return;
    }

    const previousJob = queryClient.getQueryData<JobRecord>(['job', jobId]);
    const previousLists = queryClient.getQueriesData<JobRecord[]>({ queryKey: ['jobs'] });
    const optimisticJob = { ...job, status: nextStatus, updated_at: new Date().toISOString() } satisfies JobRecord;

    queryClient.setQueryData(['job', jobId], optimisticJob);
    previousLists.forEach(([key, jobs]) => {
      if (!jobs) return;
      queryClient.setQueryData<JobRecord[]>(
        key,
        jobs.map((item) => (item.id === job.id ? { ...item, status: nextStatus, updated_at: optimisticJob.updated_at } : item)),
      );
    });

    try {
      await updateMutation.mutateAsync({ status: nextStatus });
    } catch (error) {
      queryClient.setQueryData(['job', jobId], previousJob);
      previousLists.forEach(([key, jobs]) => {
        queryClient.setQueryData<JobRecord[] | undefined>(key, jobs);
      });
      const message = error instanceof Error ? error.message : 'Unable to update status';
      setActionError(message);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  };

  const renderActions = () => {
    if (!job) return null;

    if (job.status === 'draft') {
      return (
        <>
          <button
            type="button"
            onClick={() => performStatusChange('scheduled')}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            Schedule Job
          </button>
          <button
            type="button"
            onClick={() => performStatusChange('cancelled')}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
          >
            Cancel
          </button>
        </>
      );
    }

    if (job.status === 'scheduled') {
      return (
        <>
          <button
            type="button"
            onClick={() => performStatusChange('in_progress')}
            className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
          >
            Start Job
          </button>
          <button
            type="button"
            onClick={() => performStatusChange('cancelled')}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
          >
            Cancel
          </button>
        </>
      );
    }

    if (job.status === 'in_progress') {
      return (
        <>
          <button
            type="button"
            onClick={() => performStatusChange('completed')}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            Complete Job
          </button>
          <button
            type="button"
            onClick={() => performStatusChange('cancelled')}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
          >
            Cancel
          </button>
        </>
      );
    }

    return null;
  };

  if (!jobId) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">No job selected.</p>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Back to Jobs
        </button>
      </main>
    );
  }

  if (query.isLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-24 animate-pulse rounded bg-slate-100" />
          <div className="h-24 animate-pulse rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (query.error || !job) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">Unable to load job details.</p>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Back to Jobs
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Job #{job.id}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
          <p className="text-sm text-slate-600">{job.description || 'No description provided'}</p>
        </div>
        <SyncBadge state={syncState} />
      </div>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Details</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-slate-600">Status</dt>
            <dd className="font-medium text-slate-900 capitalize">{job.status.replace('_', ' ')}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-slate-600">Client ID</dt>
            <dd className="font-medium text-slate-900">{job.client_id}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-slate-600">Property ID</dt>
            <dd className="font-medium text-slate-900">{job.property_id}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-slate-600">Service Date</dt>
            <dd className="font-medium text-slate-900">{job.service_date || 'Not scheduled'}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-slate-600">Created</dt>
            <dd className="font-medium text-slate-900">{new Date(job.created_at).toLocaleString()}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-slate-600">Updated</dt>
            <dd className="font-medium text-slate-900">{new Date(job.updated_at).toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{t('jobs.invoices.title')}</h2>
          <Link
            to={routePaths.createInvoice(jobId)}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {t('jobs.invoices.draftInvoice')}
          </Link>
        </div>
        {invoicesLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : invoicesError ? (
          <p className="text-sm text-red-700">{t('jobs.invoices.errorLoading')}</p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-slate-600">{t('jobs.invoices.emptyState')}</p>
        ) : (
          <ul className="space-y-2">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  to={routePaths.invoiceDetail(invoice.id)}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                    <p className="text-xs text-slate-500 capitalize">{invoice.status.replace('_', ' ')}</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {formatCurrency(invoice.total_amount ?? 0)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
          <span className="text-xs text-slate-500">Uses optimistic updates</span>
        </div>
        <div className="flex flex-wrap gap-2">{renderActions()}</div>
        {actionError ? <p className="text-xs text-red-700">{actionError}</p> : null}
      </section>

      <button
        type="button"
        onClick={() => navigate('/jobs')}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        Back to Jobs
      </button>
    </main>
  );
};

export default JobDetailPage;
