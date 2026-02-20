import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publicRepository } from './publicRepository';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('PublicRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getJobByToken calls get-job-by-token function', async () => {
    const mockData = { id: 'job-123', title: 'Test Job' };
    const invokeMock = vi.mocked(publicRepository['client'].functions.invoke);
    invokeMock.mockResolvedValue({ data: mockData, error: null } as any);

    const result = await publicRepository.getJobByToken('token-123');

    expect(invokeMock).toHaveBeenCalledWith('get-job-by-token', {
      body: { token: 'token-123' },
    });
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeUndefined();
  });

  it('respondToInvite calls respond-to-job-invite function', async () => {
    const invokeMock = vi.mocked(publicRepository['client'].functions.invoke);
    invokeMock.mockResolvedValue({ data: { message: 'Success' }, error: null } as any);

    const result = await publicRepository.respondToInvite('token-123', 'approve');

    expect(invokeMock).toHaveBeenCalledWith('respond-to-job-invite', {
      body: { token: 'token-123', response: 'approve' },
    });
    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
  });
});
