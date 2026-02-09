import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import DashboardPage from './DashboardPage';
import { useJobsWithDetails } from '../hooks/useJobsWithDetails';
import { useAuth } from '../lib/auth';
import { BrowserRouter } from 'react-router-dom';

// Mock hooks
vi.mock('../hooks/useJobsWithDetails');
vi.mock('../lib/auth');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock Link from ../lib/router
vi.mock('../lib/router', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ to, children, className }: any) => <a href={to} className={className}>{children}</a>,
  };
});

describe('DashboardPage', () => {
  const mockUseJobsWithDetails = useJobsWithDetails as unknown as Mock;
  const mockUseAuth = useAuth as unknown as Mock;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      profile: { full_name: 'Test User' },
      signOut: vi.fn(),
    });
  });

  it('renders active jobs by default', () => {
    mockUseJobsWithDetails.mockReturnValue({
      jobs: [
        {
          id: '1',
          status: 'draft',
          title: 'Active Job 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client_id: 'c1',
          property_id: 'p1'
        },
        {
          id: '2',
          status: 'completed',
          title: 'History Job 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client_id: 'c1',
          property_id: 'p1'
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Active Job 1')).toBeInTheDocument();
    expect(screen.queryByText('History Job 1')).not.toBeInTheDocument();
  });

  it('switches to history tab', () => {
    mockUseJobsWithDetails.mockReturnValue({
      jobs: [
        {
          id: '1',
          status: 'draft',
          title: 'Active Job 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client_id: 'c1',
          property_id: 'p1'
        },
        {
          id: '2',
          status: 'completed',
          title: 'History Job 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client_id: 'c1',
          property_id: 'p1'
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const historyTab = screen.getByText(/History/);
    fireEvent.click(historyTab);

    expect(screen.getByText('History Job 1')).toBeInTheDocument();
    expect(screen.queryByText('Active Job 1')).not.toBeInTheDocument();
  });
});
