import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobRepository } from './jobRepository';

// Mock network reporting
vi.mock('../lib/network', () => ({
  reportApiOnline: vi.fn(),
  reportApiOffline: vi.fn(),
}));

describe('JobRepository', () => {
  let repository: JobRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      rpc: vi.fn(),
      from: vi.fn(),
    };

    // Instantiate repository
    repository = new JobRepository();
    // @ts-expect-error - injecting mock client into protected property
    repository.client = mockClient;
  });

  describe('create', () => {
    it('should call create_job RPC', async () => {
      const input = {
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        property_id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'New Job',
        description: 'Test Description',
        service_date: '2023-10-27',
      };

      const mockData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        contractor_id: '550e8400-e29b-41d4-a716-446655440003',
        client_id: input.client_id,
        property_id: input.property_id,
        title: input.title,
        description: input.description,
        service_date: input.service_date,
        status: 'draft' as const,
        created_at: '2023-10-27T00:00:00Z',
        updated_at: '2023-10-27T00:00:00Z',
        deleted_at: null,
      };
      mockClient.rpc.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.create(input);

      expect(mockClient.rpc).toHaveBeenCalledWith('create_job', {
        client_id: input.client_id,
        property_id: input.property_id,
        title: input.title,
        description: input.description,
        service_date: input.service_date,
      });

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });

    it('should handle RPC errors', async () => {
      mockClient.rpc.mockResolvedValue({ data: null, error: { message: 'RPC Error' } });

      const result = await repository.create({
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        property_id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'New Job',
      });

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('RPC Error');
    });

    it('should handle invalid RPC response data', async () => {
      // Mock RPC returning data that doesn't match JobRecord schema
      const invalidData = { id: 'job-123', invalid_field: 'value' };
      mockClient.rpc.mockResolvedValue({ data: invalidData, error: null });

      const result = await repository.create({
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        property_id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'New Job',
      });

      expect(result.data).toBeNull();
      expect(result.error?.type).toBe('unknown');
      expect(result.error?.message).toBe('Invalid data returned from create_job RPC');
    });
  });

  describe('update', () => {
    it('should call transition_job_state RPC if status is present', async () => {
      const jobId = 'job-123';
      const input = { status: 'sent' as const };
      const mockJob = { id: jobId, status: 'sent' };

      mockClient.rpc.mockResolvedValue({ data: true, error: null });

      // Mock chain for get() which is still called for status-only updates
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
      };

      mockClient.from.mockReturnValue(mockBuilder);

      const result = await repository.update(jobId, input);

      expect(mockClient.rpc).toHaveBeenCalledWith('transition_job_state', {
        job_id: jobId,
        new_status: 'sent',
      });

      expect(mockBuilder.select).toHaveBeenCalledWith('*');
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', jobId);
      expect(mockBuilder.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result.data).toEqual(mockJob);
    });

    it('should call regular update if other fields are present', async () => {
      const jobId = 'job-123';
      const input = { title: 'Updated Title' };
      const mockJob = { id: jobId, title: 'Updated Title' };

      // Mock chain for optimized update - no get() call
      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
        is: vi.fn().mockReturnThis(), // Should not be called
      };

      mockClient.from.mockReturnValue(mockBuilder);

      const result = await repository.update(jobId, input);

      expect(mockBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title' }));
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', jobId);
      expect(mockBuilder.select).toHaveBeenCalled();
      expect(mockBuilder.single).toHaveBeenCalled();
      expect(mockBuilder.is).not.toHaveBeenCalled();
      expect(result.data).toEqual(mockJob);
    });

    it('should handle both status and fields update', async () => {
      const jobId = 'job-123';
      const input = { status: 'sent' as const, title: 'Updated Title' };
      const mockJob = { id: jobId, status: 'sent', title: 'Updated Title' };

      mockClient.rpc.mockResolvedValue({ data: true, error: null });

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
        is: vi.fn().mockReturnThis(), // Should not be called
      };

      mockClient.from.mockReturnValue(mockBuilder);

      const result = await repository.update(jobId, input);

      expect(mockClient.rpc).toHaveBeenCalledWith('transition_job_state', {
        job_id: jobId,
        new_status: 'sent',
      });

      expect(mockBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title' }));
      expect(mockBuilder.select).toHaveBeenCalled();
      expect(mockBuilder.single).toHaveBeenCalled();
      expect(mockBuilder.is).not.toHaveBeenCalled();
      expect(result.data).toEqual(mockJob);
    });
  });
});
