import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClientDetail } from '../../hooks/useClientDetail';

const ClientEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, loading, error } = useClientDetail(id!);

  if (loading) {
    return <div className="p-4">{t('clients.loading')}</div>;
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <p className="text-red-700">{t('clients.error')}</p>
        <button onClick={() => navigate('/clients')} className="text-blue-600 underline">
          {t('clients.detail.backToClients')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{t('clients.detail.editClient')}</h1>
      {/* Basic stub for ClientEditPage */}
      <button onClick={() => navigate(`/clients/${id}`)} className="text-blue-600 underline">
        {t('clients.detail.backToClient')}
      </button>
    </div>
  );
};

export default ClientEditPage;
