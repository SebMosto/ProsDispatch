import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage';

const invalidateQueriesMock = vi.fn().mockResolvedValue(undefined);
const mutateMock = vi.fn();
let jobsLoadingState = true;
let clientsLoadingState = true;
let invoicesLoadingState = true;

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-CA' },
    }),
  };
});

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    profile: { full_name: 'Seb Mo' },
    subscriptionStatus: 'active',
    trialDaysRemaining: 0,
  }),
}));

vi.mock('../lib/router', () => ({
  useLocation: () => ({ pathname: '/dashboard', search: '' }),
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('../hooks/useJobs', () => ({
  useJobs: () => ({
    jobs: [],
    loading: jobsLoadingState,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useClients', () => ({
  useClients: () => ({
    clients: [],
    loading: clientsLoadingState,
  }),
}));

vi.mock('../hooks/useInvoices', () => ({
  useInvoicesByContractor: () => ({
    invoices: [],
    loading: invoicesLoadingState,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isFetching: false }),
  useMutation: () => ({ mutate: mutateMock }),
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

describe('DashboardPage loading timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    jobsLoadingState = true;
    clientsLoadingState = true;
    invoicesLoadingState = true;
  });

  it('shows timeout fallback with a retry call-to-action', () => {
    render(<DashboardPage />);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.getByText('dashboard.loadingTimeout.title')).toBeInTheDocument();
    expect(screen.getByText('dashboard.loadingTimeout.message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'dashboard.loadingTimeout.retry' })).toBeInTheDocument();
  });

  it('does not show timeout fallback when loading resolves before 8 seconds', () => {
    const { rerender } = render(<DashboardPage />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    jobsLoadingState = false;
    clientsLoadingState = false;
    invoicesLoadingState = false;
    rerender(<DashboardPage />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('dashboard.loadingTimeout.title')).not.toBeInTheDocument();
    expect(screen.queryByText('dashboard.loadingTimeout.message')).not.toBeInTheDocument();
  });
});
