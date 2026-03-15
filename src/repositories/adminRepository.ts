import { BaseRepository } from './base';
import type { RepositoryResult } from './base';
import { supabase } from '../lib/supabase';

export interface AdminMetrics {
  total_contractors: number;
  total_jobs: number;
  total_invoices: number;
}

export class AdminRepository extends BaseRepository {
  async getMetrics(): Promise<RepositoryResult<AdminMetrics>> {
    try {
      const { data, error } = await this.client.rpc('get_admin_metrics');

      if (error) throw error;

      // The RPC returns json type which comes through as unknown in typed contexts,
      // so we type-assert it to our expected shape.
      return { data: data as unknown as AdminMetrics, error: undefined };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          reason: 'unknown'
        }
      };
    }
  }
}

export const adminRepository = new AdminRepository(supabase);
