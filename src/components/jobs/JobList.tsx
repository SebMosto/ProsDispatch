import JobCard from './JobCard';
import { useJobs } from '../../hooks/useJobs';
import { useTranslation } from 'react-i18next';

const JobList = () => {
  const { jobs, loading, error, refetch } = useJobs();
  const { t } = useTranslation();

  if (loading) {
    return (
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </section>
    );
  }

  if (error) {
    const errorText = error.reason === 'network' ? t('errors.timeout') : t('errors.unexpected');
    return (
      <section className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">{t('jobs.list.error')}</p>
        <p className="text-red-600">{errorText}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-[36px] items-center justify-center rounded-[7px] border-2 border-[#0F172A] bg-[#FF5C1B] px-[13px] text-xs font-bold text-[#1F1308] shadow-brutal transition hover:translate-x-[-1px] hover:translate-y-[-1px]"
        >
          {t('jobs.list.retry')}
        </button>
      </section>
    );
  }

  if (!jobs.length) {
    return (
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h3 className="text-base font-semibold text-slate-900">{t('jobs.list.title')}</h3>
        <p className="text-slate-600">{t('jobs.list.empty')}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{t('jobs.list.title')}</h3>
        <span className="text-xs text-slate-500">{t('jobs.list.total', { count: jobs.length })}</span>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
};

export default JobList;
