import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { JOB_STATUSES, type JobStatus } from '../../schemas/job';

const STATUS_STYLES: Record<JobStatus, string> = {
  draft: 'bg-slate-100 text-slate-800 border-slate-200',
  sent: 'bg-blue-50 text-blue-800 border-blue-200',
  approved: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  invoiced: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  paid: 'bg-green-50 text-green-800 border-green-200',
  archived: 'bg-gray-50 text-gray-700 border-gray-200',
};

interface JobStatusBadgeProps {
  status: string; // Accepts string to handle potential raw DB values, but normalizes to JobStatus
  className?: string;
}

const JobStatusBadge = ({ status, className }: JobStatusBadgeProps) => {
  const { t } = useTranslation();

  // Validate status against the schema source of truth
  const safeStatus = JOB_STATUSES.find((s) => s === status) ?? 'draft';

  const statusClass = STATUS_STYLES[safeStatus];

  // Strict translation: rely on i18next to return the localized string.
  // We provide the key and a fallback value that matches the key's last segment (the status itself),
  // but strictly speaking, we expect the translation file to be complete.
  const label = t(`jobs.status.${safeStatus}`, safeStatus);

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
        statusClass,
        className
      )}
    >
      {label}
    </span>
  );
};

export default JobStatusBadge;
