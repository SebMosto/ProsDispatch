import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals } from '../lib/taxCalculator';

describe('calculateInvoiceTotals', () => {
  it('should calculate totals and return localized keys for tax labels', () => {
    const items = [
      { description: 'Item 1', quantity: 1, unit_price: 1000, amount: 1000 }, // $10.00
    ];

    const result = calculateInvoiceTotals(items);

    expect(result.subtotal).toBe(1000);
    // GST 5% of 1000 = 50
    expect(result.gst).toBe(50);
    // QST 9.975% of 1000 = 99.75 -> 100
    expect(result.qst).toBe(100);

    expect(result.total).toBe(1150);

    expect(result.taxData).toHaveLength(2);
    expect(result.taxData[0].label).toBe('taxes.GST');
    expect(result.taxData[1].label).toBe('taxes.QST');
  });
});
