import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthActions } from './useAuth';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

describe('useAuthActions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle signIn success', async () => {
    (supabase.auth.signInWithPassword as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useAuthActions());

    await act(async () => {
      await result.current.signIn({ email: 'test@example.com', password: 'password123' });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle signIn failure', async () => {
    (supabase.auth.signInWithPassword as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    const { result } = renderHook(() => useAuthActions());

    await act(async () => {
        try {
            await result.current.signIn({ email: 'test@example.com', password: 'wrong' });
        } catch {
            // Expected
        }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Invalid login credentials');
  });
});
