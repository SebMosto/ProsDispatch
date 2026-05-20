import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '../../lib/router';
import { useInvoicesByContractor } from '../../hooks/useInvoices';
import { useJobs } from '../../hooks/useJobs';
import { useClients } from '../../hooks/useClients';
import { formatCurrency } from '../../lib/currency';
import { formatDate } from '../../lib/date';

const InvoicesListPage = () => {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || 'en').startsWith('fr') ? 'fr-CA' : 'en-CA';
  const { invoices, loading, error, refetch } = useInvoicesByContractor();
  const { jobs } = useJobs();
  const { clients } = useClients();
  const errorText = error?.reason === 'network' ? t('errors.timeout') : t('errors.unexpected');

  const jobMap = useMemo(
    () => jobs.reduce<Record<string, { title: string; client_id: string }>>(
      (acc, j) => ({ ...acc, [j.id]: { title: j.title, client_id: j.client_id } }),
      {}
    ),
    [jobs]
  );

  const clientMap = useMemo(
    () => clients.reduce<Record<string, string>>((acc, c) => ({ ...acc, [c.id]: c.name }), {}),
    [clients]
  );

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">{t('invoices.list.pageTitle')}</h1>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{errorText}</p>
          <button
            className="mt-2 inline-flex h-[36px] items-center justify-center rounded-[7px] border-2 border-[#0F172A] bg-[#FF5C1B] px-[13px] text-xs font-bold text-[#1F1308] shadow-brutal transition hover:translate-x-[-1px] hover:translate-y-[-1px]"
            onClick={() => { refetch().catch(() => {}); }}
          >
            {t('invoices.list.retry')}
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{t('invoices.list.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((invoice) => {
            const jobData = jobMap[invoice.job_id];
            const clientName = jobData ? (clientMap[jobData.client_id] ?? null) : null;
            return (
              <li key={invoice.id}>
                <Link
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {invoice.invoice_number ?? `#${invoice.id.slice(0, 8)}`}
                    </p>
                    {clientName ? (
                      <p className="truncate text-xs text-slate-500">{clientName}</p>
                    ) : null}
                    {jobData?.title ? (
                      <p className="truncate text-xs text-slate-400">{jobData.title}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-semibold text-slate-900">
                      {formatCurrency((invoice.total_amount ?? 0) / 100, 'CAD', locale)}
                    </span>
                    {invoice.date_issued ? (
                      <span className="text-xs text-slate-500">{formatDate(invoice.date_issued)}</span>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'void'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t(`jobs.invoices.form.status${invoice.status.charAt(0).toUpperCase()}${invoice.status.slice(1)}`)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
};

export default InvoicesListPage;
