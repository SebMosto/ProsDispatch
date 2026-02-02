import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { type JobStatus, JOB_STATUSES } from '../../schemas/job';

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
  status: string; // Accepts string to handle potential database data issues safely
  className?: string;
}

const JobStatusBadge = ({ status, className }: JobStatusBadgeProps) => {
  const { t } = useTranslation();

  // STRICT VALIDATION: Ensure we never try to translate mixed/concatenated strings (e.g. "draft / brouillon")
  // If the status is not in our allowed list, we fall back to 'draft' to prevent UI glitches.
  const normalizedStatus = (JOB_STATUSES.includes(status as JobStatus) ? status : 'draft') as JobStatus;

  const statusClass = STATUS_STYLES[normalizedStatus];
  const label = t(`jobs.status.${normalizedStatus}`);

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
