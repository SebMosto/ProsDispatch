import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminPortalPage from './AdminPortalPage';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../lib/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

describe('AdminPortalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error if user is not admin', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { role: 'contractor' },
    } as unknown as ReturnType<typeof useAuth>);

    render(<AdminPortalPage />, { wrapper: BrowserRouter });

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('Access denied: Admin privileges required')).toBeInTheDocument();
    });
  });

  it('loads and displays metrics if user is admin', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { role: 'admin' },
    } as unknown as ReturnType<typeof useAuth>);

    const mockData = {
      active_contractors: 42,
      total_jobs: 100,
      total_invoices_paid: 15,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null } as unknown as ReturnType<typeof useAuth>);

    render(<AdminPortalPage />, { wrapper: BrowserRouter });

    await waitFor(() => {
      expect(screen.getByText('Admin Portal')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});
