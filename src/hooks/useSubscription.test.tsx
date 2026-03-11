import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubscription } from './useSubscription';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call create-checkout-session with returnUrl', async () => {
    const mockInvoke = supabase.functions.invoke as unknown as Mock;
    mockInvoke.mockResolvedValue({ data: { url: 'https://checkout.stripe.com/test' }, error: null });

    // Mock window.location
    const originalLocation = window.location;
    const mockOrigin = 'http://localhost:3000';

    // We can't easily redefine window.location in jsdom environment this way sometimes,
    // but let's try assuming standard jsdom behavior or use Object.defineProperty if needed.
    // However, jsdom usually allows setting href but origin is read-only.
    // Let's rely on what jsdom provides for origin (usually localhost or similar) or force it.

    Object.defineProperty(window, 'location', {
      value: {
        origin: mockOrigin,
        href: '',
      },
      writable: true,
    });

    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.checkout();
    });

    expect(mockInvoke).toHaveBeenCalledWith('create-checkout-session', {
      body: {
        returnUrl: mockOrigin,
      },
    });

    expect(window.location.href).toBe('https://checkout.stripe.com/test');

    // Restore window.location (best effort)
    Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
    });
  });

  it('should handle errors from supabase', async () => {
     const mockInvoke = supabase.functions.invoke as unknown as Mock;
     mockInvoke.mockResolvedValue({ data: null, error: { message: 'Supabase error' } });

     const { result } = renderHook(() => useSubscription());

     await act(async () => {
       await result.current.checkout();
     });

     expect(result.current.error).toBe('Supabase error');
     expect(result.current.isLoading).toBe(false);
  });
});
