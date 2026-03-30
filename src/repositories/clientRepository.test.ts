import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientRepository } from './clientRepository';

// Mock network reporting
vi.mock('../lib/network', () => ({
  reportApiOnline: vi.fn(),
  reportApiOffline: vi.fn(),
}));

describe('ClientRepository', () => {
  let repository: ClientRepository;
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();
  let mockClient: { auth: { getUser: typeof mockGetUser }; from: typeof mockFrom };

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    };

    // Instantiate repository with mocked client
    repository = new ClientRepository();
    // @ts-expect-error - injecting mock client into protected property
    repository.client = mockClient;
  });

  describe('create', () => {
    it('should return validation error when contractor id is missing', async () => {
      const result = await repository.create({ name: 'Test Client', type: 'individual', preferred_language: 'en' });

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('User must be authenticated to create a client');
      expect(result.error?.reason).toBe('validation');
    });

    it('should create client successfully', async () => {
      const mockData = { id: 'client-123', name: 'Test Client' };
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });

      mockClient.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await repository.create(
        { name: 'Test Client', type: 'individual', preferred_language: 'en' },
        'user-123'
      );

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();

      expect(mockClient.from).toHaveBeenCalledWith('clients');
      expect(mockInsert).toHaveBeenCalledWith({
        contractor_id: 'user-123',
        name: 'Test Client',
        email: null,
        preferred_language: 'en',
        type: 'individual',
      });
    });
  });
});
