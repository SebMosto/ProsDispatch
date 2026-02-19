import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InvoiceForm from './InvoiceForm';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('../../lib/router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../hooks/useInvoices', () => ({
  useInvoiceMutations: () => ({
    createDraft: { mutateAsync: vi.fn(), isPending: false },
    updateDraft: { mutateAsync: vi.fn(), isPending: false },
    finalize: { mutateAsync: vi.fn(), isPending: false },
  }),
}));

describe('InvoiceForm', () => {
  it('should maintain focus when typing in description field', () => {
    render(
      <BrowserRouter>
        <InvoiceForm jobId="test-job-id" />
      </BrowserRouter>
    );

    // Click "Add Item" button
    const addItemButton = screen.getByText('jobs.invoices.form.addItem');
    fireEvent.click(addItemButton);

    // Find description input
    const descriptionInput = screen.getByLabelText('jobs.invoices.form.descriptionLabel');

    // Focus and type
    descriptionInput.focus();
    expect(document.activeElement).toBe(descriptionInput);

    // Type a character
    fireEvent.change(descriptionInput, { target: { value: 'a' } });

    // Verify focus is still on the input
    // If the component re-mounted, the element reference in descriptionInput might be stale
    // or the new element would not be focused.
    // However, fireEvent.change might not trigger re-render in the same way real browser event loop does with React?
    // React Testing Library's fireEvent updates state, React re-renders.
    // If key changes, the DOM node is replaced.
    // The `descriptionInput` variable holds reference to the OLD DOM node.
    // If re-render happened and node was replaced, `descriptionInput` is now detached from document.

    // Check if descriptionInput is still in the document
    expect(descriptionInput).toBeInTheDocument();

    // Check if it still has focus
    expect(document.activeElement).toBe(descriptionInput);
  });
});
