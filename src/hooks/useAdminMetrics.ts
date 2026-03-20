import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdminMetrics {
  total_users: number;
  active_users: number;
  total_jobs: number;
  active_jobs: number;
  total_revenue_cents: number;
}

export function useAdminMetrics() {
  return useQuery<AdminMetrics, Error>({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_metrics');

      if (error) {
        throw new Error(error.message || 'Failed to fetch admin metrics');
      }

      if (!data || data.length === 0) {
        throw new Error('No admin metrics data returned');
      }

      return data[0];
    },
    retry: false,
  });
}
