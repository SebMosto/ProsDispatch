import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../lib/router';
import { useJobByToken } from '../../hooks/usePublicJob';
import { publicRepository } from '../../repositories/publicRepository';
import { formatDate } from '../../lib/date';
import { PageLoader } from '../../components/ui/PageLoader';

const JobInvitePage = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const token = segments[1]; // /job-invite/:token

  const { job: jobDetails, loading, error } = useJobByToken(token);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (loading) {
    return <PageLoader />;
  }

  if (error || !jobDetails) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-4 p-4 items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">{t('public.invite.errorTitle')}</h1>
        <p className="text-sm text-slate-600">{error?.message || t('public.invite.notFound')}</p>
      </main>
    );
  }

  const { job, contractor, property } = jobDetails;

  const handleAction = async (action: 'approve' | 'decline') => {
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await publicRepository.respondToInvite(token, action);
      if (result.error) {
        throw new Error(result.error.message);
      }
      setSuccessMessage(t(`public.invite.success.${action}`));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  if (successMessage) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-4 p-4 items-center justify-center text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 p-4 text-emerald-600">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">{successMessage}</h1>
        <p className="text-sm text-slate-600">{t('public.invite.thankYou')}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-6">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{t('public.invite.estimateFrom')}</p>
        <h1 className="text-3xl font-bold text-slate-900">{contractor.business_name}</h1>
      </header>

      <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{formatDate(job.created_at)}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700`}>
                {t(`jobs.status.${job.status}`, { defaultValue: job.status })}
            </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-900 mb-2">{t('public.invite.description')}</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{job.description || t('public.invite.noDescription')}</p>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">{t('public.invite.serviceDate')}</h3>
                <p className="text-slate-600">{job.service_date || t('public.invite.tbd')}</p>
            </div>
            <div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">{t('public.invite.location')}</h3>
                <p className="text-slate-600">{property.address_line1}</p>
                <p className="text-slate-600">{property.city}, {property.province} {property.postal_code}</p>
            </div>
        </div>
      </section>

      {jobDetails.tokenStatus === 'pending' ? (
      <div className="flex gap-4 pt-4">
        <button
          onClick={() => handleAction('approve')}
          disabled={actionLoading}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {actionLoading ? t('common.processing') : t('public.invite.approve')}
        </button>
        <button
          onClick={() => handleAction('decline')}
          disabled={actionLoading}
          className="flex-1 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-red-600 border border-red-200 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
        >
          {actionLoading ? t('common.processing') : t('public.invite.decline')}
        </button>
      </div>
      ) : (
          <div className="rounded-lg bg-slate-100 p-4 text-center text-slate-600">
              {t('public.invite.alreadyResponded')}
          </div>
      )}

      {actionError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}
    </main>
  );
};

export default JobInvitePage;
