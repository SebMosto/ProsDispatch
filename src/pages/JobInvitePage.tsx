import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicRepository, type JobInviteData } from '../repositories/publicRepository';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const JobInvitePage = () => {
  const { token } = useParams(); // useParams returns string | undefined
  const { t } = useTranslation();
  const [data, setData] = useState<JobInviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    if (!token) {
      setError(t('invalidToken', 'Invalid Invite Token'));
      setLoading(false);
      return;
    }

    PublicRepository.getJobByToken(token)
      .then((result) => {
        setData(result);
        if (result.status === 'accepted' || result.status === 'declined') {
          setResponded(result.status);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(t('inviteLoadError', 'Failed to load invite. It may be expired.'));
      })
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleResponse = async (action: 'accepted' | 'declined') => {
    if (!token) return;
    setActionLoading(true);
    try {
      await PublicRepository.respondToInvite(token, action);
      setResponded(action);
    } catch (err) {
      console.error(err);
      alert(t('responseError', 'Failed to submit response. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">{t('error', 'Error')}</h1>
        <p className="mt-2 text-gray-500">{error || t('notFound', 'Job not found')}</p>
      </div>
    );
  }

  if (responded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        {responded === 'accepted' ? (
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        ) : (
          <XCircle className="h-16 w-16 text-red-500" />
        )}
        <h1 className="mt-4 text-2xl font-bold">
          {responded === 'accepted'
            ? t('inviteAccepted', 'Quote Accepted')
            : t('inviteDeclined', 'Quote Declined')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('thankYouResponse', 'Thank you for your response.')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{data.contractor.business_name}</h1>
        {data.contractor.full_name && (
          <p className="text-sm text-muted-foreground">{data.contractor.full_name}</p>
        )}
      </div>

      <div className="mb-6 rounded-lg border p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">{t('jobDetails', 'Job Details')}</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t('title', 'Title')}</label>
            <p className="text-lg">{data.job.title}</p>
          </div>

          {data.job.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t('description', 'Description')}</label>
              <p className="whitespace-pre-wrap">{data.job.description}</p>
            </div>
          )}

          {data.job.service_date && (
             <div>
              <label className="text-sm font-medium text-muted-foreground">{t('serviceDate', 'Service Date')}</label>
              <p>{new Date(data.job.service_date).toLocaleDateString()}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <label className="text-sm font-medium text-muted-foreground">{t('location', 'Location')}</label>
            <p>{data.property.address_line1}</p>
            <p>
              {data.property.city}, {data.property.province} {data.property.postal_code}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleResponse('declined')}
          disabled={actionLoading}
          className="flex-1 rounded-md border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {t('decline', 'Decline')}
        </button>
        <button
          onClick={() => handleResponse('accepted')}
          disabled={actionLoading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t('approve', 'Approve')}
        </button>
      </div>
    </div>
  );
};
