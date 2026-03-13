import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboardPage from './AdminDashboardPage';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import type { Mock } from 'vitest';

// Mock dependencies
vi.mock('../../lib/auth');
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Provide a stable t function that just returns the key
import type { TFunction } from 'i18next';
const mockT = ((key: string) => key) as unknown as TFunction;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (useAuth as Mock).mockReturnValue({
      profile: { role: 'admin' },
    });

    // Make rpc return a promise that doesn't resolve immediately
    (supabase.rpc as Mock).mockReturnValue(new Promise(() => {}));

    const { container } = render(<AdminDashboardPage />);
    // Testing loader by assuming it has no text, checking for an element with specific class
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders unauthorized message for non-admin users', async () => {
    (useAuth as Mock).mockReturnValue({
      profile: { role: 'contractor' },
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('admin.unauthorized')).toBeInTheDocument();
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('fetches and displays metrics for admin users', async () => {
    (useAuth as Mock).mockReturnValue({
      profile: { role: 'admin' },
    });

    (supabase.rpc as Mock).mockResolvedValue({
      data: [
        {
          total_users: 10,
          total_jobs: 50,
          active_jobs: 15,
        },
      ],
      error: null,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_metrics');
    });

    expect(screen.getByText('admin.title')).toBeInTheDocument();

    // Verify cards are rendered with labels
    expect(screen.getByText('admin.totalUsers')).toBeInTheDocument();
    expect(screen.getByText('admin.totalJobs')).toBeInTheDocument();
    expect(screen.getByText('admin.activeJobs')).toBeInTheDocument();

    // Verify values are displayed
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('displays error message if rpc fails', async () => {
    (useAuth as Mock).mockReturnValue({
      profile: { role: 'admin' },
    });

    (supabase.rpc as Mock).mockResolvedValue({
      data: null,
      error: new Error('RPC Failed'),
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('admin.error')).toBeInTheDocument();
    });
  });
});
