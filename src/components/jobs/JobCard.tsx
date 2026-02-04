import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '../../lib/router';
import { useNetworkStatus } from '../../lib/network';
import { formatDate } from '../../lib/date';
import type { JobRecord } from '../../repositories/jobRepository';
import SyncBadge, { type SyncBadgeState } from '../system/SyncBadge';
import JobStatusBadge from './JobStatusBadge';

interface JobCardProps {
  job: JobRecord;
}

const JobCard = memo(({ job }: JobCardProps) => {
  const { isOnline } = useNetworkStatus();
  const { t } = useTranslation();

  const syncState: SyncBadgeState = useMemo(() => {
    if (job.id.startsWith('temp-')) {
      return isOnline ? 'ONLINE_SYNCING' : 'OFFLINE_DRAFT';
    }
    return isOnline ? 'ONLINE_SYNCED' : 'OFFLINE_DRAFT';
  }, [isOnline, job.id]);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">{t('jobs.card.jobNum', { id: job.id.slice(0, 8) })}</p>
          <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-2">{job.description || t('jobs.card.noDescription')}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <JobStatusBadge status={job.status} />
          <SyncBadge state={syncState} />
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-slate-600">{t('jobs.card.clientId')}</dt>
          <dd className="font-medium text-slate-900">{job.client_id}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-slate-600">{t('jobs.card.propertyId')}</dt>
          <dd className="font-medium text-slate-900">{job.property_id}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-slate-600">{t('jobs.card.serviceDate')}</dt>
          <dd className="font-medium text-slate-900">{job.service_date || t('jobs.card.notScheduled')}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-slate-600">{t('jobs.card.lastUpdated')}</dt>
          <dd className="font-medium text-slate-900">{formatDate(job.updated_at)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-500">{t('jobs.card.created', { date: formatDate(job.created_at) })}</div>
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {t('jobs.card.viewDetails')}
        </Link>
      </div>
    </article>
  );
});

// Optimization: Memoize JobCard to prevent unnecessary re-renders when parent list updates
// but job data remains unchanged.
JobCard.displayName = 'JobCard';

export default JobCard;
