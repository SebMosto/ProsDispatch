import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface AdminMetrics {
  total_users: number;
  total_jobs: number;
  active_jobs: number;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (!profile || profile.role !== 'admin') {
          setError(t('admin.unauthorized'));
          setLoading(false);
          return;
        }

        const { data, error: rpcError } = await supabase.rpc('get_admin_metrics');

        if (rpcError) throw rpcError;

        if (data && data.length > 0) {
            setMetrics(data[0]);
        }
      } catch (err) {
        console.error('Admin metrics error:', err);
        setError(t('admin.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [profile, t]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="text-center font-medium">{error || t('admin.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('admin.title')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Users Card */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="p-6">
            <dt className="truncate text-sm font-medium text-slate-500">{t('admin.totalUsers')}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {metrics.total_users}
            </dd>
          </div>
        </div>

        {/* Total Jobs Card */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="p-6">
            <dt className="truncate text-sm font-medium text-slate-500">{t('admin.totalJobs')}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {metrics.total_jobs}
            </dd>
          </div>
        </div>

        {/* Active Jobs Card */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="p-6">
            <dt className="truncate text-sm font-medium text-slate-500">{t('admin.activeJobs')}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {metrics.active_jobs}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}
