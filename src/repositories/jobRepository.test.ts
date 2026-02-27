import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JobRepository } from './jobRepository';
import { supabase } from '../lib/supabase';

// Mock functions need to be defined outside or inside the factory if they are not hoisted correctly,
// but vi.mock is hoisted. Variables used inside vi.mock factory must be defined inside it or imported from another module.
// However, here we want to access the mocks to assert on them.
// The solution is to use vi.hoisted() or define the mock factory inline without external references that aren't hoisted.

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockIs = vi.fn();
  const mockIn = vi.fn();
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();
  const mockRpc = vi.fn();
  const mockInvoke = vi.fn();

  return {
    mockSelect,
    mockInsert,
    mockUpdate,
    mockEq,
    mockIs,
    mockIn,
    mockOrder,
    mockSingle,
    mockRpc,
    mockInvoke,
    mockSupabase: {
      from: vi.fn(() => ({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      })),
      rpc: mockRpc,
      functions: {
        invoke: mockInvoke,
      },
    }
  };
});

vi.mock('../lib/supabase', () => ({
  supabase: mocks.mockSupabase,
}));

// Helper to chain mocks
const chain = (mock: any) => mock.mockReturnThis();

describe('JobRepository', () => {
  let repository: JobRepository;

  beforeEach(() => {
    repository = new JobRepository();
    // Inject mock client
    (repository as any).client = supabase;

    // Reset mocks
    vi.clearAllMocks();

    // Default chain setup
    chain(mocks.mockSelect);
    chain(mocks.mockInsert);
    chain(mocks.mockUpdate);
    chain(mocks.mockEq);
    chain(mocks.mockIs);
    chain(mocks.mockIn);
    chain(mocks.mockOrder);

    // Link chains
    mocks.mockSelect.mockReturnValue({ eq: mocks.mockEq, order: mocks.mockOrder, in: mocks.mockIn, is: mocks.mockIs });
    mocks.mockEq.mockReturnValue({ is: mocks.mockIs, single: mocks.mockSingle });
    mocks.mockIs.mockReturnValue({ single: mocks.mockSingle });
    mocks.mockOrder.mockReturnValue({ in: mocks.mockIn, is: mocks.mockIs });
    mocks.mockUpdate.mockReturnValue({ eq: mocks.mockEq });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch jobs successfully', async () => {
      const mockData = [{ id: '1', title: 'Test Job' }];

      const queryBuilder = {
        in: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockData, error: null }),
      };

      mocks.mockSelect.mockReturnValue({
        order: vi.fn().mockReturnValue(queryBuilder),
      });

      const result = await repository.list();

      expect(mocks.mockSupabase.from).toHaveBeenCalledWith('jobs');
      expect(result.data).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('should create a job via RPC', async () => {
      const input = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'New Job',
      };

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        ...input,
        status: 'draft',
        contractor_id: '123e4567-e89b-12d3-a456-426614174002',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        description: null,
        service_date: null,
        deleted_at: null
      };

      mocks.mockRpc.mockResolvedValue({ data: mockJob, error: null });

      const result = await repository.create(input);

      expect(mocks.mockRpc).toHaveBeenCalledWith('create_job', expect.objectContaining({
        title: 'New Job'
      }));
      expect(result.data).toEqual(mockJob);
    });
  });

  describe('update', () => {
    it('should call transition_job_state if status is provided', async () => {
      mocks.mockRpc.mockResolvedValue({ data: true, error: null });
      // update also calls get() at the end, so we need to mock that
      const mockJob = { id: 'job-123', status: 'sent' };

      // Mock get() chain
      const getQueryBuilder = {
        single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
      };
      mocks.mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue(getQueryBuilder)
        })
      });

      await repository.update('job-123', { status: 'sent' });

      expect(mocks.mockRpc).toHaveBeenCalledWith('transition_job_state', {
        job_id: 'job-123',
        new_status: 'sent',
      });
    });
  });

  describe('inviteHomeowner', () => {
    it('should call the invite-homeowner edge function successfully', async () => {
      const mockData = { token: 'test-token', message: 'Invite sent' };
      mocks.mockInvoke.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.inviteHomeowner('job-123');

      expect(mocks.mockInvoke).toHaveBeenCalledWith('invite-homeowner', {
        body: { jobId: 'job-123' },
      });
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });
  });

  describe('getJobByToken', () => {
    it('should call the get-job-by-token edge function successfully', async () => {
      const mockData = {
        job: { title: 'Test Job' },
        contractor: { business_name: 'Test Biz' },
      };
      mocks.mockInvoke.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getJobByToken('token-123');

      expect(mocks.mockInvoke).toHaveBeenCalledWith('get-job-by-token', {
        body: { token: 'token-123' },
      });
      expect(result.data).toEqual(mockData);
    });
  });

  describe('respondToInvite', () => {
    it('should call the respond-to-job-invite edge function successfully', async () => {
      const mockData = { success: true, newStatus: 'approved' };
      mocks.mockInvoke.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.respondToInvite('token-123', 'approve');

      expect(mocks.mockInvoke).toHaveBeenCalledWith('respond-to-job-invite', {
        body: { token: 'token-123', response: 'approve' },
      });
      expect(result.data).toEqual(mockData);
    });
  });
});
