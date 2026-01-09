import { useMemo, useState } from 'react';
import InvoiceForm from '../../components/invoices/InvoiceForm';
import { useInvoice, useInvoiceMutations } from '../../hooks/useInvoices';
import { useLocation, useNavigate } from '../../lib/router';
import { formatCurrency } from '../../lib/currency';
import { INVOICE_PAYMENT_METHODS } from '../../schemas/invoice';

const statusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  void: 'bg-red-100 text-red-700',
  overdue: 'bg-amber-100 text-amber-700',
};

const InvoiceDetailPage = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const segments = pathname.split('/').filter(Boolean);
  const invoiceId = segments[1];

  const { invoice, loading, error } = useInvoice(invoiceId);
  const { markAsPaid } = useInvoiceMutations();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<(typeof INVOICE_PAYMENT_METHODS)[number]>('cash');
  const [paymentNote, setPaymentNote] = useState('');
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
        <p className="text-sm text-red-700">No invoice selected.</p>
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
        <p className="text-sm text-red-700">Unable to load invoice details.</p>
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

  if (invoice.status === 'draft') {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <InvoiceForm jobId={invoice.job_id} invoice={invoice} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">Invoice {invoice.invoice_number}</p>
          <h1 className="text-2xl font-semibold text-slate-900">Invoice Detail</h1>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            statusStyles[invoice.status] ?? 'bg-slate-100 text-slate-700'
          }`}
        >
          {invoice.status}
        </span>
      </header>

      {actionError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">PDF</p>
            {invoice.pdf_url ? (
              <a
                href={invoice.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Download PDF
              </a>
            ) : (
              <p className="text-sm text-slate-500">Not available</p>
            )}
          </div>
          {invoice.status === 'sent' ? (
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              Mark as Paid
            </button>
          ) : null}
        </div>

        {invoice.status === 'paid' ? (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p>
              Paid via <span className="font-semibold capitalize">{invoice.payment_method ?? 'unknown'}</span>
            </p>
            {invoice.paid_at ? (
              <p className="text-xs text-emerald-700">
                Paid on {new Date(invoice.paid_at).toLocaleDateString('en-CA')}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Line Items</h2>
        <div className="mt-3 space-y-3">
          {invoice.invoice_items?.length ? (
            invoice.invoice_items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</p>
                </div>
                <p className="text-xs text-slate-500">
                  Qty {item.quantity} × {formatCurrency(item.unit_price)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No line items were recorded.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>Subtotal</span>
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
          <span>Total Due</span>
          <span>{formatCurrency(invoice.total_amount)}</span>
        </div>
      </section>

      {showPaymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Record Manual Payment</h3>
            <p className="mt-1 text-sm text-slate-600">Capture offline payment details.</p>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700" htmlFor="payment_method">
                  Payment Method
                </label>
                <select
                  id="payment_method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as (typeof INVOICE_PAYMENT_METHODS)[number])}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {INVOICE_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700" htmlFor="payment_note">
                  Note (optional)
                </label>
                <textarea
                  id="payment_note"
                  rows={3}
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setActionError(null);
                  try {
                    await markAsPaid.mutateAsync({ id: invoice.id, method: paymentMethod, note: paymentNote || undefined });
                    setShowPaymentModal(false);
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unable to mark invoice as paid.';
                    setActionError(message);
                  }
                }}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default InvoiceDetailPage;
