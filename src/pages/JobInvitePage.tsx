import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobRepository, type PublicJobDetails } from '../repositories/jobRepository';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, XCircle, MapPin, Calendar, User, FileText } from 'lucide-react';

export const JobInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobData, setJobData] = useState<PublicJobDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'approved' | 'declined' | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token is missing');
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        const { data, error } = await jobRepository.getJobByToken(token);
        if (error) {
          setError(error.message);
        } else {
          setJobData(data);
        }
      } catch (err) {
        setError('Failed to load job details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [token]);

  const handleResponse = async (response: 'approve' | 'decline') => {
    if (!token) return;

    setActionLoading(true);
    try {
      const { data, error } = await jobRepository.respondToInvite(token, response);
      if (error) {
        alert(`Error: ${error.message}`);
      } else if (data?.success) {
        setActionSuccess(response === 'approve' ? 'approved' : 'declined');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <XCircle className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-800">{t('jobInvite.errorTitle', 'Error')}</h1>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    );
  }

  if (actionSuccess) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
        <h1 className="text-3xl font-bold text-gray-800">
          {actionSuccess === 'approved'
            ? t('jobInvite.approvedTitle', 'Job Approved!')
            : t('jobInvite.declinedTitle', 'Job Declined')}
        </h1>
        <p className="mt-2 max-w-md text-gray-600">
          {actionSuccess === 'approved'
            ? t('jobInvite.approvedMessage', 'Thank you for approving this job. The contractor has been notified.')
            : t('jobInvite.declinedMessage', 'You have declined this job. The contractor has been notified.')}
        </p>
      </div>
    );
  }

  if (!jobData) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold">{jobData.contractor.business_name}</h1>
          <p className="text-blue-100">{jobData.contractor.full_name}</p>
          <div className="mt-2 flex items-center text-sm text-blue-100">
            <span className="mr-2">📧</span> {jobData.contractor.email}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 border-b pb-4">
            <h2 className="mb-2 text-xl font-semibold text-gray-800">{jobData.job.title}</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>
                  {jobData.job.service_date
                    ? new Date(jobData.job.service_date).toLocaleDateString()
                    : t('job.noDate', 'Date to be determined')}
                </span>
              </div>
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{jobData.job.client_name}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  {jobData.job.property_address?.address_line1}, {jobData.job.property_address?.city}, {jobData.job.property_address?.province} {jobData.job.property_address?.postal_code}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-2 flex items-center font-medium text-gray-700">
              <FileText className="mr-2 h-4 w-4" />
              {t('job.description', 'Description')}
            </h3>
            <div className="rounded-lg bg-gray-50 p-4 text-gray-700">
              {jobData.job.description || t('job.noDescription', 'No description provided.')}
            </div>
          </div>

          {/* Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => handleResponse('decline')}
              disabled={actionLoading}
              className="rounded-lg border border-red-200 bg-white px-4 py-3 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {actionLoading ? t('common.processing', 'Processing...') : t('jobInvite.decline', 'Decline Job')}
            </button>
            <button
              onClick={() => handleResponse('approve')}
              disabled={actionLoading}
              className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? t('common.processing', 'Processing...') : t('jobInvite.approve', 'Approve Job')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
