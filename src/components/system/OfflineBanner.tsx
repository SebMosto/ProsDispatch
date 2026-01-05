import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../../lib/network';

const OfflineBanner = () => {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="w-full bg-amber-50 border border-amber-200 text-amber-900 p-3 sm:p-4 shadow-sm" role="status" aria-live="polite">
      <div className="flex flex-col gap-1">
        <div className="font-semibold">{t('offline.title', 'You’re offline')}</div>
        <div className="text-sm">{t('offline.body', 'Changes are saved on your device. You can submit when you’re back online.')}</div>
      </div>
    </div>
  );
};

export default OfflineBanner;
