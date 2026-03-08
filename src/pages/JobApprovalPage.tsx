import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { PageLoader } from '../components/ui/PageLoader';
import { JobDetailsSchema, type JobDetails } from '../schemas/job';

export default function JobApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!token) {
        setError(t('jobApproval.invalidToken'));
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-job-by-token', {
          body: { token },
        });

        if (error) {
          console.error('Error fetching job:', error);
          setError(t('jobApproval.fetchError'));
        } else if (data.error) {
           setError(data.error);
        } else {
          const parseResult = JobDetailsSchema.safeParse(data);
          if (parseResult.success) {
            setJob(parseResult.data);
            if (parseResult.data.status === 'approved') {
              setApproved(true);
            }
          } else {
            console.error('Failed to validate job details:', parseResult.error);
            setError(t('jobApproval.fetchError'));
          }
        }
      } catch (err) {
        console.error('Exception fetching job:', err);
        setError(t('jobApproval.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [token, t]);

  const handleApprove = async () => {
    setProcessing(true);
    setActionError(null);
    try {
      const { data, error } = await supabase.functions.invoke('respond-to-job-invite', {
        body: { token, action: 'approve' },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setApproved(true);
    } catch (err) {
      console.error('Error approving job:', err);
      setActionError(t('jobApproval.actionError'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('jobApproval.errorTitle')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {job.contractor.business_name || job.contractor.name}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('jobApproval.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {approved ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{t('jobApproval.approvedTitle')}</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{t('jobApproval.approvedMessage')}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">{job.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{job.description}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">{t('jobApproval.serviceDate')}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{job.service_date || t('common.notScheduled')}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">{t('jobApproval.property')}</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {job.property_address ? (
                        <>
                          {job.property_address.address_line1}<br />
                          {job.property_address.city}, {job.property_address.province} {job.property_address.postal_code}
                        </>
                      ) : t('common.notAvailable')}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="pt-4">
                {actionError && (
                  <div className="mb-4 rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-700">{actionError}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {processing ? t('common.processing') : t('jobApproval.approveButton')}
                </button>
                <p className="mt-4 text-center text-sm text-gray-500">
                  {t('jobApproval.declineInstructions')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
