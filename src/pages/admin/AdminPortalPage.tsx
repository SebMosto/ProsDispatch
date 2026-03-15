import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { adminRepository, AdminMetrics } from '../../repositories/adminRepository';
import { PageLoader } from '../../components/ui/PageLoader';

export default function AdminPortalPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      if (profile?.role !== 'admin') return;

      setLoading(true);
      const { data, error } = await adminRepository.getMetrics();
      if (error) {
        setError(error.message);
      } else {
        setMetrics(data);
      }
      setLoading(false);
    }
    fetchMetrics();
  }, [profile?.role]);

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('admin.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t('admin.description')}
        </p>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dt className="truncate text-sm font-medium text-slate-500">
            {t('admin.activeUsers')}
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {metrics?.total_contractors ?? 0}
          </dd>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dt className="truncate text-sm font-medium text-slate-500">
            {t('admin.totalJobs')}
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {metrics?.total_jobs ?? 0}
          </dd>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dt className="truncate text-sm font-medium text-slate-500">
            {t('admin.totalInvoices')}
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {metrics?.total_invoices ?? 0}
          </dd>
        </div>
      </div>
    </div>
  );
}
