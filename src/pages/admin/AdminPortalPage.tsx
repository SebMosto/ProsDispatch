import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default function AdminPortalPage() {

  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [metrics, setMetrics] = useState<{ total_users: number; total_jobs: number; total_invoices: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      if (profile?.role !== 'admin') {
        navigate('/dashboard', { replace: true });
        return;
      }

      fetchMetrics();
    }
  }, [user, profile, loading, navigate]);

  const fetchMetrics = async () => {
    try {
      setIsLoadingMetrics(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_admin_metrics');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setMetrics(data as { total_users: number; total_jobs: number; total_invoices: number });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin metrics');
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  if (loading || isLoadingMetrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-slate-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Error Loading Metrics</h2>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 rounded bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Portal</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Total Users</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{metrics?.total_users || 0}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Total Jobs</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{metrics?.total_jobs || 0}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Total Invoices</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{metrics?.total_invoices || 0}</p>
        </div>
      </div>
    </div>
  );
}
