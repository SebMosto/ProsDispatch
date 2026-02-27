import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobInvitePage } from './JobInvitePage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { jobRepository } from '../repositories/jobRepository';

// Mock repository
vi.mock('../repositories/jobRepository', () => ({
  jobRepository: {
    getJobByToken: vi.fn(),
    respondToInvite: vi.fn(),
  },
}));

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('JobInvitePage', () => {
  const mockJobData = {
    job: {
      title: 'Fix Leak',
      description: 'Fixing kitchen sink leak',
      service_date: '2023-10-15',
      client_name: 'John Doe',
      property_address: {
        address_line1: '123 Main St',
        city: 'Montreal',
        province: 'QC',
        postal_code: 'H1A 1A1',
      },
      status: 'sent',
    },
    contractor: {
      business_name: 'Plumbing Co',
      full_name: 'Bob Builder',
      email: 'bob@example.com',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Return a pending promise to simulate loading
    vi.mocked(jobRepository.getJobByToken).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={['/job-invite/test-token']}>
        <Routes>
          <Route path="/job-invite/:token" element={<JobInvitePage />} />
        </Routes>
      </MemoryRouter>
    );

    // We expect job content NOT to be there yet
    expect(screen.queryByText('Fix Leak')).not.toBeInTheDocument();
  });

  it('renders job details upon successful load', async () => {
    vi.mocked(jobRepository.getJobByToken).mockResolvedValue({
      data: mockJobData as any,
      error: undefined,
    });

    render(
      <MemoryRouter initialEntries={['/job-invite/test-token']}>
        <Routes>
          <Route path="/job-invite/:token" element={<JobInvitePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Plumbing Co')).toBeInTheDocument();
      expect(screen.getByText('Fix Leak')).toBeInTheDocument();
      expect(screen.getByText('Fixing kitchen sink leak')).toBeInTheDocument();
    });
  });

  it('renders error state if fetch fails', async () => {
    vi.mocked(jobRepository.getJobByToken).mockResolvedValue({
      data: null,
      error: { message: 'Invalid token' } as any,
    });

    render(
      <MemoryRouter initialEntries={['/job-invite/test-token']}>
        <Routes>
          <Route path="/job-invite/:token" element={<JobInvitePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // "Error" is the default value for 'jobInvite.errorTitle' key in our mock
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });

  it('handles approve action', async () => {
    vi.mocked(jobRepository.getJobByToken).mockResolvedValue({
      data: mockJobData as any,
      error: undefined,
    });
    vi.mocked(jobRepository.respondToInvite).mockResolvedValue({
      data: { success: true, newStatus: 'approved' },
      error: undefined,
    });

    render(
      <MemoryRouter initialEntries={['/job-invite/test-token']}>
        <Routes>
          <Route path="/job-invite/:token" element={<JobInvitePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Approve Job')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Approve Job'));

    await waitFor(() => {
      expect(jobRepository.respondToInvite).toHaveBeenCalledWith('test-token', 'approve');
      expect(screen.getByText('Job Approved!')).toBeInTheDocument();
    });
  });
});
