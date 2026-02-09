import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useJobs } from './useJobs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jobRepository } from '../repositories/jobRepository';

// Mock jobRepository
vi.mock('../repositories/jobRepository', () => ({
  jobRepository: {
    list: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return referentially stable result object when data does not change', async () => {
    (jobRepository.list as Mock).mockResolvedValue({ data: [], error: null });

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(() => useJobs(), { wrapper });

    const firstResult = result.current;

    // Rerender with same props (or no props)
    rerender();

    const secondResult = result.current;

    expect(secondResult).toBe(firstResult);
  });
});
