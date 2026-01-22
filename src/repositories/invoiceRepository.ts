import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { RepositoryError, RepositoryResult } from './base';
import type { InvoiceDraftInput, InvoiceFinalInput, InvoiceItemInput } from '../schemas/invoice';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
type InvoiceItemRow = Database['public']['Tables']['invoice_items']['Row'];
type InvoiceStatus = Database['public']['Enums']['invoice_status'];
export type InvoicePaymentMethod = Database['public']['Enums']['payment_method'];

export type InvoiceWithItems = InvoiceRow & {
  items: InvoiceItemRow[];
};

export type FinalizeInvoiceResult = {
  invoice: InvoiceWithItems;
  pdfUrl: string | null;
  emailSent: boolean;
};

const mapError = (error: unknown, defaultMessage = 'Database error'): RepositoryError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return { message: (error as Error).message, reason: 'database' };
  }
  return { message: defaultMessage, reason: 'unknown' };
};

export const invoiceRepository = {
  /**
   * Fetch a single invoice by ID with its items
   */
  async get(id: string): Promise<RepositoryResult<InvoiceWithItems>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .eq('id', id)
        .single();

      if (error) {
        return { error: mapError(error, 'Failed to fetch invoice') };
      }

      return { data: data as InvoiceWithItems };
    } catch (err) {
      return { error: mapError(err) };
    }
  },

  /**
   * List invoices for a specific job
   */
  async listByJob(jobId: string): Promise<RepositoryResult<InvoiceWithItems[]>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: mapError(error, 'Failed to list invoices') };
      }

      return { data: data as InvoiceWithItems[] };
    } catch (err) {
      return { error: mapError(err) };
    }
  },

  /**
   * Create a new invoice draft
   */
  async createDraft(jobId: string, input: InvoiceDraftInput): Promise<RepositoryResult<InvoiceWithItems>> {
    try {
      // 1. Create Invoice Header
      const invoiceData = {
        job_id: jobId,
        contractor_id: input.contractor_id,
        invoice_number: input.invoice_number,
        status: 'draft' as InvoiceStatus,
        subtotal: input.subtotal ?? 0,
        tax_data: input.tax_data ?? [],
        total_amount: input.total_amount ?? 0,
        payment_method: input.payment_method ?? null,
        payment_note: input.payment_note ?? null,
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError || !invoice) {
        return { error: mapError(invoiceError, 'Failed to create invoice draft') };
      }

      // 2. Create Line Items if any
      let createdItems: InvoiceItemRow[] = [];
      if (input.items && input.items.length > 0) {
        const itemsData = input.items.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        }));

        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsData)
          .select();

        if (itemsError) {
          // Cleanup orphan invoice header if items fail?
          // For now, we return error but header persists.
          // Ideally use a stored procedure or transaction if available.
          return { error: mapError(itemsError, 'Failed to create invoice items') };
        }
        createdItems = items ?? [];
      }

      return { data: { ...invoice, items: createdItems } };
    } catch (err) {
      return { error: mapError(err) };
    }
  },

  /**
   * Update an existing draft invoice
   */
  async updateDraft(id: string, input: InvoiceDraftInput): Promise<RepositoryResult<InvoiceWithItems>> {
    try {
      // 1. Update Invoice Header
      const { error: headerError } = await supabase
        .from('invoices')
        .update({
          invoice_number: input.invoice_number,
          subtotal: input.subtotal,
          tax_data: input.tax_data,
          total_amount: input.total_amount,
          payment_method: input.payment_method,
          payment_note: input.payment_note,
          status: input.status as InvoiceStatus, // Typically still 'draft'
        })
        .eq('id', id);

      if (headerError) {
        return { error: mapError(headerError, 'Failed to update invoice header') };
      }

      // 2. Replace Line Items (Delete All + Insert New)
      // Note: This is a simple strategy. Diffing would be better for performance but complex.
      if (input.items) {
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);

        if (deleteError) {
          return { error: mapError(deleteError, 'Failed to clear old invoice items') };
        }

        if (input.items.length > 0) {
          const itemsData = input.items.map((item) => ({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          }));

          const { error: insertError } = await supabase
            .from('invoice_items')
            .insert(itemsData);

          if (insertError) {
            return { error: mapError(insertError, 'Failed to insert new invoice items') };
          }
        }
      }

      // 3. Return updated aggregate
      return this.get(id);
    } catch (err) {
      return { error: mapError(err) };
    }
  },

  /**
   * Finalize an invoice and "Send" it (mark as sent)
   */
  async finalizeAndSend(id: string): Promise<RepositoryResult<FinalizeInvoiceResult>> {
    try {
      // 1. Update status to 'sent'
      const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', id)
        .select('*, items:invoice_items(*)')
        .single();

      if (updateError || !invoice) {
        return { error: mapError(updateError, 'Failed to finalize invoice') };
      }

      // 2. In a real app, trigger PDF generation or Email via Edge Function
      // For MVP, we simulate success
      return {
        data: {
          invoice: invoice as InvoiceWithItems,
          pdfUrl: null, // Placeholder
          emailSent: true, // Placeholder
        },
      };
    } catch (err) {
      return { error: mapError(err) };
    }
  },

  /**
   * Mark an invoice as paid (offline payment)
   */
  async markAsPaid(id: string, method: InvoicePaymentMethod, note?: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method: method,
          payment_note: note,
          paid_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { error: mapError(error, 'Failed to mark invoice as paid') };
      }

      return { data: true };
    } catch (err) {
      return { error: mapError(err) };
    }
  },

  /**
   * Get invoice by public token (RPC call)
   */
  async getInvoiceByToken(token: string): Promise<RepositoryResult<InvoiceWithItems>> {
    try {
      // We use 'get_invoice_by_token' RPC which returns a JSON object
      // This bypasses RLS for the public view
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.rpc('get_invoice_by_token' as any, {
        token_input: token,
      });

      if (error) {
        return { error: mapError(error, 'Invalid or expired invoice link') };
      }

      if (!data) {
        return { error: { message: 'Invoice not found', reason: 'not_found' } };
      }

      // The RPC returns a JSON structure that matches InvoiceWithItems
      // We need to cast it safely
      return { data: data as unknown as InvoiceWithItems };
    } catch (err) {
      return { error: mapError(err) };
    }
  },
};
