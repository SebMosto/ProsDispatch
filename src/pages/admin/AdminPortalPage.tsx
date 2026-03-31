import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';

type AdminMetrics = {
  active_contractors: number;
  total_jobs: number;
  total_invoices_paid: number;
};

export default function AdminPortalPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      if (profile?.role !== 'admin') {
        setError('Access denied: Admin privileges required');
        setLoading(false);
        return;
      }
      try {
        const { data, error: rpcError } = await supabase.rpc('get_admin_metrics');
        if (rpcError) {
          setError(rpcError.message || 'Failed to load metrics');
        } else {
          setMetrics(data as AdminMetrics);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || profile?.role !== 'admin') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow-sm border border-red-200">
          <h2 className="text-lg font-semibold">{t('admin.error', 'Access Denied')}</h2>
          <p>{error || 'You do not have permission to view this page.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('admin.title', 'Admin Portal')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-brutal border-2 border-black">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {t('admin.metrics.contractors', 'Active Contractors')}
          </h3>
          <p className="mt-2 text-4xl font-black text-gray-900">
            {metrics?.active_contractors || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-brutal border-2 border-black">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {t('admin.metrics.jobs', 'Total Jobs')}
          </h3>
          <p className="mt-2 text-4xl font-black text-gray-900">
            {metrics?.total_jobs || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-brutal border-2 border-black">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {t('admin.metrics.invoices', 'Paid Invoices')}
          </h3>
          <p className="mt-2 text-4xl font-black text-green-600">
            {metrics?.total_invoices_paid || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
