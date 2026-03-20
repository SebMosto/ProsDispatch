import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { PageLoader } from '../../components/ui/PageLoader';
import { Navigate } from 'react-router-dom';

interface AdminMetrics {
  total_users: number;
  total_jobs: number;
  active_jobs: number;
}

const AdminPortalPage = () => {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (!profile || profile.role !== 'admin') {
          return;
        }

        const { data, error: rpcError } = await supabase.rpc('get_admin_metrics');

        if (rpcError) throw rpcError;
        if (data) setMetrics(data as unknown as AdminMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [profile]);

  if (profile === undefined) {
      return <PageLoader />;
  }

  if (profile !== null && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading || !metrics && !error) return <PageLoader />;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Admin Portal</h1>

      {error ? (
        <div className="rounded-md border-2 border-red-500 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : metrics ? (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-[10px] border-2 border-slate-900 bg-white p-6 shadow-[4px_4px_0_0_rgba(15,23,42,0.9)]">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Users</h3>
            <p className="mt-2 text-3xl font-black text-slate-900">{metrics.total_users}</p>
          </div>

          <div className="rounded-[10px] border-2 border-slate-900 bg-white p-6 shadow-[4px_4px_0_0_rgba(15,23,42,0.9)]">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Jobs</h3>
            <p className="mt-2 text-3xl font-black text-slate-900">{metrics.total_jobs}</p>
          </div>

          <div className="rounded-[10px] border-2 border-[#16A34A] bg-white p-6 shadow-[4px_4px_0_0_rgba(22,101,52,0.9)]">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Active Jobs</h3>
            <p className="mt-2 text-3xl font-black text-slate-900">{metrics.active_jobs}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default AdminPortalPage;
