import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvoiceByToken } from '../../hooks/useInvoices';
import { useLocation } from '../../lib/router';
import { formatCurrency } from '../../lib/currency';

const PublicInvoicePage = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const token = segments[1];

  const { invoice, loading, error } = useInvoiceByToken(token);

  const taxData = useMemo(() => {
    if (!invoice?.tax_data || !Array.isArray(invoice.tax_data)) {
      return [] as { label: string; rate: number; amount: number }[];
    }
    return invoice.tax_data as { label: string; rate: number; amount: number }[];
  }, [invoice?.tax_data]);

  const contractorLabel =
    (invoice as { contractor_name?: string } | null)?.contractor_name ??
    invoice?.contractor_id ??
    t('jobs.invoices.publicPage.contractorDefault');

  if (loading) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-4">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded bg-slate-100" />
      </main>
    );
  }

  if (error || !invoice) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-2">
        <h1 className="text-xl font-semibold text-slate-900">{t('public.invoice.notAvailable')}</h1>
        <p className="text-sm text-slate-600">{t('public.invoice.expired')}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] flex-col gap-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            PD
          </div>
          <div>
            <p className="text-sm text-slate-600">{t('public.invoice.header', { number: invoice.invoice_number })}</p>
            <h1 className="text-2xl font-semibold text-slate-900">{t('public.invoice.from', { name: contractorLabel })}</h1>
          </div>
        </div>
        <div className="mt-3 text-lg font-semibold text-slate-900">
          {t('public.invoice.totalDue')}: {formatCurrency(invoice.total_amount)}
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{t('public.invoice.lineItems')}</h2>
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
            <p className="text-sm text-slate-500">{t('public.invoice.noItems')}</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>{t('public.invoice.subtotal')}</span>
          <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          {taxData.map((tax) => (
            <div key={tax.label} className="flex items-center justify-between">
              <span>{`${t(tax.label)} (${(tax.rate * 100).toFixed(2)}%)`}</span>
              <span className="font-semibold">{formatCurrency(tax.amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
          <span>{t('public.invoice.totalDue')}</span>
          <span>{formatCurrency(invoice.total_amount)}</span>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => console.log('Stripe Checkout')}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
        >
          {t('public.invoice.payNow')}
        </button>
        {invoice.pdf_url ? (
          <a
            href={invoice.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {t('public.invoice.downloadPdf')}
          </a>
        ) : null}
      </section>
    </main>
  );
};

export default PublicInvoicePage;
