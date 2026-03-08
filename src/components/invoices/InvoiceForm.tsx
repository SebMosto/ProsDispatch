import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAuth } from '../../lib/auth';
import type { Resolver } from 'react-hook-form';
import { useNavigate } from '../../lib/router';
import { calculateInvoiceTotals } from '../../lib/taxCalculator';
import { formatCurrency } from '../../lib/currency';
import { useInvoiceMutations } from '../../hooks/useInvoices';
import type { InvoiceDraftInput } from '../../schemas/invoice';
import type { InvoiceWithItems } from '../../repositories/invoiceRepository';

type InvoiceFormProps = {
  jobId?: string;
  invoice?: InvoiceWithItems | null;
};

// Internal types for form state
interface InvoiceFormValues {
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (value: number) => value / 100;

const buildDefaultItems = (invoice?: InvoiceWithItems | null): InvoiceFormValues['items'] => {
  if (!invoice?.invoice_items?.length) return [];
  return invoice.invoice_items.map((item) => ({
    id: crypto.randomUUID(),
    description: item.description,
    quantity: item.quantity,
    unitPrice: fromCents(item.unit_price),
  }));
};

const InvoiceForm = ({ jobId, invoice }: InvoiceFormProps) => {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || 'en').startsWith('fr') ? 'fr-CA' : 'en-CA';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createDraft, updateDraft, finalize } = useInvoiceMutations();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [localInvoice, setLocalInvoice] = useState<InvoiceWithItems | null>(invoice ?? null);

  // Memoize the schema to react to language changes
  const InvoiceFormSchema = useMemo(() => {
    const InvoiceItemFormSchema = z.object({
      id: z.string(),
      description: z.string().min(1, t('validation.descriptionRequired')),
      quantity: z.number().positive(t('validation.qtyPositive')),
      unitPrice: z.number().min(0, t('validation.unitPriceNonNegative')),
    });

    return z.object({
      items: z.array(InvoiceItemFormSchema),
    });
  }, [t]);

  useEffect(() => {
    setLocalInvoice(invoice ?? null);
  }, [invoice]);

  const activeInvoice = localInvoice ?? invoice ?? null;

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues: {
      items: buildDefaultItems(invoice),
    },
  });

  const [items, setItems] = useState<InvoiceFormValues['items']>(buildDefaultItems(invoice));

  useEffect(() => {
    setItems(buildDefaultItems(invoice));
  }, [invoice]);

  useEffect(() => {
    setValue('items', items);
  }, [items, setValue]);

  const computedItems = useMemo(() => {
    return items.map((item) => {
      const quantity = Number.isFinite(item?.quantity) ? item.quantity : 0;
      const unitPrice = Number.isFinite(item?.unitPrice) ? item.unitPrice : 0;
      const unitPriceCents = toCents(unitPrice);
      const amount = Math.round(quantity * unitPriceCents);
      return {
        description: item?.description ?? '',
        quantity,
        unit_price: unitPriceCents,
        amount,
      };
    });
  }, [items]);

  const totals = useMemo(() => {
    return calculateInvoiceTotals(computedItems);
  }, [computedItems]);

  const buildDraftInput = (values: InvoiceFormValues): InvoiceDraftInput => {
    const lineItems = values.items.map((item) => {
      const unitPriceCents = toCents(item.unitPrice);
      return {
        description: item.description,
        quantity: item.quantity,
        unit_price: unitPriceCents,
        amount: Math.round(item.quantity * unitPriceCents),
      };
    });

    const updatedTotals = calculateInvoiceTotals(lineItems);

    return {
      job_id: activeInvoice?.job_id ?? jobId ?? '',
      contractor_id: activeInvoice?.contractor_id ?? user?.id ?? '',
      invoice_number: activeInvoice?.invoice_number ?? 'PENDING',
      status: 'draft',
      items: lineItems,
      subtotal: updatedTotals.subtotal,
      tax_data: updatedTotals.taxData,
      total_amount: updatedTotals.total,
      pdf_url: activeInvoice?.pdf_url ?? null,
      payment_method: activeInvoice?.payment_method ?? null,
      payment_note: activeInvoice?.payment_note ?? null,
      paid_at: activeInvoice?.paid_at ?? null,
      stripe_payment_intent_id: activeInvoice?.stripe_payment_intent_id ?? null,
    };
  };

  const saveDraft = async (values: InvoiceFormValues, options?: { silent?: boolean }) => {
    const contractorId = activeInvoice?.contractor_id ?? user?.id;
    const targetJobId = activeInvoice?.job_id ?? jobId;

    if (!contractorId) {
      throw new Error(t('jobs.invoices.form.errorAuth'));
    }

    if (!targetJobId) {
      throw new Error(t('jobs.invoices.form.errorJob'));
    }

    const input = buildDraftInput(values);

    const savedInvoice = activeInvoice?.id
      ? await updateDraft.mutateAsync({ id: activeInvoice.id, input })
      : await createDraft.mutateAsync({ jobId: targetJobId, input });

    setLocalInvoice(savedInvoice);

    if (!options?.silent) {
      setActionSuccess(t('jobs.invoices.form.successDraft'));
    }

    if (!activeInvoice?.id && savedInvoice?.id) {
      navigate(`/invoices/${savedInvoice.id}`);
    }

    return savedInvoice;
  };

  const onSaveDraft = handleSubmit(async (values) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await saveDraft(values);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('jobs.invoices.form.errorDraft');
      setActionError(message);
    }
  });

  const onFinalize = handleSubmit(async (values) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const savedInvoice = await saveDraft(values, { silent: true });
      const invoiceId = savedInvoice?.id ?? activeInvoice?.id;

      if (!invoiceId) {
        throw new Error(t('jobs.invoices.form.errorBeforeFinalize'));
      }

      await finalize.mutateAsync(invoiceId);
      setActionSuccess(t('jobs.invoices.form.successFinalized'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('jobs.invoices.form.errorFinalize');
      setActionError(message);
    }
  });

  const loadingState = isSubmitting || createDraft.isPending || updateDraft.isPending || finalize.isPending;
  const getItemError = (index: number, field: 'description' | 'quantity' | 'unitPrice') => {
    return errors.items?.[index]?.[field]?.message;
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="space-y-1">
        <p className="text-sm font-medium text-slate-600">{t('jobs.invoices.form.header')}</p>
        <h2 className="text-lg font-semibold text-slate-900">
          {activeInvoice ? t('jobs.invoices.form.invoiceTitle', { number: activeInvoice.invoice_number }) : t('jobs.invoices.form.createTitle')}
        </h2>
        <p className="text-sm text-slate-600">{t('jobs.invoices.form.subtitle')}</p>
      </header>

      {actionSuccess ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {actionSuccess}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={onSaveDraft} noValidate>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-800" htmlFor="invoice_number">
              {t('jobs.invoices.form.invoiceNumberLabel')}
            </label>
            <input
              id="invoice_number"
              type="text"
              value={activeInvoice?.invoice_number ?? t('jobs.invoices.form.invoiceNumberPlaceholder')}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800">{t('jobs.invoices.form.statusLabel')}</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {t('jobs.invoices.form.statusDraft')}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">{t('jobs.invoices.form.lineItemsTitle')}</h3>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                  },
                ])
              }
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {t('jobs.invoices.form.addItem')}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              {t('jobs.invoices.form.noItems')}
            </div>
          ) : null}

          {items.map((item, index) => {
            const lineAmount = computedItems[index]?.amount ?? 0;

            return (
              <div key={item.id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{t('jobs.invoices.form.itemLabel', { number: index + 1 })}</p>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_entry, entryIndex) => entryIndex !== index))}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    {t('jobs.invoices.form.removeItem')}
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600" htmlFor={`items.${index}.description`}>
                    {t('jobs.invoices.form.descriptionLabel')}
                  </label>
                  <input
                    id={`items.${index}.description`}
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    value={item.description}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setItems((prev) =>
                        prev.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, description: nextValue } : entry,
                        ),
                      );
                    }}
                  />
                  {getItemError(index, 'description') ? <p className="text-xs text-red-600">{getItemError(index, 'description')}</p> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600" htmlFor={`items.${index}.quantity`}>
                      {t('jobs.invoices.form.qtyLabel')}
                    </label>
                    <input
                      id={`items.${index}.quantity`}
                      type="number"
                      step="0.1"
                      min="0"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={item.quantity}
                      onChange={(event) => {
                        const nextValue = Number.parseFloat(event.target.value || '0');
                        setItems((prev) =>
                          prev.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, quantity: Number.isNaN(nextValue) ? 0 : nextValue } : entry,
                          ),
                        );
                      }}
                    />
                    {getItemError(index, 'quantity') ? <p className="text-xs text-red-600">{getItemError(index, 'quantity')}</p> : null}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600" htmlFor={`items.${index}.unitPrice`}>
                      {t('jobs.invoices.form.unitPriceLabel')}
                    </label>
                    <input
                      id={`items.${index}.unitPrice`}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={item.unitPrice}
                      onChange={(event) => {
                        const nextValue = Number.parseFloat(event.target.value || '0');
                        setItems((prev) =>
                          prev.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, unitPrice: Number.isNaN(nextValue) ? 0 : nextValue }
                              : entry,
                          ),
                        );
                      }}
                    />
                    {getItemError(index, 'unitPrice') ? <p className="text-xs text-red-600">{getItemError(index, 'unitPrice')}</p> : null}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">{t('jobs.invoices.form.amountLabel')}</label>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      {formatCurrency(lineAmount / 100, 'CAD', locale)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>{t('jobs.invoices.form.subtotalLabel')}</span>
            <span className="font-semibold">{formatCurrency(totals.subtotal / 100, 'CAD', locale)}</span>
          </div>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            {totals.taxData.map((tax) => (
              <div key={tax.label} className="flex items-center justify-between">
                <span>{`${t(`taxes.${tax.label}`, tax.label)} (${(tax.rate * 100).toFixed(2)}%)`}</span>
                <span className="font-semibold">{formatCurrency(tax.amount / 100, 'CAD', locale)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
            <span>{t('jobs.invoices.form.totalDueLabel')}</span>
            <span>{formatCurrency(totals.total / 100, 'CAD', locale)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loadingState}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingState ? t('jobs.invoices.form.saving') : t('jobs.invoices.form.saveDraft')}
          </button>
          <button
            type="button"
            onClick={() => setShowFinalizeDialog(true)}
            disabled={loadingState}
            className="inline-flex items-center justify-center rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('jobs.invoices.form.finalizeButton')}
          </button>
        </div>
      </form>

      {showFinalizeDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">{t('jobs.invoices.form.finalizeDialogTitle')}</h3>
            <p className="mt-2 text-sm text-slate-600">{t('jobs.invoices.form.finalizeDialogMessage')}</p>
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFinalizeDialog(false)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                {t('jobs.invoices.form.cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowFinalizeDialog(false);
                  await onFinalize();
                }}
                className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
              >
                {t('jobs.invoices.form.confirmSend')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default InvoiceForm;
