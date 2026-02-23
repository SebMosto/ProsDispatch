import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JobInvitePage from './JobInvitePage';
import { publicRepository } from '../repositories/publicRepository';

// Mock dependencies
vi.mock('../repositories/publicRepository', () => ({
  publicRepository: {
    getJobByToken: vi.fn(),
    respondToInvite: vi.fn(),
  },
}));

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon" />,
}));

const renderPage = (token = 'test-token') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/job-invite/${token}`]}>
        <Routes>
          <Route path="/job-invite/:token" element={<JobInvitePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('JobInvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (publicRepository.getJobByToken as Mock).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('renders error state when token is invalid', async () => {
    (publicRepository.getJobByToken as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Invalid token', reason: 'server' },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('invite.page.error')).toBeInTheDocument();
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });

  it('renders job details when token is valid', async () => {
    (publicRepository.getJobByToken as Mock).mockResolvedValue({
      data: {
        id: 'job-123',
        title: 'Fix Leak',
        description: 'Kitchen sink leaking',
        service_date: '2023-10-25',
        status: 'sent',
        client: { name: 'John Doe' },
        property: { address: '123 Main St' },
        token_status: 'active',
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('invite.page.title')).toBeInTheDocument();
      expect(screen.getByText('Fix Leak')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });
  });

  it('handles approve action', async () => {
    (publicRepository.getJobByToken as Mock).mockResolvedValue({
      data: {
        id: 'job-123',
        title: 'Fix Leak',
        description: 'Kitchen sink leaking',
        service_date: '2023-10-25',
        status: 'sent',
        client: { name: 'John Doe' },
        property: { address: '123 Main St' },
        token_status: 'active',
      },
    });

    (publicRepository.respondToInvite as Mock).mockResolvedValue({
      data: { success: true, new_status: 'approved' },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('invite.page.approve')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('invite.page.approve'));

    await waitFor(() => {
      expect(publicRepository.respondToInvite).toHaveBeenCalledWith('test-token', 'approve');
      expect(screen.getByText('invite.page.successMessage')).toBeInTheDocument();
      expect(screen.getByText('invite.page.approved')).toBeInTheDocument();
    });
  });
});
