import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { publicRepository } from '../repositories/publicRepository';
import { formatDate } from '../lib/date';
import { PageLoader } from '../components/ui/PageLoader';

const JobInvitePage = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!token) throw new Error("No token provided");
    const result = await publicRepository.getJobByToken(token);
    if (result.error || !result.data) {
        throw new Error(result.error?.message || t('invite.page.error'));
    }
    return result.data;
  }, [token, t]);

  const { data: job, isLoading, error, refetch } = useQuery({
    queryKey: ['public-job', token],
    queryFn: fetchJob,
    enabled: !!token,
    retry: false
  });

  const respondMutation = useMutation({
    mutationFn: async (action: 'approve' | 'decline') => {
        if (!token) return;
        const result = await publicRepository.respondToInvite(token, action);
        if (result.error) {
            throw new Error(result.error.message);
        }
        return result.data;
    },
    onSuccess: (data, variables) => {
        if (variables === 'approve') {
            setSuccessMessage(t('invite.page.approved'));
        } else {
            setSuccessMessage(t('invite.page.declined'));
        }
        refetch(); // Refresh job state
    }
  });

  if (isLoading) return <PageLoader />;

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('invite.page.error')}</h1>
        <p className="text-slate-600">{error instanceof Error ? error.message : t('public.invoice.expired')}</p>
      </div>
    );
  }

  const isActionable = job.token_status === 'active' && !successMessage && job.status !== 'approved';

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('invite.page.title')}</h1>
        <p className="text-slate-600">{job.title}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('invite.jobDetails.title')}</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">{t('invite.jobDetails.client')}</dt>
            <dd className="mt-1 text-base text-slate-900">{job.client.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">{t('invite.jobDetails.property')}</dt>
            <dd className="mt-1 text-base text-slate-900">{job.property.address}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">{t('invite.jobDetails.serviceDate')}</dt>
            <dd className="mt-1 text-base text-slate-900">{job.service_date ? formatDate(job.service_date) : '-'}</dd>
          </div>
          <div className="sm:col-span-2">
             <dt className="text-sm font-medium text-slate-500">{t('invite.jobDetails.description')}</dt>
             <dd className="mt-1 text-base text-slate-900 whitespace-pre-wrap">{job.description || '-'}</dd>
          </div>
        </dl>
      </div>

      {successMessage ? (
         <div className="rounded-xl bg-green-50 p-6 text-center border border-green-200">
             <h3 className="text-lg font-semibold text-green-800 mb-2">{successMessage}</h3>
             <p className="text-green-700">{t('invite.page.successMessage')}</p>
         </div>
      ) : isActionable ? (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => respondMutation.mutate('decline')}
            disabled={respondMutation.isPending}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50"
          >
             {respondMutation.isPending ? t('auth.shared.loading') : t('invite.page.decline')}
          </button>
          <button
            onClick={() => respondMutation.mutate('approve')}
            disabled={respondMutation.isPending}
            className="rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
          >
             {respondMutation.isPending ? t('auth.shared.loading') : t('invite.page.approve')}
          </button>
        </div>
      ) : (
          <div className="rounded-xl bg-slate-50 p-6 text-center border border-slate-200">
             <p className="text-slate-600">
                {job.status === 'approved' ? t('invite.page.approved') :
                 job.token_status === 'used' ? t('invite.page.declined') :
                 t('public.invoice.notAvailable')}
             </p>
          </div>
      )}

      {respondMutation.error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{respondMutation.error.message}</p>
          </div>
      )}
    </main>
  );
};

export default JobInvitePage;
