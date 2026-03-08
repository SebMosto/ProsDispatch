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

const requiredOptions = (t: TFunction, key?: string) => ({
  required_error: t(key || 'validation.required'),
  invalid_type_error: t(key || 'validation.required'),
});

const getCurrencySchema = (t: TFunction) => z
  .number(requiredOptions(t))
  .int(t('validation.amountInteger'))
  .nonnegative(t('validation.amountNonNegative'));

const getTaxLineSchema = (t: TFunction) => z.object({
  label: z.string(requiredOptions(t, 'validation.taxLabelRequired'))
    .min(1, t('validation.taxLabelRequired')),
  rate: z.number(requiredOptions(t)).min(0, t('validation.taxRateNonNegative')),
  amount: getCurrencySchema(t),
});

export const getInvoiceItemSchema = (t: TFunction) => z.object({
  description: z.string(requiredOptions(t, 'validation.lineItemDescriptionRequired'))
    .min(1, t('validation.lineItemDescriptionRequired')),
  quantity: z.number(requiredOptions(t))
    .positive(t('validation.quantityPositive')),
  unit_price: getCurrencySchema(t),
  amount: getCurrencySchema(t),
});

export const getInvoiceDraftSchema = (t: TFunction) => z.object({
  job_id: z.string(requiredOptions(t, 'validation.jobIdUUID'))
    .uuid(t('validation.jobIdUUID')),
  contractor_id: z.string(requiredOptions(t, 'validation.contractorIdUUID'))
    .uuid(t('validation.contractorIdUUID')),
  invoice_number: z.string(requiredOptions(t, 'validation.invoiceNumberRequired'))
    .min(1, t('validation.invoiceNumberRequired')),
  status: z.enum(INVOICE_STATUSES).default('draft'),
  items: z.array(getInvoiceItemSchema(t)).optional(),
  subtotal: getCurrencySchema(t).optional(),
  tax_data: z.array(getTaxLineSchema(t)).optional(),
  total_amount: getCurrencySchema(t).optional(),
  pdf_url: z.string().url(t('validation.pdfUrlValid')).nullable().optional(),
  payment_method: z.enum(INVOICE_PAYMENT_METHODS).nullable().optional(),
  payment_note: z.string().max(1000, t('validation.paymentNoteTooLong')).nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),
  stripe_payment_intent_id: z.string().nullable().optional(),
});

export const getInvoiceFinalSchema = (t: TFunction) => getInvoiceDraftSchema(t).extend({
  status: z.enum(INVOICE_STATUSES).refine((value) => value !== 'draft', {
    message: t('validation.finalInvoiceNoDraft'),
  }),
  items: z.array(getInvoiceItemSchema(t)).min(1, t('validation.oneLineItemRequired')),
  subtotal: getCurrencySchema(t),
  tax_data: z.array(getTaxLineSchema(t)),
  total_amount: getCurrencySchema(t),
}).strict();

// STATIC SCHEMAS FOR TYPE INFERENCE ONLY
// DO NOT USE FOR VALIDATION
const CurrencySchema = z
  .number()
  .int()
  .nonnegative();

const TaxLineSchema = z.object({
  label: z.string().min(1),
  rate: z.number().min(0),
  amount: CurrencySchema,
});

export const InvoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: CurrencySchema,
  amount: CurrencySchema,
});

export const InvoiceDraftSchema = z.object({
  job_id: z.string().uuid(),
  contractor_id: z.string().uuid(),
  invoice_number: z.string().min(1),
  status: z.enum(INVOICE_STATUSES).default('draft'),
  items: z.array(InvoiceItemSchema).optional(),
  subtotal: CurrencySchema.optional(),
  tax_data: z.array(TaxLineSchema).optional(),
  total_amount: CurrencySchema.optional(),
  pdf_url: z.string().url().nullable().optional(),
  payment_method: z.enum(INVOICE_PAYMENT_METHODS).nullable().optional(),
  payment_note: z.string().max(1000).nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),
  stripe_payment_intent_id: z.string().nullable().optional(),
});

export const InvoiceFinalSchema = InvoiceDraftSchema.extend({
  status: z.enum(INVOICE_STATUSES).refine((value) => value !== 'draft'),
  items: z.array(InvoiceItemSchema).min(1),
  subtotal: CurrencySchema,
  tax_data: z.array(TaxLineSchema),
  total_amount: CurrencySchema,
}).strict();

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>;
export type InvoiceDraftInput = z.infer<typeof InvoiceDraftSchema>;
export type InvoiceFinalInput = z.infer<typeof InvoiceFinalSchema>;
