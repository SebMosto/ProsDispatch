import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import JobApprovalPage from './JobApprovalPage';
import { supabase } from '../lib/supabase';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock useTranslation with stable reference
const mockT = (key: string, defaultVal?: string) => defaultVal || key;
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'en' },
  }),
}));

const mockJob = {
  id: 'job-123',
  title: 'Test Job',
  description: 'Test Description',
  service_date: '2023-01-01',
  status: 'sent',
  client_name: 'Client Name',
  property_address: '123 Main St',
  contractor: {
    name: 'Contractor Name',
  },
};

describe('JobApprovalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (supabase.functions.invoke as unknown as Mock).mockResolvedValueOnce({ data: {} });
    render(
      <MemoryRouter initialEntries={['/jobs/approve/token123']}>
        <Routes>
          <Route path="/jobs/approve/:token" element={<JobApprovalPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders job details after loading', async () => {
    (supabase.functions.invoke as unknown as Mock).mockResolvedValueOnce({ data: { data: mockJob } });

    render(
      <MemoryRouter initialEntries={['/jobs/approve/token123']}>
        <Routes>
          <Route path="/jobs/approve/:token" element={<JobApprovalPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText(/Contractor Name/)).toBeInTheDocument();
  });

  it('handles approval action', async () => {
    // Robust mock implementation
    (supabase.functions.invoke as unknown as Mock).mockImplementation((functionName: string) => {
        if (functionName === 'get-job-by-token') {
            return Promise.resolve({ data: { data: mockJob } });
        }
        if (functionName === 'respond-to-job-invite') {
            return Promise.resolve({ data: { success: true } });
        }
        return Promise.resolve({ error: 'Unknown function' });
    });

    render(
      <MemoryRouter initialEntries={['/jobs/approve/token123']}>
        <Routes>
          <Route path="/jobs/approve/:token" element={<JobApprovalPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for button to appear
    const approveButton = await screen.findByText('Approve Job');

    // Click it
    fireEvent.click(approveButton);

    // Wait for success message
    expect(await screen.findByText('Job Approved')).toBeInTheDocument();

    expect(supabase.functions.invoke).toHaveBeenCalled(); // At least called
    const calls = (supabase.functions.invoke as unknown as Mock).mock.calls;

    // Verify arguments
    const getJobCall = calls.find((call: unknown[]) => call[0] === 'get-job-by-token');
    expect(getJobCall).toBeTruthy();
    expect(getJobCall?.[1]).toEqual({ body: { token: 'token123' } });

    const respondCall = calls.find((call: unknown[]) => call[0] === 'respond-to-job-invite');
    expect(respondCall).toBeTruthy();
    expect(respondCall?.[1]).toEqual({ body: { token: 'token123', action: 'approve' } });
  });
});
