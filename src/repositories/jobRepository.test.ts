import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobRepository } from './jobRepository';

// Mock network reporting
vi.mock('../lib/network', () => ({
  reportApiOnline: vi.fn(),
  reportApiOffline: vi.fn(),
}));

describe('JobRepository', () => {
  let repository: JobRepository;
  let mockClient: {
    rpc: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
  };

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
        status: 'draft' as const,
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
      mockClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC Error', code: '500', details: null, hint: null },
      });

      const result = await repository.create({
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        property_id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'New Job',
        status: 'draft' as const,
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
        status: 'draft' as const,
      });

      expect(result.data).toBeNull();
      expect(result.error?.reason).toBe<'validation'>('validation');
      expect(result.error?.message).toBe('Invalid data returned from create_job RPC');
    });
  });

  describe('listByClient', () => {
    it('should return jobs for client ordered by created_at DESC', async () => {
      const clientId = '550e8400-e29b-41d4-a716-446655440001';
      const mockJobs = [
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          contractor_id: '550e8400-e29b-41d4-a716-446655440003',
          client_id: clientId,
          property_id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Job A',
          description: null,
          service_date: null,
          status: 'draft',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          deleted_at: null,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          contractor_id: '550e8400-e29b-41d4-a716-446655440003',
          client_id: clientId,
          property_id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Job B',
          description: null,
          service_date: null,
          status: 'sent',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          deleted_at: null,
        },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
      };

      mockClient.from.mockReturnValue(mockBuilder);

      const result = await repository.listByClient(clientId);

      expect(mockClient.from).toHaveBeenCalledWith('jobs');
      expect(mockBuilder.eq).toHaveBeenCalledWith('client_id', clientId);
      expect(mockBuilder.is).toHaveBeenCalledWith('deleted_at', null);
      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.error).toBeUndefined();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.title).toBe('Job A');
    });

    it('should return error when query fails', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB Error', code: '500', details: null, hint: null },
        }),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      const result = await repository.listByClient('550e8400-e29b-41d4-a716-446655440001');

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('DB Error');
    });
  });

  describe('update', () => {
    const mockJobComplete = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      contractor_id: '550e8400-e29b-41d4-a716-446655440001',
      client_id: '550e8400-e29b-41d4-a716-446655440002',
      property_id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Updated Job',
      description: 'Description',
      service_date: '2023-01-01',
      status: 'draft',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      deleted_at: null,
    };

    it('should call transition_job_state RPC if status is present', async () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000';
      const input = { status: 'sent' as const };

      mockClient.rpc.mockResolvedValue({ data: true, error: null });

      const mockJob = { ...mockJobComplete, status: 'sent' };

      // Mock chain for get()
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

      expect(result.data).toEqual(mockJob);
    });

    it('should call regular update if other fields are present', async () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000';
      const input = { title: 'Updated Title' };
      const mockJob = { ...mockJobComplete, title: 'Updated Title' };

      // Mock chain that handles both update() and get() calls
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
        // Make the builder thenable to support await query
        then: (resolve: (value: { data: unknown; error: null }) => void) => {
          resolve({ data: null, error: null });
        },
      };

      mockClient.from.mockReturnValue(mockBuilder);

      const result = await repository.update(jobId, input);

      expect(mockBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title' }));
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', jobId);
      expect(result.data).toEqual(mockJob);
    });

    it('should handle both status and fields update', async () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000';
      const input = { status: 'sent' as const, title: 'Updated Title' };
      const mockJob = { ...mockJobComplete, status: 'sent', title: 'Updated Title' };

      mockClient.rpc.mockResolvedValue({ data: true, error: null });

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
        then: (resolve: (value: { data: unknown; error: null }) => void) => {
          resolve({ data: null, error: null });
        },
      };

      mockClient.from.mockReturnValue(mockBuilder);

      const result = await repository.update(jobId, input);

      expect(mockClient.rpc).toHaveBeenCalledWith('transition_job_state', {
        job_id: jobId,
        new_status: 'sent',
      });

      expect(mockBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title' }));
      expect(result.data).toEqual(mockJob);
    });
  });
});
