import { useMemo, useState } from 'react';
import { useInvoiceByToken } from '../../hooks/useInvoices';
import { useParams } from '../../lib/router';
import { formatCurrency } from '../../lib/currency';
import { billingService } from '../../services/billing';

const PublicInvoicePage = () => {
  const { token } = useParams<{ token: string }>();

  const { invoice, loading, error } = useInvoiceByToken(token);
  const [isProcessing, setIsProcessing] = useState(false);

  const taxData = useMemo(() => {
    if (!invoice?.tax_data || !Array.isArray(invoice.tax_data)) {
      return [] as { label: string; rate: number; amount: number }[];
    }
    return invoice.tax_data as { label: string; rate: number; amount: number }[];
  }, [invoice?.tax_data]);

  const contractorLabel =
    (invoice as { contractor_name?: string } | null)?.contractor_name ??
    invoice?.contractor_id ??
    'Contractor';

  const handlePayment = async () => {
    if (!invoice?.id) return;
    setIsProcessing(true);
    try {
      const { url } = await billingService.createInvoiceCheckoutSession(invoice.id, window.location.href);
      window.location.href = url;
    } catch (err) {
      console.error('Payment initiation failed:', err);
      alert('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

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
        <h1 className="text-xl font-semibold text-slate-900">Invoice not available</h1>
        <p className="text-sm text-slate-600">The invoice link may have expired or is invalid.</p>
      </main>
    );
  }

  const isPaid = invoice.status === 'paid';

  return (
    <main className="flex min-h-[60vh] flex-col gap-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            PD
          </div>
          <div>
            <p className="text-sm text-slate-600">Invoice {invoice.invoice_number}</p>
            <h1 className="text-2xl font-semibold text-slate-900">Invoice from {contractorLabel}</h1>
          </div>
        </div>
        <div className="mt-3 text-lg font-semibold text-slate-900">
          Total Due: {formatCurrency(invoice.total_amount)}
        </div>
        {isPaid && (
           <div className="mt-2 text-sm font-semibold text-emerald-600">
             Paid on {new Date(invoice.paid_at || '').toLocaleDateString()}
           </div>
        )}
      </header>

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
            <p className="text-sm text-slate-500">No line items were provided.</p>
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

      <section className="flex flex-wrap items-center gap-3">
        {!isPaid && (
            <button
            type="button"
            onClick={handlePayment}
            disabled={isProcessing}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            >
            {isProcessing ? 'Processing...' : 'Pay Now'}
            </button>
        )}
        {invoice.pdf_url ? (
          <a
            href={invoice.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Download PDF
          </a>
        ) : null}
      </section>
    </main>
  );
};

export default PublicInvoicePage;
