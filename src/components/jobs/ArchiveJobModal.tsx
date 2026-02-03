import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type ArchiveJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  jobTitle: string;
};

const ArchiveJobModal = ({ isOpen, onClose, onConfirm, jobTitle }: ArchiveJobModalProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setErrorMessage(null);
    onClose();
  };

  const handleConfirm = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('jobs.archiveModal.error');
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">{t('jobs.archiveModal.title')}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {t('jobs.archiveModal.message', { title: jobTitle })}
        </p>
        <p className="mt-2 text-sm font-medium text-amber-700">
          {t('jobs.archiveModal.warning')}
        </p>
        {errorMessage ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-sm font-semibold text-slate-600 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('jobs.archiveModal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t('jobs.archiveModal.archiving') : t('jobs.archiveModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveJobModal;
