import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from '../../lib/router';
import { publicRepository, type JobPublicDetails } from '../../repositories/publicRepository';
import { formatDate } from '../../lib/date';

const JobInvitePage = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobPublicDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!token) {
        setError(t('public.invite.invalidToken'));
        setLoading(false);
        return;
      }

      const result = await publicRepository.getJobByToken(token);
      if (result.error) {
        setError(result.error.message || t('public.invite.errorLoading'));
      } else {
        setJob(result.data);
      }
      setLoading(false);
    };

    fetchJob();
  }, [token, t]);

  const handleResponse = async (response: 'approve' | 'decline') => {
    if (!token) return;
    setActionLoading(true);
    setError(null);

    const result = await publicRepository.respondToInvite(token, response);

    if (result.error) {
      setError(result.error.message || t('public.invite.errorAction'));
    } else {
      setActionSuccess(response === 'approve' ? t('public.invite.approved') : t('public.invite.declined'));
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-4 p-4">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded bg-slate-100" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-2 p-4">
        <h1 className="text-xl font-semibold text-red-700">{t('public.invite.errorTitle')}</h1>
        <p className="text-sm text-slate-600">{error}</p>
      </main>
    );
  }

  if (actionSuccess) {
    return (
      <main className="flex min-h-[60vh] flex-col gap-4 p-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <h1 className="text-xl font-semibold">{t('public.invite.thankYou')}</h1>
            <p className="mt-2">{actionSuccess}</p>
        </div>
      </main>
    );
  }

  if (!job) return null;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-6 p-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
        <p className="text-sm text-slate-600">
          {t('public.invite.from', { name: job.contractor_name })}
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {job.description && (
            <div className="col-span-1 sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">{t('jobs.form.description')}</dt>
              <dd className="mt-1 text-sm text-slate-900">{job.description}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-slate-500">{t('jobs.form.serviceDate')}</dt>
            <dd className="mt-1 text-sm text-slate-900">{job.service_date ? formatDate(job.service_date) : t('jobs.detail.notScheduled')}</dd>
          </div>
           <div>
            <dt className="text-sm font-medium text-slate-500">{t('clients.form.property')}</dt>
            <dd className="mt-1 text-sm text-slate-900">{job.property_address || '-'}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => handleResponse('approve')}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {actionLoading ? t('common.loading') : t('public.invite.approve')}
        </button>
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => handleResponse('decline')}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-white border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          {actionLoading ? t('common.loading') : t('public.invite.decline')}
        </button>
      </div>
    </main>
  );
};

export default JobInvitePage;
