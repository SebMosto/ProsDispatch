import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { useInvoiceByToken } from '../../hooks/useInvoices';
import { useLocation } from '../../lib/router';
import { formatCurrency } from '../../lib/currency';
import { isSafeUrl } from '../../lib/security';
import { stripePromise } from '../../lib/stripe';
import { useNetworkStatus } from '../../lib/network';
import { supabase } from '../../lib/supabase';

const PaymentForm = ({ disabled }: { disabled: boolean }) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message ?? t('errors.unexpected'));
    } else {
      setMessage(t('invoices.public.thankYou'));
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      <button
        type="button"
        disabled={disabled || submitting || !stripe || !elements}
        onClick={handleSubmit}
        className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t('common.processing') : t('invoices.public.payNow')}
      </button>
    </div>
  );
};

const PublicInvoicePage = () => {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || 'en').startsWith('fr') ? 'fr-CA' : 'en-CA';
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const token = segments[1];
  const { isOnline } = useNetworkStatus();

  const { invoice, loading, error } = useInvoiceByToken(token);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);

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

  const status = invoice?.status;

  useEffect(() => {
    const bootstrapPaymentIntent = async () => {
      if (!invoice || !token || status !== 'sent') return;
      setCreatingIntent(true);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
          body: { token },
        });

        if (fnError || !data?.client_secret) {
          // Payment intent creation failed; leave page in read-only mode.
          console.error('create-payment-intent error', fnError ?? data?.error);
          return;
        }

        setClientSecret(data.client_secret as string);
      } finally {
        setCreatingIntent(false);
      }
    };

    void bootstrapPaymentIntent();
  }, [invoice, status, token]);

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
        <h1 className="text-xl font-semibold text-slate-900">{t('invoices.public.expired')}</h1>
        <p className="text-sm text-slate-600">{t('public.invoice.expired')}</p>
      </main>
    );
  }

  if (status === 'paid') {
    return (
      <main className="flex min-h-[60vh] flex-col gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{t('invoices.public.alreadyPaid')}</h1>
        <p className="text-sm text-slate-600">{t('invoices.public.thankYou')}</p>
      </main>
    );
  }

  if (status === 'void') {
    return (
      <main className="flex min-h-[60vh] flex-col gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{t('invoices.public.voided')}</h1>
        <p className="text-sm text-slate-600">{t('public.invoice.expired')}</p>
      </main>
    );
  }

  const paymentDisabled = !isOnline || !clientSecret || creatingIntent;

  return (
    <main className="flex min-h-[60vh] flex-col gap-6 pb-20">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {t('layout.initials')}
          </div>
          <div>
            <p className="text-sm text-slate-600">
              {t('public.invoice.header', { number: invoice.invoice_number })}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {t('public.invoice.from', { name: contractorLabel })}
            </h1>
          </div>
        </div>
        <div className="mt-3 text-lg font-semibold text-slate-900">
          {t('public.invoice.totalDue')}: {formatCurrency(invoice.total_amount / 100, 'CAD', locale)}
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{t('public.invoice.lineItems')}</h2>
        <div className="mt-3 space-y-3">
          {invoice.invoice_items?.length ? (
            invoice.invoice_items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.amount / 100, 'CAD', locale)}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {t('jobs.invoices.detailPage.qtyFormat', {
                    quantity: item.quantity,
                    price: formatCurrency(item.unit_price / 100, 'CAD', locale),
                  })}
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
          <span className="font-semibold">{formatCurrency(invoice.subtotal / 100, 'CAD', locale)}</span>
        </div>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          {taxData.map((tax) => (
            <div key={tax.label} className="flex items-center justify-between">
              <span>{`${t(`taxes.${tax.label}`, tax.label)} (${(tax.rate * 100).toFixed(2)}%)`}</span>
              <span className="font-semibold">
                {formatCurrency(tax.amount / 100, 'CAD', locale)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
          <span>{t('public.invoice.totalDue')}</span>
          <span>{formatCurrency(invoice.total_amount / 100, 'CAD', locale)}</span>
        </div>
      </section>

      <section className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {!isOnline ? (
            <p className="text-xs text-slate-600">{t('invoices.public.offline')}</p>
          ) : null}
          {invoice.pdf_url && isSafeUrl(invoice.pdf_url) ? (
            <a
              href={invoice.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {t('public.invoice.downloadPdf')}
            </a>
          ) : null}
          {stripePromise && clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'stripe' },
              }}
            >
              <PaymentForm disabled={paymentDisabled} />
            </Elements>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              {t('invoices.public.payNow')}
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default PublicInvoicePage;
