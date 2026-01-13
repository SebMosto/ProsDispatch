import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from '../../lib/router';
import { clientRepository } from '../../repositories/clientRepository';
import { useProperties } from '../../hooks/useProperties';

const ClientDetailPage = () => {
  const { t } = useTranslation();
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const clientIdFromState = (state as { clientId?: string } | null)?.clientId;
  const clientIdFromPath = pathname.split('/').filter(Boolean)[1];
  const clientId = clientIdFromState || clientIdFromPath;

  const queryKey = useMemo(() => ['client', clientId], [clientId]);

  const queryFn = useCallback(async () => {
    const result = await clientRepository.get(clientId ?? '');
    if (result.error || !result.data) {
      throw result.error ?? new Error('Unable to load client');
    }
    return result.data;
  }, [clientId]);

  const clientQuery = useQuery({
    queryKey,
    enabled: Boolean(clientId),
    queryFn,
  });

  const { properties, loading: loadingProperties } = useProperties(clientId);

  const handleDelete = async () => {
    if (!clientId) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const result = await clientRepository.softDelete(clientId);
      if (result.error) {
        throw result.error;
      }
      setActionSuccess(t('clients.detail.deleted'));
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('clients.detail.error');
      setActionError(message);
    }
  };

  if (!clientId) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('clients.detail.noSelection')}</p>
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {t('clients.detail.backToClients')}
        </button>
      </main>
    );
  }

  if (clientQuery.isLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-24 animate-pulse rounded bg-slate-100" />
          <div className="h-24 animate-pulse rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (clientQuery.error || !clientQuery.data) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('clients.detail.error')}</p>
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {t('clients.detail.backToClients')}
        </button>
      </main>
    );
  }

  const client = clientQuery.data;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">{t('clients.detail.idLabel', { id: client.id })}</p>
            <h1 className="text-2xl font-semibold text-slate-900">{client.name}</h1>
            <p className="text-sm text-slate-700">{client.email ?? t('clients.detail.noEmail')}</p>
            <span
              className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-semibold ${
                client.type === 'business'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {client.type === 'business' ? t('clients.detail.types.business') : t('clients.detail.types.individual')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
          >
            {clientQuery.isFetching ? t('clients.detail.deleting') : t('clients.detail.delete')}
          </button>
        </div>
        {actionSuccess ? (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
            {actionSuccess}
          </p>
        ) : null}
        {actionError ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {actionError}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{t('clients.detail.properties')}</h2>
          <div className="flex items-center gap-3">
            {loadingProperties ? <span className="text-xs text-slate-600">{t('clients.detail.loading')}</span> : null}
            <Link
              to={`/clients/${client.id}/properties/new`}
              state={{ clientId: client.id }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              {t('clients.detail.addProperty')}
            </Link>
          </div>
        </header>

        {properties.length === 0 && !loadingProperties ? (
          <p className="text-sm text-slate-700">{t('clients.detail.noProperties')}</p>
        ) : null}

        {properties.length ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {properties.map((property) => (
              <li key={property.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{property.nickname || t('clients.detail.primaryProperty')}</p>
                <p className="text-xs text-slate-700">{property.address_line1}</p>
                {property.address_line2 ? (
                  <p className="text-xs text-slate-600">{property.address_line2}</p>
                ) : null}
                <p className="text-xs text-slate-700">
                  {property.city}, {property.province} {property.postal_code}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
};

export default ClientDetailPage;
