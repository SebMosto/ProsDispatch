import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { JobStatus } from '../../schemas/job';

const STATUS_STYLES: Record<JobStatus, string> = {
  draft: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-600',
  sent: 'bg-blue-50 dark:bg-slate-700 text-blue-800 dark:text-slate-100 border-blue-200 dark:border-slate-600',
  approved: 'bg-cyan-50 dark:bg-slate-700 text-cyan-800 dark:text-slate-100 border-cyan-200 dark:border-slate-600',
  in_progress: 'bg-amber-50 dark:bg-slate-700 text-amber-800 dark:text-slate-100 border-amber-200 dark:border-slate-600',
  completed: 'bg-emerald-50 dark:bg-slate-700 text-emerald-800 dark:text-slate-100 border-emerald-200 dark:border-slate-600',
  invoiced: 'bg-indigo-50 dark:bg-slate-700 text-indigo-800 dark:text-slate-100 border-indigo-200 dark:border-slate-600',
  paid: 'bg-green-50 dark:bg-slate-700 text-green-800 dark:text-slate-100 border-green-200 dark:border-slate-600',
  archived: 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-100 border-gray-200 dark:border-slate-600',
};

interface JobStatusBadgeProps {
  status: string; // Using string to be lenient with potential DB data, but ideally JobStatus
  className?: string;
}

const JobStatusBadge = ({ status, className }: JobStatusBadgeProps) => {
  const { t } = useTranslation();

  // Cast to JobStatus if valid, else default to draft style but keep original text if unknown
  const safeStatus = (Object.keys(STATUS_STYLES).includes(status) ? status : 'draft') as JobStatus;
  const statusClass = STATUS_STYLES[safeStatus];

  // Try to translate. If status is "draft", t('jobs.status.draft') -> "Draft" or "Brouillon"
  // Use safeStatus to ensure we don't try to translate garbage keys like "draft / brouillon"
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
