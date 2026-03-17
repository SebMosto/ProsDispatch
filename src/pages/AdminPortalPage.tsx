import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { PageLoader } from '../components/ui/PageLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface AdminMetrics {
  total_users: number;
  total_jobs: number;
  total_revenue: number;
  active_subscriptions: number;
}

export default function AdminPortalPage() {
  const { profile, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      if (profile?.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_admin_metrics');

        if (rpcError) {
          throw rpcError;
        }

        setMetrics(data as unknown as AdminMetrics);
      } catch (err) {
        console.error('Failed to fetch admin metrics:', err);
        setError('Failed to load metrics.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchMetrics();
    }
  }, [profile, authLoading]);

  if (authLoading || loading) {
    return <PageLoader />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin Portal
        </h1>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : metrics ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_users}</div>
              <p className="text-xs text-muted-foreground">Contractors registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_jobs}</div>
              <p className="text-xs text-muted-foreground">Across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_subscriptions}</div>
              <p className="text-xs text-muted-foreground">Paying contractors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Number(metrics.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Total invoiced (paid)</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
