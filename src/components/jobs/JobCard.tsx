import { useMemo } from 'react';
import { Link } from '../../lib/router';
import { useNetworkStatus } from '../../lib/network';
import type { JobRecord, JobWithDetails } from '../../repositories/jobRepository';
import SyncBadge, { type SyncBadgeState } from '../system/SyncBadge';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-800 border-slate-200',
  sent: 'bg-blue-50 text-blue-800 border-blue-200',
  approved: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  invoiced: 'bg-purple-50 text-purple-800 border-purple-200',
  paid: 'bg-green-50 text-green-800 border-green-200',
  archived: 'bg-gray-50 text-gray-800 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
  invoiced: 'Invoiced',
  paid: 'Paid',
  archived: 'Archived',
};

interface JobCardProps {
  job: JobRecord | JobWithDetails;
}

const JobCard = ({ job }: JobCardProps) => {
  const { isOnline } = useNetworkStatus();

  const statusClass = STATUS_STYLES[job.status] ?? STATUS_STYLES.draft;
  const statusLabel = STATUS_LABELS[job.status] ?? job.status;

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
          <p className="text-xs font-medium text-slate-500">Job #{job.id.slice(0, 8)}</p>
          <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-2">{job.description || 'No description provided'}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
          <SyncBadge state={syncState} />
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-slate-600">Client</dt>
          <dd className="font-medium text-slate-900">
            {'clients' in job && job.clients?.name ? job.clients.name : job.client_id}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-slate-600">Property</dt>
          <dd className="font-medium text-slate-900">
            {'properties' in job && job.properties
              ? `${job.properties.address_line1}, ${job.properties.city}`
              : job.property_id}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-slate-600">Service Date</dt>
          <dd className="font-medium text-slate-900">{job.service_date || 'Not scheduled'}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-slate-600">Last Updated</dt>
          <dd className="font-medium text-slate-900">{new Date(job.updated_at).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-500">Created {new Date(job.created_at).toLocaleString()}</div>
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          View Details
        </Link>
      </div>
    </article>
  );
};

export default JobCard;
