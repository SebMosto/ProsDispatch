import { useState, useEffect } from 'react';
import { useSearchParams } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import { PageLoader } from '../../components/ui/PageLoader';

type JobDetails = {
  id: string;
  title: string;
  description: string | null;
  service_date: string | null;
  status: string;
  created_at: string;
  client: {
    first_name: string;
    last_name: string;
  };
  property: {
    address: string;
    city: string;
    province: string;
    postal_code: string;
  };
  contractor: {
    business_name: string;
    email: string;
  };
};

export default function JobApprovalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link. Missing token.');
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-invite-details', {
          body: { token },
        });

        if (error) throw error;
        setJob(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load job details. The link may be expired or invalid.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [token]);

  const handleResponse = async (action: 'approve' | 'decline') => {
    if (!token) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('respond-to-invite', {
        body: { token, action },
      });

      if (error) throw error;

      if (action === 'approve') {
        setSuccessMessage('Job approved successfully! The contractor has been notified.');
      } else {
        setSuccessMessage('Job declined. The contractor has been notified.');
      }
      setJob(prev => prev ? { ...prev, status: action === 'approve' ? 'approved' : 'draft' } : null);
    } catch (err) {
      console.error(err);
      setError('Failed to submit response. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Success</h1>
          <p className="text-slate-600">{successMessage}</p>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Job Approval Request</h1>
          <p className="mt-2 text-lg text-slate-600">
            from {job.contractor.business_name}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-medium text-slate-900">{job.title}</h2>
            <p className="text-sm text-slate-500">Scheduled: {job.service_date || 'TBD'}</p>
          </div>
          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-slate-500">Description</dt>
                <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{job.description || 'No description provided.'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Location</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {job.property.address}<br />
                  {job.property.city}, {job.property.province} {job.property.postal_code}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Client</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {job.client.first_name} {job.client.last_name}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex justify-end gap-4 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => handleResponse('decline')}
                disabled={actionLoading || job.status !== 'sent'}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Decline'}
              </button>
              <button
                type="button"
                onClick={() => handleResponse('approve')}
                disabled={actionLoading || job.status !== 'sent'}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Approve Job'}
              </button>
            </div>
            {job.status !== 'sent' && !successMessage && (
               <p className="mt-4 text-center text-sm text-slate-500">
                 This job is currently <strong>{job.status.replace('_', ' ')}</strong>.
               </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
