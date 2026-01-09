import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvoiceMutations } from '../../hooks/useInvoices';
import type { InvoicePaymentMethod } from '../../repositories/invoiceRepository';

type MarkPaidModalProps = {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
};

const MarkPaidModal = ({ invoiceId, isOpen, onClose }: MarkPaidModalProps) => {
  const { t } = useTranslation();
  const { markAsPaid } = useInvoiceMutations();
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitting = markAsPaid.isLoading;

  const options = useMemo(() => [
    { value: 'cash' as const, label: t('jobs.invoices.markPaidModal.paymentMethods.cash') },
    { value: 'cheque' as const, label: t('jobs.invoices.markPaidModal.paymentMethods.cheque') },
    { value: 'etransfer' as const, label: t('jobs.invoices.markPaidModal.paymentMethods.etransfer') },
    { value: 'other' as const, label: t('jobs.invoices.markPaidModal.paymentMethods.other') },
  ], [t]);

  const handleClose = () => {
    // Reset form state when closing
    setPaymentMethod('cash');
    setPaymentNote('');
    setErrorMessage(null);
    onClose();
  };

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await markAsPaid.mutateAsync({
        id: invoiceId,
        method: paymentMethod,
        note: paymentNote || undefined,
      });
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to mark invoice as paid.';
      setErrorMessage(message);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">{t('jobs.invoices.markPaidModal.title')}</h3>
        <p className="mt-1 text-sm text-slate-600">{t('jobs.invoices.markPaidModal.subtitle')}</p>
        {errorMessage ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="payment_method">
              {t('jobs.invoices.markPaidModal.paymentMethodLabel')}
            </label>
            <select
              id="payment_method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as InvoicePaymentMethod)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {options.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="payment_note">
              {t('jobs.invoices.markPaidModal.noteLabel')}
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
            onClick={handleClose}
            className="text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            {t('jobs.invoices.markPaidModal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t('jobs.invoices.markPaidModal.saving') : t('jobs.invoices.markPaidModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkPaidModal;
