import { useTranslation } from 'react-i18next';
import { useClients } from '../../hooks/useClients';

const ClientList: React.FC = () => {
  const { t } = useTranslation();
  const { clients, loading, error } = useClients();

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{t('clients.list.title')}</h2>
      </header>

      {loading ? <p className="text-sm text-slate-600">{t('clients.list.loading')}</p> : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {t('clients.list.error')}
        </p>
      ) : null}

      {!loading && !error ? (
        clients.length === 0 ? (
          <p className="text-sm text-slate-600">{t('clients.list.empty')}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {clients.map((client) => (
              <li key={client.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-900">
                      {client.name ?? t('clients.list.unnamed')}
                    </p>
                    <p className="text-xs text-slate-700">{client.primary_property?.city || t('clients.list.cityFallback')}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      client.type === 'business'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {client.type === 'business' ? t('clients.list.types.business') : t('clients.list.types.individual')}
                  </span>
                </div>
                {client.primary_property?.address_line1 ? (
                  <p className="mt-2 text-xs text-slate-600">{client.primary_property.address_line1}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
};

export default ClientList;
