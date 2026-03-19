import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { PageLoader } from '../components/ui/PageLoader';

type AdminMetrics = {
  total_users: number;
  total_jobs: number;
  active_jobs: number;
};

const AdminPortalPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if profile is loaded and is admin
    if (profile?.role === 'admin') {
      const fetchMetrics = async () => {
        try {
          const { data, error } = await supabase.rpc('get_admin_metrics');
          if (error) {
            console.error('Failed to fetch admin metrics', error);
            setError(t('admin.metrics.error'));
          } else if (data) {
            setMetrics(data as AdminMetrics);
          }
        } catch (err) {
            console.error(err);
            setError(t('admin.metrics.error'));
        } finally {
          setLoading(false);
        }
      };

      fetchMetrics();
    } else if (profile && profile.role !== 'admin') {
       // if profile loaded and not admin, finish loading quickly so Navigate happens
       setLoading(false);
    }
  }, [profile, t]);

  // If we don't have a profile yet (still loading auth), show loader
  if (!profile && user) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('admin.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.subtitle')}</p>
      </header>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
            <PageLoader />
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-slate-500">{t('admin.metrics.totalUsers')}</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.total_users}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-slate-500">{t('admin.metrics.totalJobs')}</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.total_jobs}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-slate-500">{t('admin.metrics.activeJobs')}</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.active_jobs}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPortalPage;
