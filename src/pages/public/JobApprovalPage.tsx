import { useEffect, useState } from 'react';
import { useParams } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface JobData {
  id: string;
  title: string;
  description: string;
  service_date: string;
  status: string;
  contractor: {
    name: string;
    email?: string;
  };
  client: {
    name: string;
  };
  property: {
    address: string;
  };
}

const JobApprovalPage = () => {
  const { token } = useParams<{ token: string }>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [tokenStatus, setTokenStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-job-by-token', {
          body: { token },
        });

        if (error) throw error;
        setJobData(data.job);
        setTokenStatus(data.token_status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchJob();
    } else {
      setError('No token provided');
      setLoading(false);
    }
  }, [token]);

  const handleAction = async (action: 'approve' | 'decline') => {
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('respond-to-job-invite', {
        body: { token, action },
      });

      if (error) throw error;

      setActionSuccess(action);
      setTokenStatus('used');
      if (jobData) {
        setJobData({ ...jobData, status: action === 'approve' ? 'approved' : 'draft' });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mb-4 text-red-600">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Error Loading Job</h1>
        <p className="mt-2 text-slate-600">{error}</p>
      </div>
    );
  }

  if (actionSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mb-4 text-green-600">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          {actionSuccess === 'approve' ? 'Job Approved!' : 'Job Declined'}
        </h1>
        <p className="mt-2 text-slate-600">
          {actionSuccess === 'approve'
            ? 'Thank you for approving the job. The contractor has been notified.'
            : 'You have declined this job. The contractor has been notified.'}
        </p>
      </div>
    );
  }

  if (tokenStatus !== 'active' && !actionSuccess) {
       return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Link Expired or Used</h1>
        <p className="mt-2 text-slate-600">This link has already been used or has expired.</p>
        {jobData && (
             <p className="mt-4 font-medium">Current Status: {jobData.status}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Job Approval Request</h1>
        <p className="text-slate-600">from {jobData?.contractor.name}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="font-semibold text-slate-900">{jobData?.title}</h2>
        </div>

        <div className="px-6 py-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Service Date</dt>
              <dd className="mt-1 text-slate-900">{jobData?.service_date || 'Not scheduled'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Location</dt>
              <dd className="mt-1 text-slate-900">{jobData?.property.address}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-slate-500">Description</dt>
              <dd className="mt-1 text-slate-900 whitespace-pre-wrap">{jobData?.description || 'No description provided.'}</dd>
            </div>
          </dl>
        </div>

        <div className="flex gap-4 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            onClick={() => handleAction('decline')}
            disabled={actionLoading}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Decline'}
          </button>
          <button
            onClick={() => handleAction('approve')}
            disabled={actionLoading}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Approve Job'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobApprovalPage;
