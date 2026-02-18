import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import JobApprovalPage from './JobApprovalPage';
import { supabase } from '../../lib/supabase';
import { useParams } from '../../lib/router';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock router
vi.mock('../../lib/router', () => ({
  useParams: vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('JobApprovalPage', () => {
  const mockToken = 'test-token';
  const mockJobData = {
    job: {
      id: 'job-123',
      title: 'Fix Leak',
      description: 'Kitchen sink leak',
      service_date: '2023-10-25',
      status: 'sent',
      contractor: { name: 'Bob Builder' },
      client: { name: 'Alice' },
      property: { address: '123 Main St' },
    },
    token_status: 'active',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as unknown as Mock).mockReturnValue({ token: mockToken });
  });

  it('fetches and displays job details', async () => {
    (supabase.functions.invoke as unknown as Mock).mockResolvedValue({ data: mockJobData, error: null });

    render(<JobApprovalPage />);

    await waitFor(() => {
      expect(screen.getByText('Fix Leak')).toBeInTheDocument();
      expect(screen.getByText('Bob Builder', { exact: false })).toBeInTheDocument();
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('get-job-by-token', {
      body: { token: mockToken },
    });
  });

  it('handles approve action', async () => {
    (supabase.functions.invoke as unknown as Mock)
      .mockResolvedValueOnce({ data: mockJobData, error: null }) // load
      .mockResolvedValueOnce({ data: { success: true }, error: null }); // action

    render(<JobApprovalPage />);

    await waitFor(() => screen.getByText('Approve Job'));

    fireEvent.click(screen.getByText('Approve Job'));

    await waitFor(() => {
      expect(screen.getByText('Job Approved!')).toBeInTheDocument();
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('respond-to-job-invite', {
      body: { token: mockToken, action: 'approve' },
    });
  });

  it('handles decline action', async () => {
    (supabase.functions.invoke as unknown as Mock)
      .mockResolvedValueOnce({ data: mockJobData, error: null }) // load
      .mockResolvedValueOnce({ data: { success: true }, error: null }); // action

    render(<JobApprovalPage />);

    await waitFor(() => screen.getByText('Decline'));

    fireEvent.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(screen.getByText('Job Declined')).toBeInTheDocument();
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('respond-to-job-invite', {
      body: { token: mockToken, action: 'decline' },
    });
  });

  it('shows error state if fetch fails', async () => {
    (supabase.functions.invoke as unknown as Mock).mockResolvedValue({ data: null, error: new Error('Network Error') });

    render(<JobApprovalPage />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Job')).toBeInTheDocument();
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });
});
