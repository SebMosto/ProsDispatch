import clsx from 'clsx';

export type SyncBadgeState =
  | 'ONLINE_SYNCED'
  | 'ONLINE_SYNCING'
  | 'OFFLINE_DRAFT'
  | 'ONLINE_DRAFT_PENDING'
  | 'ERROR_RETRYABLE';

const BADGE_COPY: Record<SyncBadgeState, { label: string; sublabel: string; tone: 'success' | 'warning' | 'muted' | 'danger' }> = {
  ONLINE_SYNCED: {
    label: '✅ Synced',
    sublabel: 'Synchronisé',
    tone: 'success',
  },
    ONLINE_SYNCING: {
      label: '⏳ Syncing…',
      sublabel: 'Synchronisation…',
      tone: 'muted',
    },
    OFFLINE_DRAFT: {
      label: '📱 Saved on device',
      sublabel: 'Enregistré sur l’appareil',
      tone: 'warning',
    },
    ONLINE_DRAFT_PENDING: {
      label: '📱 Ready to submit',
      sublabel: 'Brouillon à envoyer',
      tone: 'warning',
    },
    ERROR_RETRYABLE: {
      label: '⚠️ Needs attention',
    sublabel: 'Action requise',
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
  const copy = BADGE_COPY[state];
  const toneClass = toneStyles[copy.tone];

  return (
    <span
      className={clsx(
        'inline-flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1 rounded-md border px-2 py-1 text-xs font-medium',
        toneClass,
      )}
      aria-label={`${copy.label} / ${copy.sublabel}`}
    >
      <span>{copy.label}</span>
      <span className="text-[11px] sm:text-xs font-normal opacity-80">{copy.sublabel}</span>
    </span>
  );
};

export default SyncBadge;
