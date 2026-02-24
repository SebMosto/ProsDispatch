import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicJobPage from './PublicJobPage';
import { jobRepository } from '../../repositories/jobRepository';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock repository
vi.mock('../../repositories/jobRepository', () => ({
  jobRepository: {
    getJobByToken: vi.fn(),
    respondToInvite: vi.fn(),
  },
}));

// Mock PageLoader
vi.mock('../../components/ui/PageLoader', () => ({
  PageLoader: () => <div data-testid="page-loader">Loading...</div>,
}));

// Mock JobStatusBadge
vi.mock('../../components/jobs/JobStatusBadge', () => ({
  default: ({ status }: { status: string }) => <div data-testid="status-badge">{status}</div>,
}));

describe('PublicJobPage', () => {
  const mockJob = {
    id: 'job-123',
    title: 'Test Job',
    description: 'Test Description',
    service_date: '2023-01-01',
    status: 'sent' as const,
    contractor_id: 'contractor-123',
    client_name: 'Client Name',
    property_address: '123 Main St',
    contractor: {
      name: 'Contractor Name',
      business_name: 'Contractor Business',
      email: 'contractor@example.com',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job details when loaded', async () => {
    vi.mocked(jobRepository.getJobByToken).mockResolvedValue({ data: mockJob, error: undefined });

    render(
      <MemoryRouter initialEntries={['/job-invite/token-123']}>
        <Routes>
            <Route path="/job-invite/:token" element={<PublicJobPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Job')).toBeInTheDocument();
      expect(screen.getByText('Contractor Business')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });
  });

  it('handles approval action', async () => {
    vi.mocked(jobRepository.getJobByToken).mockResolvedValue({ data: mockJob, error: undefined });
    vi.mocked(jobRepository.respondToInvite).mockResolvedValue({ data: null, error: undefined });

    render(
      <MemoryRouter initialEntries={['/job-invite/token-123']}>
        <Routes>
            <Route path="/job-invite/:token" element={<PublicJobPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Test Job')).toBeInTheDocument());

    const approveButton = screen.getByText('Approve Job');
    fireEvent.click(approveButton);

    await waitFor(() => {
        expect(jobRepository.respondToInvite).toHaveBeenCalledWith('token-123', 'approve');
        expect(screen.getByText('Thank you for your approval!')).toBeInTheDocument();
    });
  });
});
