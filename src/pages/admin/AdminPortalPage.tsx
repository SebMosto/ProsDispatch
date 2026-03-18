import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageLoader } from '../../components/ui/PageLoader';

interface AdminMetrics {
  total_contractors: number;
  total_jobs: number;
  active_jobs: number;
}

const AdminPortalPage = () => {
  const { profile, loading } = useAuth();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_metrics');
        if (error) {
          throw error;
        }
        setMetrics(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setFetching(false);
      }
    };

    if (profile?.role === 'admin') {
      fetchMetrics();
    }
  }, [profile]);

  if (loading || (profile?.role === 'admin' && fetching)) {
    return <PageLoader />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('admin.title', 'Admin Portal')}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {t('admin.subtitle', 'Internal platform metrics (Read-Only)')}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      ) : metrics ? (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-sm font-medium text-slate-500">
              {t('admin.metrics.totalContractors', 'Total Contractors')}
            </div>
            <div className="text-3xl font-bold text-slate-900">{metrics.total_contractors}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-sm font-medium text-slate-500">
              {t('admin.metrics.totalJobs', 'Total Jobs')}
            </div>
            <div className="text-3xl font-bold text-slate-900">{metrics.total_jobs}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-sm font-medium text-slate-500">
              {t('admin.metrics.activeJobs', 'Active Jobs')}
            </div>
            <div className="text-3xl font-bold text-slate-900">{metrics.active_jobs}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPortalPage;
