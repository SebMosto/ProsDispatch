import { BaseRepository } from './base';
import type { RepositoryResult } from './base';

export interface AdminMetrics {
  total_users: number;
  active_jobs: number;
  total_revenue: number;
}

export class AdminRepository extends BaseRepository {
  async getMetrics(): Promise<RepositoryResult<AdminMetrics>> {
    const { data, error } = await this.client.rpc('get_admin_metrics');

    if (error) {
      return { data: null, error: this.toRepositoryError(error) ?? undefined };
    }

    // Explicitly cast to the expected type since the RPC returns JSON which might be typed as `Json`
    return { data: data as unknown as AdminMetrics, error: undefined };
  }
}

export const adminRepository = new AdminRepository();
