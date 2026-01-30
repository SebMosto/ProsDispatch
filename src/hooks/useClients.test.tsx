import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClients } from './useClients';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clientRepository } from '../repositories/clientRepository';
import { propertyRepository } from '../repositories/propertyRepository';

// Mock repositories
vi.mock('../repositories/clientRepository', () => ({
  clientRepository: {
    list: vi.fn(),
  },
}));

vi.mock('../repositories/propertyRepository', () => ({
  propertyRepository: {
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

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return referentially stable result object when data does not change', async () => {
    (clientRepository.list as Mock).mockResolvedValue({ data: [], error: null });
    (propertyRepository.list as Mock).mockResolvedValue({ data: [], error: null });

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(() => useClients(), { wrapper });

    const firstResult = result.current;

    // Rerender
    rerender();

    const secondResult = result.current;

    expect(secondResult).toBe(firstResult);
  });
});
