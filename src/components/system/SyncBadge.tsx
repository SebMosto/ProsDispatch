import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export type SyncBadgeState =
  | 'ONLINE_SYNCED'
  | 'ONLINE_SYNCING'
  | 'OFFLINE_DRAFT'
  | 'ONLINE_DRAFT_PENDING'
  | 'ERROR_RETRYABLE';

const BADGE_CONFIG: Record<SyncBadgeState, { translationKey: string; tone: 'success' | 'warning' | 'muted' | 'danger' }> = {
  ONLINE_SYNCED: {
    translationKey: 'sync.badge.onlineSynced',
    tone: 'success',
  },
  ONLINE_SYNCING: {
    translationKey: 'sync.badge.onlineSyncing',
    tone: 'muted',
  },
  OFFLINE_DRAFT: {
    translationKey: 'sync.badge.offlineDraft',
    tone: 'warning',
  },
  ONLINE_DRAFT_PENDING: {
    translationKey: 'sync.badge.onlineDraftPending',
    tone: 'warning',
  },
  ERROR_RETRYABLE: {
    translationKey: 'sync.badge.errorRetryable',
    tone: 'danger',
  },
};

const toneStyles: Record<'success' | 'warning' | 'muted' | 'danger', string> = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  muted: 'bg-slate-50 text-slate-700 border-slate-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
};

interface SyncBadgeProps {
  state: SyncBadgeState;
}

const SyncBadge = ({ state }: SyncBadgeProps) => {
  const { t } = useTranslation();
  const config = BADGE_CONFIG[state];
  const toneClass = toneStyles[config.tone];
  const label = t(config.translationKey);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium',
        toneClass,
      )}
      aria-label={label}
    >
      <span>{label}</span>
    </span>
  );
};

export default SyncBadge;
