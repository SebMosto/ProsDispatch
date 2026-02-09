import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClients } from './useClients';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Hoist mocks to ensure they are available for vi.mock
const { mockListClients, mockListProperties } = vi.hoisted(() => ({
  mockListClients: vi.fn(),
  mockListProperties: vi.fn(),
}));

// Mock repositories
vi.mock('@/repositories/clientRepository', () => ({
  clientRepository: {
    list: mockListClients,
  },
}));

vi.mock('@/repositories/propertyRepository', () => ({
  propertyRepository: {
    list: mockListProperties,
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
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be referentially stable across re-renders when data has not changed', async () => {
    mockListClients.mockResolvedValue({ data: [], error: null });
    mockListProperties.mockResolvedValue({ data: [], error: null });

    const { result, rerender } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    // Wait for loading to finish
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstResult = result.current;

    // Force re-render
    rerender();

    const secondResult = result.current;

    // This assertion expects referential equality (memoization)
    // It should FAIL before the fix
    expect(secondResult).toBe(firstResult);
  });
});
