import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JobInvitePage from './JobInvitePage';
import { publicRepository } from '../../repositories/publicRepository';

// Mock router
vi.mock('../../lib/router', () => ({
  useParams: () => ({ token: 'test-token' }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: any) => <a>{children}</a>,
}));

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock repository
vi.mock('../../repositories/publicRepository', () => ({
  publicRepository: {
    getJobByToken: vi.fn(),
    respondToInvite: vi.fn(),
  },
}));

describe('JobInvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(publicRepository.getJobByToken).mockReturnValue(new Promise(() => {}));
    render(<JobInvitePage />);
    // Check for pulse animation elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error when job fetch fails', async () => {
    vi.mocked(publicRepository.getJobByToken).mockResolvedValue({
      data: null,
      error: { message: 'Failed to load', reason: 'server' },
    });

    render(<JobInvitePage />);

    await waitFor(() => {
      expect(screen.getByText('public.invite.errorTitle')).toBeInTheDocument();
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('renders job details when loaded', async () => {
    const mockJob = {
      id: '1',
      title: 'Fix Leak',
      description: 'Kitchen sink',
      status: 'sent',
      service_date: '2023-10-15',
      client_name: 'John Doe',
      property_address: '123 Main St',
      contractor_name: 'Acme Plumbing',
    };

    vi.mocked(publicRepository.getJobByToken).mockResolvedValue({
      data: mockJob,
      error: undefined,
    } as any);

    render(<JobInvitePage />);

    await waitFor(() => {
      expect(screen.getByText('Fix Leak')).toBeInTheDocument();
      expect(screen.getByText('public.invite.from')).toBeInTheDocument(); // Mocked translation
      expect(screen.getByText('Kitchen sink')).toBeInTheDocument();
    });
  });

  it('calls respondToInvite when approve button is clicked', async () => {
    const mockJob = {
      id: '1',
      title: 'Fix Leak',
      status: 'sent',
      contractor_name: 'Acme Plumbing',
    };

    vi.mocked(publicRepository.getJobByToken).mockResolvedValue({
      data: mockJob,
      error: undefined,
    } as any);

    vi.mocked(publicRepository.respondToInvite).mockResolvedValue({
      data: undefined,
      error: undefined,
    });

    render(<JobInvitePage />);

    await waitFor(() => {
      expect(screen.getByText('public.invite.approve')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('public.invite.approve'));

    expect(publicRepository.respondToInvite).toHaveBeenCalledWith('test-token', 'approve');
  });
});
