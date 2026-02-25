import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { PageLoader } from '../../components/ui/PageLoader';

interface JobDetails {
  title: string;
  description: string;
  service_date: string | null;
  status: string;
  clients: { name: string };
  properties: {
    address_line1: string;
    city: string;
    province: string;
    postal_code: string;
  };
}

export default function JobInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      if (!token) {
        setError(t('errors.missingToken'));
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-job-by-token', {
          body: { token }
        });

        if (error) throw error;
        if (!data?.job) throw new Error(t('errors.jobNotFound'));

        setJob(data.job);
      } catch (err) {
        console.error('Error fetching job:', err);
        const message = err instanceof Error ? err.message : t('errors.generic');
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [token, t]);

  const handleResponse = async (action: 'approve' | 'decline') => {
    if (!token) return;
    setActionLoading(true);
    setError(null);
    try {
      const { error } = await supabase.functions.invoke('respond-to-job-invite', {
        body: { token, action }
      });

      if (error) throw error;

      if (action === 'approve') {
          setActionSuccess(t('jobInvite.approvedMessage'));
          setJob(prev => prev ? { ...prev, status: 'approved' } : null);
      } else {
          setActionSuccess(t('jobInvite.declinedMessage'));
          setJob(prev => prev ? { ...prev, status: 'draft' } : null);
      }

    } catch (err) {
      console.error('Error responding to invite:', err);
      const message = err instanceof Error ? err.message : t('errors.generic');
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-4 items-center justify-center p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md max-w-md text-center w-full shadow-sm border border-red-100">
          <h2 className="text-lg font-bold mb-2">{t('errors.errorOccurred')}</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!job) return null;

  if (actionSuccess) {
      return (
          <main className="flex min-h-[60vh] flex-col gap-4 items-center justify-center p-4">
              <div className="bg-green-50 text-green-800 p-8 rounded-md max-w-md text-center w-full shadow-sm border border-green-100">
                  <h2 className="text-2xl font-bold mb-4">{t('jobInvite.thankYou')}</h2>
                  <p className="text-lg">{actionSuccess}</p>
              </div>
          </main>
      );
  }

  return (
    <main className="max-w-2xl mx-auto bg-white shadow rounded-lg overflow-hidden my-8">
      <div className="px-6 py-8 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
        <p className="text-gray-500 mt-1">{t('jobInvite.subtitle', { client: job.clients.name })}</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('clients.properties.address')}</h3>
          <p className="mt-2 text-gray-900">
            {job.properties.address_line1}<br />
            {job.properties.city}, {job.properties.province} {job.properties.postal_code}
          </p>
        </div>

        {job.service_date && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('jobs.form.serviceDate')}</h3>
              <p className="mt-2 text-gray-900">{new Date(job.service_date).toLocaleDateString()}</p>
            </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('jobs.form.description')}</h3>
          <p className="mt-2 text-gray-900 whitespace-pre-wrap">{job.description || t('common.none')}</p>
        </div>

        {job.status === 'approved' && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-md border border-emerald-100">
                {t('jobInvite.alreadyApproved')}
            </div>
        )}
      </div>

      {job.status === 'sent' && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleResponse('decline')}
                disabled={actionLoading}
            >
                {t('common.decline')}
            </button>
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleResponse('approve')}
                disabled={actionLoading}
            >
                {actionLoading ? t('common.loading') : t('common.approve')}
            </button>
          </div>
      )}
    </main>
  );
}
