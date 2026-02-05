import { useState } from 'react';
import { useJobByToken } from '../../hooks/useJobs';
import { useParams } from '../../lib/router';
import { supabase } from '../../lib/supabase';

const JobApprovalPage = () => {
  const { token } = useParams<{ token: string }>();

  const { job, loading, error } = useJobByToken(token);
  const [processing, setProcessing] = useState(false);
  const [responseStatus, setResponseStatus] = useState<string | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);

  const handleResponse = async (action: 'approve' | 'decline') => {
    setProcessing(true);
    setResponseError(null);
    try {
      const { data, error } = await supabase.functions.invoke('respond-to-invite', {
        body: { token, action }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResponseStatus(action === 'approve' ? 'approved' : 'declined');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to process request';
      setResponseError(message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-4 items-center justify-center p-4">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-2 items-center justify-center p-4">
        <h1 className="text-xl font-semibold text-slate-900">Job not available</h1>
        <p className="text-sm text-slate-600">The link may have expired or is invalid.</p>
      </main>
    );
  }

  if (responseStatus === 'approved') {
    return (
      <main className="flex min-h-[60vh] flex-col gap-2 items-center justify-center p-4">
        <div className="rounded-full bg-green-100 p-3">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Job Approved</h1>
        <p className="text-slate-600">Thank you for approving the job. The contractor has been notified.</p>
      </main>
    );
  }

  if (responseStatus === 'declined') {
    return (
      <main className="flex min-h-[60vh] flex-col gap-2 items-center justify-center p-4">
        <h1 className="text-2xl font-semibold text-slate-900">Job Declined</h1>
        <p className="text-slate-600">You have declined this job.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
        <p className="mt-2 text-slate-600">Please review the job details below.</p>
      </header>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
        <p className="text-slate-700 whitespace-pre-wrap">{job.description || 'No description provided.'}</p>

        {job.service_date && (
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">Service Date</p>
                <p className="font-medium text-slate-900">{new Date(job.service_date).toLocaleDateString()}</p>
            </div>
        )}
      </section>

      {responseError && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {responseError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => handleResponse('decline')}
          disabled={processing}
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Decline
        </button>
        <button
          onClick={() => handleResponse('approve')}
          disabled={processing}
          className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Approve Job'}
        </button>
      </div>
    </main>
  );
};

export default JobApprovalPage;
