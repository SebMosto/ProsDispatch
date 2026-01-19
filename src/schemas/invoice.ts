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

const getCurrencySchema = (t?: TFunction) => z
  .number()
  .int(t ? t('validation.amountInteger') : 'Amount must be an integer representing cents')
  .nonnegative(t ? t('validation.amountNonNegative') : 'Amount must be zero or greater');

const getTaxLineSchema = (t?: TFunction) => z.object({
  label: z.string().min(1, t ? t('validation.taxLabelRequired') : 'Tax label is required'),
  rate: z.number().min(0, t ? t('validation.taxRateNonNegative') : 'Tax rate must be zero or greater'),
  amount: getCurrencySchema(t),
});

export const getInvoiceItemSchema = (t?: TFunction) => z.object({
  description: z.string().min(1, t ? t('validation.lineItemDescriptionRequired') : 'Line item description is required'),
  quantity: z.number().positive(t ? t('validation.quantityPositive') : 'Quantity must be greater than zero'),
  unit_price: getCurrencySchema(t),
  amount: getCurrencySchema(t),
});

export const getInvoiceDraftSchema = (t?: TFunction) => z.object({
  job_id: z.string().uuid(t ? t('validation.jobIdUUID') : 'Job ID must be a valid UUID'),
  contractor_id: z.string().uuid(t ? t('validation.contractorIdUUID') : 'Contractor ID must be a valid UUID'),
  invoice_number: z.string().min(1, t ? t('validation.invoiceNumberRequired') : 'Invoice number is required'),
  status: z.enum(INVOICE_STATUSES).default('draft'),
  items: z.array(getInvoiceItemSchema(t)).optional(),
  subtotal: getCurrencySchema(t).optional(),
  tax_data: z.array(getTaxLineSchema(t)).optional(),
  total_amount: getCurrencySchema(t).optional(),
  pdf_url: z.string().url(t ? t('validation.pdfUrlValid') : 'PDF URL must be valid').nullable().optional(),
  payment_method: z.enum(INVOICE_PAYMENT_METHODS).nullable().optional(),
  payment_note: z.string().max(1000, t ? t('validation.paymentNoteTooLong') : 'Payment note must be 1000 characters or less').nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),
  stripe_payment_intent_id: z.string().nullable().optional(),
});

export const getInvoiceFinalSchema = (t?: TFunction) => getInvoiceDraftSchema(t).extend({
  status: z.enum(INVOICE_STATUSES).refine((value) => value !== 'draft', {
    message: t ? t('validation.finalInvoiceNoDraft') : 'Final invoices cannot remain in draft status',
  }),
  items: z.array(getInvoiceItemSchema(t)).min(1, t ? t('validation.oneLineItemRequired') : 'At least one line item is required'),
  subtotal: getCurrencySchema(t),
  tax_data: z.array(getTaxLineSchema(t)),
  total_amount: getCurrencySchema(t),
}).strict();

// Fallback for static analysis
// Using keys or standard Zod messages
const CurrencySchema = z
  .number()
  .int('validation.amountInteger')
  .nonnegative('validation.amountNonNegative');

const TaxLineSchema = z.object({
  label: z.string().min(1, 'validation.taxLabelRequired'),
  rate: z.number().min(0, 'validation.taxRateNonNegative'),
  amount: CurrencySchema,
});

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'validation.lineItemDescriptionRequired'),
  quantity: z.number().positive('validation.quantityPositive'),
  unit_price: CurrencySchema,
  amount: CurrencySchema,
});

export const InvoiceDraftSchema = z.object({
  job_id: z.string().uuid('validation.jobIdUUID'),
  contractor_id: z.string().uuid('validation.contractorIdUUID'),
  invoice_number: z.string().min(1, 'validation.invoiceNumberRequired'),
  status: z.enum(INVOICE_STATUSES).default('draft'),
  items: z.array(InvoiceItemSchema).optional(),
  subtotal: CurrencySchema.optional(),
  tax_data: z.array(TaxLineSchema).optional(),
  total_amount: CurrencySchema.optional(),
  pdf_url: z.string().url('validation.pdfUrlValid').nullable().optional(),
  payment_method: z.enum(INVOICE_PAYMENT_METHODS).nullable().optional(),
  payment_note: z.string().max(1000, 'validation.paymentNoteTooLong').nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),
  stripe_payment_intent_id: z.string().nullable().optional(),
});

export const InvoiceFinalSchema = InvoiceDraftSchema.extend({
  status: z.enum(INVOICE_STATUSES).refine((value) => value !== 'draft', {
    message: 'validation.finalInvoiceNoDraft',
  }),
  items: z.array(InvoiceItemSchema).min(1, 'validation.oneLineItemRequired'),
  subtotal: CurrencySchema,
  tax_data: z.array(TaxLineSchema),
  total_amount: CurrencySchema,
}).strict();

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>;
export type InvoiceDraftInput = z.infer<typeof InvoiceDraftSchema>;
export type InvoiceFinalInput = z.infer<typeof InvoiceFinalSchema>;
