import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PublicInvoicePage from './PublicInvoicePage';

vi.mock('../../hooks/useInvoices', () => ({
  useInvoiceByToken: () => ({
    invoice: {
      id: 'inv-1',
      job_id: 'job-1',
      contractor_id: 'ctr-1',
      invoice_number: 'INV-001',
      status: 'sent',
      subtotal: 1000,
      tax_data: [],
      total_amount: 1000,
      pdf_url: null,
      invoice_items: [],
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('../../lib/network', () => ({
  useNetworkStatus: () => ({ isOnline: true, reason: null }),
}));

vi.mock('../../lib/stripe', () => ({
  stripePromise: null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('PublicInvoicePage', () => {
  it('renders basic invoice header for sent status', () => {
    render(
      <BrowserRouter>
        <PublicInvoicePage />
      </BrowserRouter>,
    );

    expect(screen.getByText('public.invoice.header')).toBeInTheDocument();
    expect(screen.getByText('public.invoice.totalDue')).toBeInTheDocument();
  });
});

