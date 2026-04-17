import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface AdminMetrics {
  total_users: number;
  active_subscriptions: number;
  total_jobs: number;
  total_revenue_cents: number;
}

export default function AdminPortalPage() {
  const { profile, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    async function fetchMetrics() {
      try {
        const { data, error } = await supabase.rpc('get_admin_metrics');
        if (error) throw error;
        // The RPC returns a set of rows, but we only expect one row
        setMetrics(data?.[0] as unknown as AdminMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [profile, authLoading]);

  if (authLoading || loading) {
    return <div className="flex justify-center p-8 text-slate-600">{t('common.loading')}</div>;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Admin Portal</h1>
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700">
          <p>Error loading metrics: {error}</p>
        </div>
      )}
      {metrics && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Total Users</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.total_users}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Active Subscriptions</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.active_subscriptions}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Total Jobs</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.total_jobs}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Total Revenue</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              ${(metrics.total_revenue_cents / 100).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
