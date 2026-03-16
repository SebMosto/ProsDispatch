import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminRepository, type AdminMetrics } from '../repositories/adminRepository';
import { useAuth } from '../lib/auth';
import { Navigate } from '../lib/router';
import { PageLoader } from '../components/ui/PageLoader';

const AdminPortalPage = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await adminRepository.getMetrics();
      if (error) {
        setError(error.message);
      } else if (data) {
        setMetrics(data);
      }
      setLoading(false);
    };

    if (profile?.role === 'admin') {
      fetchMetrics();
    }
  }, [profile?.role]);

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">{t('admin.title')}</h1>
        <p className="text-sm text-slate-600">{t('admin.subtitle')}</p>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      {metrics ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">{t('admin.metrics.totalUsers')}</h3>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metrics.total_users}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">{t('admin.metrics.activeJobs')}</h3>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metrics.active_jobs}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">{t('admin.metrics.totalRevenue')}</h3>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              ${Number(metrics.total_revenue).toFixed(2)}
            </p>
          </article>
        </section>
      ) : null}
    </main>
  );
};

export default AdminPortalPage;
