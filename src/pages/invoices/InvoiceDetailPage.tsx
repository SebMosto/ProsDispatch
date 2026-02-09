import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InvoiceForm from '../../components/invoices/InvoiceForm';
import MarkPaidModal from '../../components/invoices/MarkPaidModal';
import { useInvoice } from '../../hooks/useInvoices';
import { Link, useLocation, useNavigate } from '../../lib/router';
import { formatCurrency } from '../../lib/currency';

const statusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  void: 'bg-red-100 text-red-700',
  overdue: 'bg-amber-100 text-amber-700',
};

const InvoiceDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const segments = pathname.split('/').filter(Boolean);
  const invoiceId = segments[1];

  const { invoice, loading, error } = useInvoice(invoiceId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const taxData = useMemo(() => {
    if (!invoice?.tax_data || !Array.isArray(invoice.tax_data)) {
      return [] as { label: string; rate: number; amount: number }[];
    }
    return invoice.tax_data as { label: string; rate: number; amount: number }[];
  }, [invoice?.tax_data]);

  if (!invoiceId) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('jobs.invoices.detailPage.errorNoInvoice')}</p>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {t('jobs.invoices.detailPage.backToJobs')}
        </button>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-24 animate-pulse rounded bg-slate-100" />
          <div className="h-24 animate-pulse rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (error || !invoice) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('jobs.invoices.detailPage.errorLoading')}</p>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {t('jobs.invoices.detailPage.backToJobs')}
        </button>
      </main>
    );
  }

  if (invoice.status === 'draft') {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <InvoiceForm jobId={invoice.job_id} invoice={invoice} />
      </main>
    );
  }

  const publicToken =
    (invoice as { public_token?: string; token?: string } | null)?.public_token ??
    (invoice as { token?: string } | null)?.token ??
    null;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{t('jobs.invoices.detailPage.invoiceLabel', { number: invoice.invoice_number })}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{t('jobs.invoices.detailPage.title')}</h1>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            statusStyles[invoice.status] ?? 'bg-slate-100 text-slate-700'
          }`}
        >
          {invoice.status}
        </span>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        {publicToken ? (
          <Link
            to={`/pay/${publicToken}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {t('jobs.invoices.detailPage.viewAsHomeowner')}
          </Link>
        ) : (
          <span className="rounded-lg border border-dashed border-slate-200 px-4 py-2 text-sm text-slate-400">
            {t('jobs.invoices.detailPage.homeownerLinkUnavailable')}
          </span>
        )}
        {invoice.status === 'sent' ? (
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            {t('jobs.invoices.detailPage.markAsPaid')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setActionError(null);
            if (!window.confirm(t('jobs.invoices.detailPage.voidConfirm'))) {
              return;
            }
            console.info('Void invoice requested', { invoice_id: invoice.id });
          }}
          className="inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
        >
          {t('jobs.invoices.detailPage.void')}
        </button>
      </section>

      {actionError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">{t('jobs.invoices.detailPage.pdfLabel')}</p>
            {invoice.pdf_url ? (
              <a
                href={invoice.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                {t('jobs.invoices.detailPage.downloadPdf')}
              </a>
            ) : (
              <p className="text-sm text-slate-500">{t('jobs.invoices.detailPage.pdfNotAvailable')}</p>
            )}
          </div>
        </div>

        {invoice.status === 'paid' ? (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p>
              {t('jobs.invoices.detailPage.paidVia', { method: invoice.payment_method ?? t('jobs.invoices.detailPage.unknown') })}
            </p>
            {invoice.paid_at ? (
              <p className="text-xs text-emerald-700">
                {t('jobs.invoices.detailPage.paidOn', { 
                  date: new Date(invoice.paid_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA')
                })}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{t('jobs.invoices.detailPage.lineItemsTitle')}</h2>
        <div className="mt-3 space-y-3">
          {invoice.invoice_items?.length ? (
            invoice.invoice_items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {t('jobs.invoices.detailPage.qtyFormat', { quantity: item.quantity, price: formatCurrency(item.unit_price) })}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">{t('jobs.invoices.detailPage.noLineItems')}</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>{t('jobs.invoices.detailPage.subtotalLabel')}</span>
          <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          {taxData.map((tax) => (
            <div key={tax.label} className="flex items-center justify-between">
              <span>{`${tax.label} (${(tax.rate * 100).toFixed(2)}%)`}</span>
              <span className="font-semibold">{formatCurrency(tax.amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
          <span>{t('jobs.invoices.detailPage.totalDueLabel')}</span>
          <span>{formatCurrency(invoice.total_amount)}</span>
        </div>
      </section>

      <MarkPaidModal
        invoiceId={invoice.id}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </main>
  );
};

export default InvoiceDetailPage;
