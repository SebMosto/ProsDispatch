import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Link, useNavigate } from '../../lib/router';
import { formatCurrency } from '../../lib/currency';
import { clientRepository } from '../../repositories/clientRepository';
import { useClientDetail } from '../../hooks/useClientDetail';
import JobStatusBadge from '../../components/jobs/JobStatusBadge';
import type { JobStatus } from '../../schemas/job';

const ACTIVE_JOB_STATUSES: JobStatus[] = ['draft', 'sent', 'approved', 'in_progress', 'invoiced'];

function formatLastServicedDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return null;
  }
}


const ClientDetailPage = () => {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || 'en').startsWith('fr') ? 'fr-CA' : 'en-CA';
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data, loading, error } = useClientDetail(id ?? undefined);

  const hasActiveJobs = useMemo(() => {
    if (!data?.jobs) return false;
    return data.jobs.some((j) => ACTIVE_JOB_STATUSES.includes(j.status as JobStatus));
  }, [data?.jobs]);

  const handleDelete = async () => {
    if (!id) return;
    setActionError(null);
    setActionSuccess(null);
    setDeleteConfirmOpen(false);

    try {
      const result = await clientRepository.softDelete(id);
      if (result.error) throw result.error;
      setActionSuccess(t('clients.detail.deleted'));
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('clients.detail.error');
      setActionError(message);
    }
  };

  if (!id) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('clients.detail.noSelection')}</p>
        <Link
          to="/clients"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {t('clients.detail.backToClients')}
        </Link>
      </main>
    );
  }

  if (loading) {
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

  if (error || !data?.client) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('clients.detail.error')}</p>
        <Link
          to="/clients"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {t('clients.detail.backToClients')}
        </Link>
      </main>
    );
  }

  const { client, properties, jobs, invoices, summary } = data;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link to="/clients" className="hover:underline">
          {t('clients.list.pageTitle')}
        </Link>
        <span className="mx-2" aria-hidden>›</span>
        <span className="font-medium text-slate-900">{client.name}</span>
      </nav>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">{client.name}</h1>
            {client.email ? (
              <p className="text-sm text-slate-700">{client.email}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                  client.type === 'business' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {client.type === 'business' ? t('clients.detail.types.business') : t('clients.detail.types.individual')}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {client.preferred_language === 'fr' ? 'FR' : 'EN'}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {(() => {
                const dateStr = formatLastServicedDate(summary.lastServicedAt);
                return dateStr
                  ? t('clients.detail.lastServiced', { date: dateStr })
                  : t('clients.detail.neverServiced');
              })()}
            </p>
          </div>
          <div className="flex min-h-[44px] flex-wrap items-center gap-2">
            <Link
              to={`/clients/${client.id}/edit`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              {t('clients.detail.editClient')}
            </Link>
            {!hasActiveJobs ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
              >
                {t('clients.detail.deleteClient')}
              </button>
            ) : (
              <span className="text-xs text-slate-500" title={t('clients.detail.deleteBlocked')}>
                {t('clients.detail.deleteBlocked')}
              </span>
            )}
          </div>
        </div>
        {actionSuccess ? (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
            {actionSuccess}
          </p>
        ) : null}
        {actionError ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {actionError}
          </p>
        ) : null}
      </section>

      {deleteConfirmOpen ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{t('clients.detail.deleteConfirm')}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
            >
              {t('jobs.invoices.markPaidModal.cancel')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              {t('clients.detail.deleteClient')}
            </button>
          </div>
        </div>
      ) : null}

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{t('clients.detail.properties')}</h2>
          <Link
            to={`/clients/${client.id}/properties/new`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            {t('clients.detail.addProperty')}
          </Link>
        </header>
        {properties.length === 0 ? (
          <p className="text-sm text-slate-700">{t('clients.detail.noProperties')}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {properties.map((property) => (
              <li key={property.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  {property.nickname ?? t('clients.detail.primaryProperty')}
                </p>
                <p className="text-xs text-slate-700">{property.address_line1}</p>
                {property.address_line2 ? <p className="text-xs text-slate-600">{property.address_line2}</p> : null}
                <p className="text-xs text-slate-700">
                  {property.city}, {property.province} {property.postal_code}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('clients.detail.jobHistory')} ({summary.totalJobs})
        </h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-700">{t('clients.detail.noJobs')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  to={`/jobs/${job.id}`}
                  className="flex min-h-[44px] flex-wrap items-center justify-between gap-2 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 rounded"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-600">
                      {job.service_date
                        ? new Date(job.service_date).toLocaleDateString()
                        : new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('clients.detail.invoiceSummary')}</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-700">{t('clients.detail.noInvoices')}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-slate-600">{t('clients.detail.totalInvoiced')}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(summary.totalInvoiced / 100, 'CAD', locale)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">{t('clients.detail.totalPaid')}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(summary.totalPaid / 100, 'CAD', locale)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">{t('clients.detail.outstanding')}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(summary.outstandingBalance / 100, 'CAD', locale)}
                </p>
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="flex min-h-[44px] flex-wrap items-center justify-between gap-2 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 rounded"
                  >
                    <span className="font-medium text-slate-900">{inv.invoice_number}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {inv.status}
                    </span>
                    <span className="text-sm text-slate-700">
                      {formatCurrency((inv.total_amount ?? 0) / 100, 'CAD', locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
};

export default ClientDetailPage;
