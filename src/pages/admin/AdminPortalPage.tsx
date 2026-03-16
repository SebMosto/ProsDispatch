import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Navigate } from '../../lib/router';
import { PageLoader } from '../../components/ui/PageLoader';

interface AdminMetrics {
  total_contractors: number;
  total_jobs: number;
  active_jobs: number;
}

const AdminPortalPage = () => {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('get_admin_metrics');
        if (rpcError) {
          throw rpcError;
        }
        setMetrics(data as unknown as AdminMetrics);
      } catch (err: unknown) {
        console.error('Failed to fetch admin metrics', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (profile?.role === 'admin') {
      fetchMetrics();
    }
  }, [profile]);

  if (authLoading) {
    return <PageLoader />;
  }

  // Redirect non-admins
  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">{t('admin.title')}</h1>
        <p className="text-sm text-slate-600">{t('admin.subtitle')}</p>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t('admin.error')}: {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center p-8">
          <span className="text-sm text-slate-600">{t('auth.shared.loading')}</span>
        </div>
      ) : metrics ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-slate-500">{t('admin.metrics.totalContractors')}</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.total_contractors}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-slate-500">{t('admin.metrics.totalJobs')}</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.total_jobs}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-slate-500">{t('admin.metrics.activeJobs')}</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.active_jobs}</p>
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default AdminPortalPage;
