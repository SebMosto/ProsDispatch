import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { jobRepository, type JobWithInviteDetails } from '../../repositories/jobRepository';
import JobStatusBadge from '../../components/jobs/JobStatusBadge';
import { PageLoader } from '../../components/ui/PageLoader';

const PublicJobPage = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [job, setJob] = useState<JobWithInviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completedAction, setCompletedAction] = useState<'approve' | 'decline' | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchJob = async () => {
      setLoading(true);
      const result = await jobRepository.getJobByToken(token);
      if (result.error) {
        setError(result.error.message);
      } else {
        setJob(result.data);
      }
      setLoading(false);
    };
    fetchJob();
  }, [token]);

  const handleResponse = async (action: 'approve' | 'decline') => {
    if (!token) return;
    setProcessing(true);
    setError(null);
    const result = await jobRepository.respondToInvite(token, action);
    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else {
      setCompletedAction(action);
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 py-8 text-center sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-slate-900">{t('errors.unexpected')}</h1>
        <p className="text-slate-600">{error}</p>
      </main>
    );
  }

  if (completedAction) {
    return (
       <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 py-8 text-center sm:px-6 lg:px-8">
        <div className="rounded-full bg-green-100 p-3">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
            {completedAction === 'approve' ? 'Thank you for your approval!' : 'You have declined this job.'}
        </h1>
        <p className="text-slate-600">The contractor has been notified.</p>
      </main>
    );
  }

  if (!job) return null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
       <div className="mb-8 text-center">
        {job.contractor.business_name && (
             <h2 className="text-lg font-medium text-slate-500">{job.contractor.business_name}</h2>
        )}
        <h1 className="text-3xl font-bold text-slate-900 mt-2">{job.title}</h1>
        <div className="mt-4 flex justify-center">
            <JobStatusBadge status={job.status} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-slate-200">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Service Date</dt>
              <dd className="mt-1 text-sm text-slate-900">{job.service_date || 'Not scheduled'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Property</dt>
              <dd className="mt-1 text-sm text-slate-900">{job.property_address}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{job.description || 'No description provided.'}</dd>
            </div>
          </dl>
        </div>

        {job.status === 'sent' && (
             <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
            <button
                type="button"
                onClick={() => handleResponse('decline')}
                disabled={processing}
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
                Decline
            </button>
            <button
                type="button"
                onClick={() => handleResponse('approve')}
                 disabled={processing}
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
                {processing ? t('auth.shared.loading') : 'Approve Job'}
            </button>
            </div>
        )}
      </div>
    </main>
  );
};

export default PublicJobPage;
