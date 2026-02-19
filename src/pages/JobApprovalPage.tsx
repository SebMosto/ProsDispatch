import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface JobData {
  id: string;
  title: string;
  description: string | null;
  service_date: string | null;
  status: string;
  client_name: string;
  property_address: string;
  contractor: {
    name: string;
    email?: string;
  };
}

export default function JobApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completedAction, setCompletedAction] = useState<'approve' | 'decline' | null>(null);

  useEffect(() => {
    async function fetchJob() {
      if (!token) return;
      try {
        const { data, error } = await supabase.functions.invoke('get-job-by-token', {
          body: { token },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setJob(data.data);
      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message || 'Failed to load job');
        } else {
            setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [token, t]);

  const handleAction = async (action: 'approve' | 'decline') => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('respond-to-job-invite', {
        body: { token, action },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCompletedAction(action);
      if (job) {
          setJob({ ...job, status: action === 'approve' ? 'approved' : 'draft' });
      }
    } catch (err: unknown) {
        if (err instanceof Error) {
            alert(err.message || 'Failed to process action');
        } else {
            alert('An unexpected error occurred');
        }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="text-xl text-gray-600">Loading...</div>
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="text-xl text-red-600 font-semibold">{error}</div>
          </div>
      );
  }

  if (!job) return null;

  if (completedAction || job.status === 'approved') {
     return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                 <h1 className={`text-2xl font-bold mb-4 ${
                     (completedAction === 'approve' || job.status === 'approved') ? 'text-green-600' : 'text-gray-600'
                 }`}>
                     {(completedAction === 'approve' || job.status === 'approved')
                        ? t('job.approval.approved_title', 'Job Approved')
                        : t('job.approval.declined_title', 'Job Declined')}
                 </h1>
                 <p className="text-gray-600">
                     {t('job.approval.thank_you', 'Thank you for your response. The contractor has been notified.')}
                 </p>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-blue-600 border-b border-gray-200 text-white">
            <h2 className="text-lg font-medium opacity-90">
                Job Request from {job.contractor.name}
            </h2>
        </div>
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                {job.description && (
                    <p className="text-gray-600 text-lg leading-relaxed">{job.description}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Service Date</span>
                    <span className="block text-xl font-medium text-gray-900">
                        {job.service_date ? new Date(job.service_date).toLocaleDateString() : 'To Be Determined'}
                    </span>
                </div>
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Property</span>
                    <span className="block text-xl font-medium text-gray-900">{job.property_address}</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                <button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 font-bold text-lg shadow-md disabled:opacity-50 transition-colors duration-200"
                >
                    {processing ? 'Processing...' : t('actions.approve', 'Approve Job')}
                </button>
                <button
                    onClick={() => handleAction('decline')}
                    disabled={processing}
                    className="flex-1 bg-white text-red-600 border-2 border-red-100 py-4 px-6 rounded-lg hover:bg-red-50 hover:border-red-200 font-bold text-lg shadow-sm disabled:opacity-50 transition-colors duration-200"
                >
                    {t('actions.decline', 'Decline')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
