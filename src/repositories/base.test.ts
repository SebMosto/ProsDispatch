import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseRepository } from './base';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import * as network from '../lib/network';
import type { Database } from '../types/database.types';

// Mock the network module
vi.mock('../lib/network', () => ({
  reportApiOffline: vi.fn(),
  reportApiOnline: vi.fn(),
}));

// Create a concrete implementation for testing
class TestRepository extends BaseRepository {
  public testToRepositoryError(error: PostgrestError | null) {
    return this.toRepositoryError(error);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TestRepository({} as SupabaseClient<Database>);
  });

  describe('toRepositoryError', () => {
    it('should return null for null error', () => {
      const result = repository.testToRepositoryError(null);
      expect(result).toBeNull();
      expect(network.reportApiOffline).not.toHaveBeenCalled();
      expect(network.reportApiOnline).not.toHaveBeenCalled();
    });

    it('should treat errors without status code as network errors and report offline', () => {
      const error: PostgrestError = {
        message: 'Failed to fetch',
        details: '',
        hint: '',
        code: '',
      };

      const result = repository.testToRepositoryError(error);

      expect(result).toEqual({
        message: 'Failed to fetch',
        status: undefined,
        reason: 'network',
        cause: error,
      });
      expect(network.reportApiOffline).toHaveBeenCalledTimes(1);
      expect(network.reportApiOnline).not.toHaveBeenCalled();
    });

    it('should treat errors with undefined code as network errors and report offline', () => {
      const error = {
        message: 'Network request failed',
        details: '',
        hint: '',
      } as PostgrestError;

      const result = repository.testToRepositoryError(error);

      expect(result).toEqual({
        message: 'Network request failed',
        status: undefined,
        reason: 'network',
        cause: error,
      });
      expect(network.reportApiOffline).toHaveBeenCalledTimes(1);
      expect(network.reportApiOnline).not.toHaveBeenCalled();
    });

    it('should treat 408 errors as network errors and report offline', () => {
      const error: PostgrestError = {
        message: 'Request Timeout',
        details: '',
        hint: '',
        code: '408',
      };

      const result = repository.testToRepositoryError(error);

      expect(result).toEqual({
        message: 'Request Timeout',
        status: 408,
        reason: 'network',
        cause: error,
      });
      expect(network.reportApiOffline).toHaveBeenCalledTimes(1);
      expect(network.reportApiOnline).not.toHaveBeenCalled();
    });

    it('should treat 503 errors as network errors and report offline', () => {
      const error: PostgrestError = {
        message: 'Service Unavailable',
        details: '',
        hint: '',
        code: '503',
      };

      const result = repository.testToRepositoryError(error);

      expect(result).toEqual({
        message: 'Service Unavailable',
        status: 503,
        reason: 'network',
        cause: error,
      });
      expect(network.reportApiOffline).toHaveBeenCalledTimes(1);
      expect(network.reportApiOnline).not.toHaveBeenCalled();
    });

    it('should treat server errors with valid status codes as server errors and report online', () => {
      const error: PostgrestError = {
        message: 'Internal Server Error',
        details: '',
        hint: '',
        code: '500',
      };

      const result = repository.testToRepositoryError(error);

      expect(result).toEqual({
        message: 'Internal Server Error',
        status: 500,
        reason: 'server',
        cause: error,
      });
      expect(network.reportApiOnline).toHaveBeenCalledTimes(1);
      expect(network.reportApiOffline).not.toHaveBeenCalled();
    });

    it('should treat 400 errors as server errors and report online', () => {
      const error: PostgrestError = {
        message: 'Bad Request',
        details: '',
        hint: '',
        code: '400',
      };

      const result = repository.testToRepositoryError(error);

      expect(result).toEqual({
        message: 'Bad Request',
        status: 400,
        reason: 'server',
        cause: error,
      });
      expect(network.reportApiOnline).toHaveBeenCalledTimes(1);
      expect(network.reportApiOffline).not.toHaveBeenCalled();
    });

    it('should treat 404 errors as server errors and report online', () => {
      const error: PostgrestError = {
        message: 'Not Found',
        details: '',
        hint: '',
        code: '404',
      };

      const result = repository.testToRepositoryError(error);

      expect(result).toEqual({
        message: 'Not Found',
        status: 404,
        reason: 'server',
        cause: error,
      });
      expect(network.reportApiOnline).toHaveBeenCalledTimes(1);
      expect(network.reportApiOffline).not.toHaveBeenCalled();
    });

    it('should not report status change for errors with non-numeric codes', () => {
      const error: PostgrestError = {
        message: 'Some error',
        details: '',
        hint: '',
        code: 'PGRST116',
      };

      const result = repository.testToRepositoryError(error);

      expect(result).toEqual({
        message: 'Some error',
        status: undefined,
        reason: 'server',
        cause: error,
      });
      // Should not report online since code is not a valid HTTP status
      expect(network.reportApiOnline).not.toHaveBeenCalled();
      expect(network.reportApiOffline).not.toHaveBeenCalled();
    });
  });
});
