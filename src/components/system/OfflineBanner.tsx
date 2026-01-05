import { useNetworkStatus } from '../../lib/network';

const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="w-full bg-amber-50 border border-amber-200 text-amber-900 p-3 sm:p-4 shadow-sm" role="status" aria-live="polite">
      <div className="flex flex-col gap-1">
        <div className="font-semibold">You’re offline</div>
        <div className="text-sm">Changes are saved on your device. You can submit when you’re back online.</div>
        <div className="font-semibold">Vous êtes hors ligne</div>
        <div className="text-sm">Vos changements sont enregistrés sur votre appareil. Vous pourrez les envoyer quand vous serez de retour en ligne.</div>
      </div>
    </div>
  );
};

export default OfflineBanner;
