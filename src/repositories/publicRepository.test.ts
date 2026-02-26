import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { publicRepository } from './publicRepository';
import { supabase } from '../lib/supabase';
import { reportApiOnline, reportApiOffline } from '../lib/network';

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('../lib/network', () => ({
  reportApiOnline: vi.fn(),
  reportApiOffline: vi.fn(),
}));

describe('PublicRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getJobByToken', () => {
    it('should return job details on success', async () => {
      const mockData = {
        job: { title: 'Test Job' },
        contractor: { business_name: 'Test Corp' },
      };

      (supabase.functions.invoke as unknown as Mock).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await publicRepository.getJobByToken('valid-token');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('get-job-by-token', {
        body: { token: 'valid-token' },
      });
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
      expect(reportApiOnline).toHaveBeenCalled();
    });

    it('should return error on failure', async () => {
      const mockError = { message: 'Function error' };
      (supabase.functions.invoke as unknown as Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await publicRepository.getJobByToken('invalid-token');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Function error');
      expect(reportApiOffline).toHaveBeenCalled();
    });
  });

  describe('respondToInvite', () => {
    it('should succeed on valid action', async () => {
      (supabase.functions.invoke as unknown as Mock).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await publicRepository.respondToInvite('token', 'approve');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('respond-to-job-invite', {
        body: { token: 'token', action: 'approve' },
      });
      expect(result.error).toBeUndefined();
      expect(reportApiOnline).toHaveBeenCalled();
    });

    it('should return error on failure', async () => {
      const mockError = { message: 'Invalid token' };
      (supabase.functions.invoke as unknown as Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await publicRepository.respondToInvite('token', 'decline');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid token');
      expect(reportApiOffline).toHaveBeenCalled();
    });
  });
});
