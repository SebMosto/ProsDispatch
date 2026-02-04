import { reportApiOnline } from '../lib/network';
import { supabase } from '../lib/supabase';
import type { InvoiceDraftInput, InvoiceItemInput } from '../schemas/invoice';
import type { Database } from '../types/database.types';
import type { RepositoryError, RepositoryResult } from './base';
import { BaseRepository } from './base';

export type InvoiceRecord = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItemRecord = Database['public']['Tables']['invoice_items']['Row'];
export type InvoiceWithItems = InvoiceRecord & { invoice_items: InvoiceItemRecord[] };
export type InvoicePaymentMethod = Database['public']['Enums']['invoice_payment_method'];

export interface FinalizeInvoiceResult {
  invoice: InvoiceRecord;
  token: string;
  pdfUrl: string;
}

export class InvoiceRepository extends BaseRepository {
  private buildInvoiceNumber() {
    const token = crypto.randomUUID().split('-')[0]?.toUpperCase();
    return `INV-${token}`;
  }

  private async replaceInvoiceItems(
    invoiceId: string,
    items: InvoiceItemInput[],
  ): Promise<RepositoryError | null> {
    const { error: deleteError } = await this.client
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);

    const repositoryDeleteError = this.toRepositoryError(deleteError);

    if (repositoryDeleteError) {
      return repositoryDeleteError;
    }

    if (items.length === 0) {
      return null;
    }

    const insertPayload = items.map((item) => ({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    }));

    const { error: insertError } = await this.client.from('invoice_items').insert(insertPayload);
    return this.toRepositoryError(insertError);
  }

  private async fetchInvoiceWithItems(id: string): Promise<RepositoryResult<InvoiceWithItems>> {
    const { data, error } = await this.client
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data: data as unknown as InvoiceWithItems };
  }

  async listByJob(jobId: string): Promise<RepositoryResult<InvoiceWithItems[]>> {
    const { data, error } = await this.client
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('job_id', jobId)
      .order('invoice_number', { ascending: false });

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data: (data ?? []) as InvoiceWithItems[] };
  }

  async get(id: string): Promise<RepositoryResult<InvoiceWithItems>> {
    return this.fetchInvoiceWithItems(id);
  }

  async createDraft(jobId: string, input: InvoiceDraftInput): Promise<RepositoryResult<InvoiceWithItems>> {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return {
        data: null,
        error: {
          message: authError.message,
          reason: 'validation',
          cause: authError,
        },
      };
    }

    if (!authData?.user) {
      return {
        data: null,
        error: {
          message: 'User must be authenticated to create an invoice',
          reason: 'validation',
        },
      };
    }

    const invoiceNumber = this.buildInvoiceNumber();
    const taxData = input.tax_data ?? [];

    const payload = {
      contractor_id: authData.user.id,
      job_id: jobId,
      invoice_number: invoiceNumber,
      status: 'draft',
      subtotal: input.subtotal ?? 0,
      tax_data: taxData,
      total_amount: input.total_amount ?? 0,
      pdf_url: input.pdf_url ?? null,
      payment_method: input.payment_method ?? null,
      payment_note: input.payment_note ?? null,
      paid_at: input.paid_at ?? null,
      stripe_payment_intent_id: input.stripe_payment_intent_id ?? null,
    } satisfies Database['public']['Tables']['invoices']['Insert'];

    const { data, error } = await this.client.from('invoices').insert(payload).select('*').single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError || !data) {
      return { data: null, error: repositoryError ?? { message: 'Unknown error', reason: 'unknown' } };
    }

    const items = input.items ?? [];

    if (items.length > 0) {
      const itemsError = await this.replaceInvoiceItems(data.id, items);
      if (itemsError) {
        return { data: null, error: itemsError };
      }
    }

    return this.fetchInvoiceWithItems(data.id);
  }

  async updateDraft(id: string, input: InvoiceDraftInput): Promise<RepositoryResult<InvoiceWithItems>> {
    const taxData = input.tax_data ?? [];

    const payload = {
      invoice_number: input.invoice_number,
      status: input.status ?? 'draft',
      subtotal: input.subtotal ?? 0,
      tax_data: taxData,
      total_amount: input.total_amount ?? 0,
      pdf_url: input.pdf_url ?? null,
      payment_method: input.payment_method ?? null,
      payment_note: input.payment_note ?? null,
      paid_at: input.paid_at ?? null,
      stripe_payment_intent_id: input.stripe_payment_intent_id ?? null,
    } satisfies Database['public']['Tables']['invoices']['Update'];

    const { error } = await this.client.from('invoices').update(payload).eq('id', id);

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    if (input.items !== undefined) {
      const itemsError = await this.replaceInvoiceItems(id, input.items ?? []);
      if (itemsError) {
        return { data: null, error: itemsError };
      }
    }

    return this.fetchInvoiceWithItems(id);
  }

  async finalizeAndSend(id: string): Promise<RepositoryResult<FinalizeInvoiceResult>> {
    const token = crypto.randomUUID();
    const pdfUrl = await this.generatePDF(id);

    const { data, error } = await this.client
      .from('invoices')
      .update({
        status: 'sent',
        pdf_url: pdfUrl,
      })
      .eq('id', id)
      .select('*')
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError || !data) {
      return { data: null, error: repositoryError ?? { message: 'Unknown error', reason: 'unknown' } };
    }

    const { error: tokenError } = await this.client.from('invoice_tokens').insert({
      token,
      invoice_id: id,
    });

    const repositoryTokenError = this.toRepositoryError(tokenError);

    if (repositoryTokenError) {
      return { data: null, error: repositoryTokenError };
    }

    this.sendEmail(data, token);

    reportApiOnline();
    return { data: { invoice: data, token, pdfUrl } };
  }

  async getInvoiceByToken(token: string): Promise<RepositoryResult<InvoiceWithItems>> {
    const { data, error } = await this.client
      .rpc('get_invoice_by_token', { access_token: token })
      .select('*, invoice_items(*)')
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Invoice not found',
          reason: 'validation',
        },
      };
    }

    reportApiOnline();
    return { data: data as InvoiceWithItems };
  }

  async markAsPaid(
    id: string,
    method: InvoicePaymentMethod,
    note?: string,
  ): Promise<RepositoryResult<InvoiceRecord>> {
    const { data, error } = await this.client
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: method,
        payment_note: note ?? null,
      })
      .eq('id', id)
      .select('*')
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data };
  }

  private async generatePDF(invoiceId: string): Promise<string> {
    return `https://example.com/invoices/${invoiceId}.pdf`;
  }

  private sendEmail(invoice: InvoiceRecord, token: string) {
    console.info('Sending invoice email', {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      token,
    });
  }
}

export const invoiceRepository = new InvoiceRepository();
