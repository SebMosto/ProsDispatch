import { z } from 'zod';

export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'paid',
  'void',
  'overdue',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_PAYMENT_METHODS = [
  'stripe',
  'cash',
  'cheque',
  'etransfer',
  'other',
] as const;

const CurrencySchema = z
  .number()
  .int('Amount must be an integer representing cents')
  .nonnegative('Amount must be zero or greater');

const TaxLineSchema = z.object({
  label: z.string().min(1, 'Tax label is required'),
  rate: z.number().min(0, 'Tax rate must be zero or greater'),
  amount: CurrencySchema,
});

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Line item description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit_price: CurrencySchema,
  amount: CurrencySchema,
});

export const InvoiceDraftSchema = z.object({
  job_id: z.string().uuid('Job ID must be a valid UUID'),
  contractor_id: z.string().uuid('Contractor ID must be a valid UUID'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  status: z.enum(INVOICE_STATUSES).default('draft'),
  items: z.array(InvoiceItemSchema).optional(),
  subtotal: CurrencySchema.optional(),
  tax_data: z.array(TaxLineSchema).optional(),
  total_amount: CurrencySchema.optional(),
  pdf_url: z.string().url('PDF URL must be valid').nullable().optional(),
  payment_method: z.enum(INVOICE_PAYMENT_METHODS).nullable().optional(),
  payment_note: z.string().max(1000, 'Payment note must be 1000 characters or less').nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),
  stripe_payment_intent_id: z.string().nullable().optional(),
});

export const InvoiceFinalSchema = InvoiceDraftSchema.extend({
  status: z.enum(INVOICE_STATUSES).refine((value) => value !== 'draft', {
    message: 'Final invoices cannot remain in draft status',
  }),
  items: z.array(InvoiceItemSchema).min(1, 'At least one line item is required'),
  subtotal: CurrencySchema,
  tax_data: z.array(TaxLineSchema),
  total_amount: CurrencySchema,
}).strict();

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>;
export type InvoiceDraftInput = z.infer<typeof InvoiceDraftSchema>;
export type InvoiceFinalInput = z.infer<typeof InvoiceFinalSchema>;
