
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage';
import { invoiceRepository } from '../repositories/invoiceRepository';

// Mock the repository
vi.mock('../repositories/invoiceRepository', () => ({
  invoiceRepository: {
    get: vi.fn(),
    markAsPaid: vi.fn(),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock router components
vi.mock('../lib/router', async () => {
  const actual = await vi.importActual('../lib/router');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/jobs/inv_123' }),
    useNavigate: () => vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  };
});

describe('InvoiceDetailPage - Infinite Loop Verification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const mockInvoice = {
    id: 'inv_123',
    job_id: 'job_456',
    invoice_number: 'INV-001',
    status: 'sent', // Needs to be 'sent' to show the "Mark as Paid" button
    subtotal: 100,
    total_amount: 113,
    tax_data: [{ label: 'HST', rate: 0.13, amount: 13 }],
    invoice_items: [
      { id: 'item_1', description: 'Test Item', quantity: 1, unit_price: 100, amount: 100 },
    ],
    contractor_id: 'user_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders without infinite loop when opening MarkPaidModal', async () => {
    // Setup mock return
    vi.mocked(invoiceRepository.get).mockResolvedValue({
      data: mockInvoice as any,
      error: null,
    });

    const router = createMemoryRouter(
      [
        {
          path: '/jobs/:invoiceId',
          element: <InvoiceDetailPage />,
        },
      ],
      {
        initialEntries: ['/jobs/inv_123'],
      }
    );

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    // 1. Wait for invoice to load
    await waitFor(() => {
      expect(screen.getByText('jobs.invoices.detailPage.title')).toBeInTheDocument();
    });

    // 2. Find and click "Mark as Paid" button
    const openButton = screen.getByText('jobs.invoices.detailPage.markAsPaid');
    fireEvent.click(openButton);

    // 3. Verify Modal opens
    await waitFor(() => {
      expect(screen.getByText('jobs.invoices.markPaidModal.title')).toBeInTheDocument();
    });

    // 4. Verify no infinite re-renders or crashes (implicit by test reaching this point)
    // We can also check that the confirm button is visible and enabled
    const confirmButton = screen.getByText('jobs.invoices.markPaidModal.confirm');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).not.toBeDisabled();
  });

  it('completes the payment flow successfully', async () => {
     // Setup mocks
     vi.mocked(invoiceRepository.get).mockResolvedValue({
      data: mockInvoice as any,
      error: null,
    });

    vi.mocked(invoiceRepository.markAsPaid).mockResolvedValue({
      data: { ...mockInvoice, status: 'paid' } as any,
      error: null,
    });

    const router = createMemoryRouter(
      [
        {
          path: '/jobs/:invoiceId',
          element: <InvoiceDetailPage />,
        },
      ],
      {
        initialEntries: ['/jobs/inv_123'],
      }
    );

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    // Open Modal
    await waitFor(() => screen.getByText('jobs.invoices.detailPage.markAsPaid'));
    fireEvent.click(screen.getByText('jobs.invoices.detailPage.markAsPaid'));

    // Select Cash (default) and Confirm
    const confirmButton = screen.getByText('jobs.invoices.markPaidModal.confirm');
    fireEvent.click(confirmButton);

    // Verify mutation was called
    await waitFor(() => {
      expect(invoiceRepository.markAsPaid).toHaveBeenCalledWith(
        'inv_123',
        'cash',
        undefined
      );
    });

    // Verify Modal closes (or at least we don't crash)
    await waitFor(() => {
      expect(screen.queryByText('jobs.invoices.markPaidModal.title')).not.toBeInTheDocument();
    });
  });
});
