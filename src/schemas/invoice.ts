import { z } from 'zod';
import { TFunction } from 'i18next';

export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'paid',
  'void',
  'overdue',
] as const;

export const INVOICE_PAYMENT_METHODS = [
  'stripe',
  'cash',
  'cheque',
  'etransfer',
  'other',
] as const;

const requiredOptions = (t?: TFunction, key?: string) => ({
  required_error: t ? t(key || 'validation.required') : (key || 'validation.required'),
  invalid_type_error: t ? t(key || 'validation.required') : (key || 'validation.required'),
});

const getCurrencySchema = (t?: TFunction) => z
  .number(requiredOptions(t))
  .int(t ? t('validation.amountInteger') : 'validation.amountInteger')
  .nonnegative(t ? t('validation.amountNonNegative') : 'validation.amountNonNegative');

const getTaxLineSchema = (t?: TFunction) => z.object({
  label: z.string(requiredOptions(t, 'validation.taxLabelRequired'))
    .min(1, t ? t('validation.taxLabelRequired') : 'validation.taxLabelRequired'),
  rate: z.number(requiredOptions(t)).min(0, t ? t('validation.taxRateNonNegative') : 'validation.taxRateNonNegative'),
  amount: getCurrencySchema(t),
});

export const getInvoiceItemSchema = (t?: TFunction) => z.object({
  description: z.string(requiredOptions(t, 'validation.lineItemDescriptionRequired'))
    .min(1, t ? t('validation.lineItemDescriptionRequired') : 'validation.lineItemDescriptionRequired'),
  quantity: z.number(requiredOptions(t))
    .positive(t ? t('validation.quantityPositive') : 'validation.quantityPositive'),
  unit_price: getCurrencySchema(t),
  amount: getCurrencySchema(t),
});

export const getInvoiceDraftSchema = (t?: TFunction) => z.object({
  job_id: z.string(requiredOptions(t, 'validation.jobIdUUID'))
    .uuid(t ? t('validation.jobIdUUID') : 'validation.jobIdUUID'),
  contractor_id: z.string(requiredOptions(t, 'validation.contractorIdUUID'))
    .uuid(t ? t('validation.contractorIdUUID') : 'validation.contractorIdUUID'),
  invoice_number: z.string(requiredOptions(t, 'validation.invoiceNumberRequired'))
    .min(1, t ? t('validation.invoiceNumberRequired') : 'validation.invoiceNumberRequired'),
  status: z.enum(INVOICE_STATUSES).default('draft'),
  items: z.array(getInvoiceItemSchema(t)).optional(),
  subtotal: getCurrencySchema(t).optional(),
  tax_data: z.array(getTaxLineSchema(t)).optional(),
  total_amount: getCurrencySchema(t).optional(),
  pdf_url: z.string().url(t ? t('validation.pdfUrlValid') : 'validation.pdfUrlValid').nullable().optional(),
  payment_method: z.enum(INVOICE_PAYMENT_METHODS).nullable().optional(),
  payment_note: z.string().max(1000, t ? t('validation.paymentNoteTooLong') : 'validation.paymentNoteTooLong').nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),
  stripe_payment_intent_id: z.string().nullable().optional(),
});

export const getInvoiceFinalSchema = (t?: TFunction) => getInvoiceDraftSchema(t).extend({
  status: z.enum(INVOICE_STATUSES).refine((value) => value !== 'draft', {
    message: t ? t('validation.finalInvoiceNoDraft') : 'validation.finalInvoiceNoDraft',
  }),
  items: z.array(getInvoiceItemSchema(t)).min(1, t ? t('validation.oneLineItemRequired') : 'validation.oneLineItemRequired'),
  subtotal: getCurrencySchema(t),
  tax_data: z.array(getTaxLineSchema(t)),
  total_amount: getCurrencySchema(t),
}).strict();

// Fallback for static analysis
const CurrencySchema = getCurrencySchema();

const TaxLineSchema = getTaxLineSchema();

export const InvoiceItemSchema = getInvoiceItemSchema();

export const InvoiceDraftSchema = getInvoiceDraftSchema();

export const InvoiceFinalSchema = getInvoiceFinalSchema();

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>;
export type InvoiceDraftInput = z.infer<typeof InvoiceDraftSchema>;
export type InvoiceFinalInput = z.infer<typeof InvoiceFinalSchema>;
