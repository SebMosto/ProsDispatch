import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { Navigate } from '../lib/router';
import { useAdminMetrics } from '../hooks/useAdminMetrics';
import { formatCurrency } from '../lib/currency';

const AdminPortalPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('fr') ? 'fr-CA' : 'en-CA';
  const { profile, loading: authLoading } = useAuth();
  const { data: metrics, isLoading: metricsLoading, error } = useAdminMetrics();

  if (authLoading || metricsLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center p-4">
        <p className="text-slate-500">{t('common.processing')}</p>
      </main>
    );
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('admin.title')}</h1>
          <p className="text-sm text-slate-500">{t('admin.description')}</p>
        </div>
      </header>

      {error ? (
        <section className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-bold">{t('admin.error')}</p>
          <p>{error.message}</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[10px] border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_0_rgba(15,23,42,0.9)]">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('admin.metrics.users')}
            </h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{metrics?.total_users ?? 0}</span>
              <span className="text-sm font-medium text-emerald-600">
                {t('admin.metrics.activeUsers', { count: metrics?.active_users ?? 0 })}
              </span>
            </div>
          </div>

          <div className="rounded-[10px] border-2 border-[#FF5C1B] bg-white p-5 shadow-[4px_4px_0_0_rgba(255,92,27,0.35)]">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#FF5C1B]">
              {t('admin.metrics.jobs')}
            </h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{metrics?.total_jobs ?? 0}</span>
              <span className="text-sm font-medium text-slate-500">
                {t('admin.metrics.activeJobs', { count: metrics?.active_jobs ?? 0 })}
              </span>
            </div>
          </div>

          <div className="rounded-[10px] border-2 border-emerald-600 bg-emerald-50 p-5 shadow-[4px_4px_0_0_rgba(5,150,105,0.9)] sm:col-span-2 lg:col-span-1">
            <h2 className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              {t('admin.metrics.revenue')}
            </h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {formatCurrency((metrics?.total_revenue_cents ?? 0) / 100, 'CAD', locale)}
              </span>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default AdminPortalPage;
