import { renderHook, waitFor } from '@testing-library/react';
import { useAdminMetrics } from './useAdminMetrics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAdminMetrics', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('fetches and returns admin metrics successfully', async () => {
    const mockData = [
      {
        total_users: 10,
        active_users: 5,
        total_jobs: 50,
        active_jobs: 20,
        total_revenue_cents: 100000,
      },
    ];

    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result } = renderHook(() => useAdminMetrics(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData[0]);
    expect(supabase.rpc).toHaveBeenCalledWith('get_admin_metrics');
  });

  it('handles error from Supabase RPC', async () => {
    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'Access denied' },
    });

    const { result } = renderHook(() => useAdminMetrics(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Access denied');
  });

  it('handles empty data return', async () => {
    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(() => useAdminMetrics(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('No admin metrics data returned');
  });
});
