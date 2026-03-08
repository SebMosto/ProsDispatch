import { z } from 'zod';
import { TFunction } from 'i18next';
import { requiredOptions } from './helpers';

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
  .number(requiredOptions(t, 'validation.amountRequired'))
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
const CurrencySchema = z
  .number({ required_error: 'validation.required', invalid_type_error: 'validation.required' })
  .int('validation.amountInteger')
  .nonnegative('validation.amountNonNegative');

const TaxLineSchema = z.object({
  label: z.string({ required_error: 'validation.taxLabelRequired', invalid_type_error: 'validation.taxLabelRequired' })
    .min(1, 'validation.taxLabelRequired'),
  rate: z.number({ required_error: 'validation.required', invalid_type_error: 'validation.required' })
    .min(0, 'validation.taxRateNonNegative'),
  amount: CurrencySchema,
});

export const InvoiceItemSchema = z.object({
  description: z.string({ required_error: 'validation.lineItemDescriptionRequired', invalid_type_error: 'validation.lineItemDescriptionRequired' })
    .min(1, 'validation.lineItemDescriptionRequired'),
  quantity: z.number({ required_error: 'validation.required', invalid_type_error: 'validation.required' })
    .positive('validation.quantityPositive'),
  unit_price: CurrencySchema,
  amount: CurrencySchema,
});

export const InvoiceDraftSchema = z.object({
  job_id: z.string({ required_error: 'validation.jobIdUUID', invalid_type_error: 'validation.jobIdUUID' })
    .uuid('validation.jobIdUUID'),
  contractor_id: z.string({ required_error: 'validation.contractorIdUUID', invalid_type_error: 'validation.contractorIdUUID' })
    .uuid('validation.contractorIdUUID'),
  invoice_number: z.string({ required_error: 'validation.invoiceNumberRequired', invalid_type_error: 'validation.invoiceNumberRequired' })
    .min(1, 'validation.invoiceNumberRequired'),
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
