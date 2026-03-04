import { describe, it, expect } from 'vitest';
import type { TFunction } from 'i18next';
import { getClientSchema } from '../schemas/client';
import { getInvoiceDraftSchema } from '../schemas/invoice';

const tKey = ((key: string) => key) as TFunction;

describe('ClientSchema Validation Messages', () => {
  it('should return localized key for name required (empty string)', () => {
    const invalidClient = {
      name: '', // Empty string, simulating form input
      type: 'individual',
      preferred_language: 'en',
    };
    const result = getClientSchema(tKey).safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.nameRequired');
    }
  });

  it('should return localized key for invalid email', () => {
    const invalidClient = {
      name: 'Test Client',
      email: 'invalid-email',
      type: 'individual',
      preferred_language: 'en',
    };
    const result = getClientSchema(tKey).safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.invalidEmail');
    }
  });
});

describe('InvoiceSchema Validation Messages', () => {
  it('should return localized key for invalid invoice number', () => {
    const invalidInvoice = {
      job_id: '123e4567-e89b-12d3-a456-426614174000',
      contractor_id: '123e4567-e89b-12d3-a456-426614174000',
      invoice_number: '', // empty
      status: 'draft',
    };
    const result = getInvoiceDraftSchema(tKey).safeParse(invalidInvoice);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.invoiceNumberRequired');
    }
  });

  it('should return localized key for negative amount', () => {
    const invalidItem = {
      description: 'Test Item',
      quantity: 1,
      unit_price: -100, // Negative
      amount: 100,
    };

    const invalidInvoice = {
      job_id: '123e4567-e89b-12d3-a456-426614174000',
      contractor_id: '123e4567-e89b-12d3-a456-426614174000',
      invoice_number: 'INV-001',
      status: 'draft',
      items: [invalidItem]
    };

    const result = getInvoiceDraftSchema(tKey).safeParse(invalidInvoice);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('unit_price'));
      expect(issue?.message).toBe('validation.amountNonNegative');
    }
  });
});
