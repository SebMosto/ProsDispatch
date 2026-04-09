import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { useNavigate } from '../../lib/router';
import { supabase } from '../../lib/supabase';

interface AdminMetrics {
  activeUsers: number;
  totalJobs: number;
}

const AdminPortalPage = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }

    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_metrics');
        if (error) throw error;
        setMetrics(data as unknown as AdminMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [profile, navigate, t]);

  if (profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-slate-500">{t('common.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
        <p className="text-slate-600">Platform overview and metrics</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Active Users</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics?.activeUsers || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Total Jobs</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics?.totalJobs || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPortalPage;
