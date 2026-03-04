import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertyRepository } from './propertyRepository';

// Mock network reporting
vi.mock('../lib/network', () => ({
  reportApiOnline: vi.fn(),
  reportApiOffline: vi.fn(),
}));

describe('PropertyRepository', () => {
  let repository: PropertyRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    // Instantiate repository with mocked client
    repository = new PropertyRepository();
    // @ts-expect-error - injecting mock client into protected property
    repository.client = mockClient;
  });

  describe('create', () => {
    it('should create property successfully with country default', async () => {
      const mockUser = { id: 'user-123' };
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockData = { id: 'prop-123', address_line1: '123 Main St' };
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });

      mockClient.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const input = {
        client_id: 'client-123',
        address_line1: '123 Main St',
        city: 'Montreal',
        province: 'QC',
        postal_code: 'H1A 1A1',
        country: 'CA',
      } as const;

      const result = await repository.create(input);

      expect(result.data).toEqual(mockData);
      expect(mockInsert).toHaveBeenCalledWith({
        contractor_id: 'user-123',
        client_id: 'client-123',
        address_line1: '123 Main St',
        address_line2: null,
        city: 'Montreal',
        province: 'QC',
        postal_code: 'H1A 1A1',
        country: 'CA',
        nickname: null,
      });
    });

    it('should create property successfully with custom country', async () => {
      const mockUser = { id: 'user-123' };
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockData = { id: 'prop-123', address_line1: '123 Main St' };
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });

      mockClient.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const input = {
        client_id: 'client-123',
        address_line1: '123 Main St',
        city: 'Quebec',
        province: 'QC',
        postal_code: 'G1A 0A2',
        country: 'US',
      } as const;

      const result = await repository.create(input);

      expect(result.data).toEqual(mockData);
      expect(mockInsert).toHaveBeenCalledWith({
        contractor_id: 'user-123',
        client_id: 'client-123',
        address_line1: '123 Main St',
        address_line2: null,
        city: 'NY',
        province: 'NY',
        postal_code: '10001',
        country: 'US',
        nickname: null,
      });
    });
  });

  describe('update', () => {
    it('should update property successfully', async () => {
      const mockData = { id: 'prop-123' };
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });

      mockClient.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      const input = {
        nickname: 'Home',
      };

      const result = await repository.update('prop-123', input);

      expect(result.data).toEqual(mockData);
      expect(mockUpdate).toHaveBeenCalledWith({
        nickname: 'Home',
        country: undefined,
        address_line2: undefined,
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'prop-123');
    });
  });
});
