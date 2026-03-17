import { useTranslation } from 'react-i18next';
import { Link } from '../../lib/router';
import { useInvoicesByContractor } from '../../hooks/useInvoices';

const InvoicesListPage = () => {
  const { t } = useTranslation();
  const { invoices, loading, error, refetch } = useInvoicesByContractor();

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-600">{t('invoices.list.pageTitle')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('invoices.list.header')}</h1>
        <p className="text-sm text-slate-600">{t('invoices.list.subHeader')}</p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{t('invoices.list.error')}</p>
          <button
            className="mt-2 text-sm font-semibold underline"
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
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link
                to={`/invoices/${invoice.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-900">
                  {invoice.invoice_number ?? `#${invoice.id.slice(0, 8)}`}
                </span>
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default InvoicesListPage;
