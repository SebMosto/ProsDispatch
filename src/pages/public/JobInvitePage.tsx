import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '../../lib/router';
import { publicRepository, type JobInviteDetails } from '../../repositories/publicRepository';
import { PageLoader } from '../../components/ui/PageLoader';
import { CheckCircle, XCircle } from 'lucide-react';

export default function JobInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [job, setJob] = useState<JobInviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState<'approved' | 'declined' | null>(null);

  useEffect(() => {
    async function loadJob() {
      if (!token) {
        setError(t('public.invoice.expired'));
        setLoading(false);
        return;
      }

      const { data, error } = await publicRepository.getJobByToken(token);

      if (error || !data) {
        setError(t('public.invoice.expired'));
      } else {
        setJob(data);
        if (data.status === 'approved') {
          setResponse('approved');
        }
      }
      setLoading(false);
    }

    loadJob();
  }, [token, t]);

  const handleResponse = async (action: 'approve' | 'decline') => {
    if (!token) return;
    setProcessing(true);
    const { error } = await publicRepository.respondToInvite(token, action);

    if (error) {
        console.error(error);
        alert(t('errors.unexpected'));
    } else {
        setResponse(action === 'approve' ? 'approved' : 'declined');
    }
    setProcessing(false);
  };

  if (loading) return <PageLoader />;

  if (error || !job) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-4">
        <h1 className="text-xl font-semibold text-slate-900">{t('public.invoice.notAvailable')}</h1>
        <p className="mt-2 text-slate-600">{error}</p>
      </div>
    );
  }

  if (response) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-4">
        {response === 'approved' ? (
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        ) : (
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
        )}
        <h1 className="text-2xl font-bold text-slate-900">
            {response === 'approved' ? t('public.invite.approved') : t('public.invite.declined')}
        </h1>
        <p className="mt-2 text-lg text-slate-600">{t('public.invite.thankYou')}</p>
      </div>
    );
  }

  const contractorName = job.contractor_business_name || job.contractor_name || "Contractor";

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
        <h3 className="text-lg font-medium leading-6 text-slate-900">
          {t('public.invite.title')}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          {t('public.invite.subtitle', { contractor: contractorName })}
        </p>
      </div>
      <div className="px-4 py-5 sm:p-6 space-y-6">
        <div>
           <h4 className="text-sm font-medium text-slate-500 mb-4">{t('public.invite.details')}</h4>
           <div className="border-t border-slate-200 pt-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                 <div>
                    <dt className="text-sm font-medium text-slate-500">{t('public.invite.client')}</dt>
                    <dd className="mt-1 text-sm text-slate-900">{job.client_name}</dd>
                 </div>
                 <div>
                    <dt className="text-sm font-medium text-slate-500">{t('public.invite.property')}</dt>
                    <dd className="mt-1 text-sm text-slate-900">{job.property_address}</dd>
                 </div>
                 <div>
                    <dt className="text-sm font-medium text-slate-500">{t('public.invite.serviceDate')}</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                        {job.service_date ? new Date(job.service_date).toLocaleDateString() : t('jobs.detail.notScheduled')}
                    </dd>
                 </div>
                 <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-slate-500">{t('public.invite.description')}</dt>
                    <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{job.description || t('jobs.detail.noDescription')}</dd>
                 </div>
              </dl>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
            <button
                onClick={() => handleResponse('approve')}
                disabled={processing}
                className="flex-1 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {processing ? t('auth.shared.loading') : t('public.invite.approve')}
            </button>
            <button
                onClick={() => handleResponse('decline')}
                disabled={processing}
                className="flex-1 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {processing ? t('auth.shared.loading') : t('public.invite.decline')}
            </button>
        </div>
      </div>
    </div>
  );
}
