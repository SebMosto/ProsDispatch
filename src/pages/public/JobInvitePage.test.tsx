import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JobInvitePage from './JobInvitePage';
import { useJobByToken } from '../../hooks/usePublicJob';
import { publicRepository } from '../../repositories/publicRepository';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../lib/router', () => ({
  useLocation: () => ({ pathname: '/job-invite/test-token' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../hooks/usePublicJob', () => ({
  useJobByToken: vi.fn(),
}));

vi.mock('../../repositories/publicRepository', () => ({
  publicRepository: {
    respondToInvite: vi.fn(),
  },
}));

vi.mock('../../lib/date', () => ({
  formatDate: (date: string) => date,
}));

vi.mock('../../components/ui/PageLoader', () => ({
  PageLoader: () => <div data-testid="page-loader">Loading...</div>,
}));

describe('JobInvitePage', () => {
  const mockJobDetails = {
    job: {
      id: 'job-123',
      title: 'Test Job',
      description: 'Test Description',
      service_date: '2023-10-27',
      status: 'sent' as const,
      created_at: '2023-10-20',
      updated_at: '2023-10-20',
    },
    contractor: { business_name: 'Test Corp' },
    property: {
      address_line1: '123 Main St',
      city: 'Montreal',
      province: 'QC',
      postal_code: 'H1H 1H1',
    },
    client: { name: 'John Doe' },
    tokenStatus: 'pending',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useJobByToken).mockReturnValue({ job: null, loading: true, error: null });
    render(<JobInvitePage />);
    expect(screen.getByTestId('page-loader')).toBeTruthy();
  });

  it('renders error state', () => {
    vi.mocked(useJobByToken).mockReturnValue({ job: null, loading: false, error: new Error('Failed') });
    render(<JobInvitePage />);
    expect(screen.getByText('public.invite.errorTitle')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('renders job details', () => {
    vi.mocked(useJobByToken).mockReturnValue({ job: mockJobDetails, loading: false, error: null });
    render(<JobInvitePage />);
    expect(screen.getByText('Test Corp')).toBeTruthy();
    expect(screen.getByText('Test Job')).toBeTruthy();
    expect(screen.getByText('Test Description')).toBeTruthy();
    expect(screen.getByText('123 Main St')).toBeTruthy();
  });

  it('handles approve action', async () => {
    vi.mocked(useJobByToken).mockReturnValue({ job: mockJobDetails, loading: false, error: null });
    vi.mocked(publicRepository.respondToInvite).mockResolvedValue({ data: null });

    render(<JobInvitePage />);

    const approveButton = screen.getByText('public.invite.approve');
    fireEvent.click(approveButton);

    expect(screen.getAllByText('common.processing').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(publicRepository.respondToInvite).toHaveBeenCalledWith('test-token', 'approve');
    });

    expect(screen.getByText('public.invite.success.approve')).toBeTruthy();
  });

  it('handles decline action', async () => {
    vi.mocked(useJobByToken).mockReturnValue({ job: mockJobDetails, loading: false, error: null });
    vi.mocked(publicRepository.respondToInvite).mockResolvedValue({ data: null });

    render(<JobInvitePage />);

    const declineButton = screen.getByText('public.invite.decline');
    fireEvent.click(declineButton);

    expect(screen.getAllByText('common.processing').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(publicRepository.respondToInvite).toHaveBeenCalledWith('test-token', 'decline');
    });

    expect(screen.getByText('public.invite.success.decline')).toBeTruthy();
  });

  it('shows error on action failure', async () => {
    vi.mocked(useJobByToken).mockReturnValue({ job: mockJobDetails, loading: false, error: null });
    vi.mocked(publicRepository.respondToInvite).mockResolvedValue({
        data: null,
        error: { message: 'Action failed', reason: 'server' }
    });

    render(<JobInvitePage />);

    const approveButton = screen.getByText('public.invite.approve');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText('Action failed')).toBeTruthy();
    });
  });

  it('shows already responded message if token status is used', () => {
      vi.mocked(useJobByToken).mockReturnValue({
          job: { ...mockJobDetails, tokenStatus: 'used' },
          loading: false,
          error: null
      });
      render(<JobInvitePage />);
      expect(screen.getByText('public.invite.alreadyResponded')).toBeTruthy();
      expect(screen.queryByText('public.invite.approve')).toBeNull();
  });
});
