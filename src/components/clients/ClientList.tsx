import React, { memo, useMemo, useState, useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import { useClients } from '../../hooks/useClients';
import { useJobs } from '../../hooks/useJobs';
import { Link } from '../../lib/router';
import type { ClientWithPrimaryProperty } from '../../types/clients';

type ClientWithStats = ClientWithPrimaryProperty & {
  jobCount: number;
  lastJobDate: string | null;
};

interface ClientListItemProps {
  client: ClientWithStats;
}

const formatLastJob = (iso: string | null, t: (k: string) => string) => {
  if (!iso) return t('clients.list.lastJobNever');
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return t('clients.list.lastJobNever');
  }
};

const ClientListItem = memo(({ client }: ClientListItemProps) => {
  const { t } = useTranslation();

  return (
    <li className="rounded-md border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <Link to={`/clients/${client.id}`} className="block focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 rounded-md -m-3 p-3 min-h-[44px] flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-900">
              {client.name ?? t('clients.list.unnamed')}
            </p>
            {client.email ? (
              <p className="text-xs text-slate-600">{client.email}</p>
            ) : null}
            <p className="text-xs text-slate-700">{client.primary_property?.city ?? t('clients.list.cityFallback')}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold shrink-0 ${
              client.type === 'business'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {client.type === 'business' ? t('clients.list.types.business') : t('clients.list.types.individual')}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span>{t('clients.list.jobCount', { count: client.jobCount })}</span>
          <span>{formatLastJob(client.lastJobDate, t)}</span>
        </div>
        {client.primary_property?.address_line1 ? (
          <p className="mt-1 text-xs text-slate-500">{client.primary_property.address_line1}</p>
        ) : null}
      </Link>
    </li>
  );
});

ClientListItem.displayName = 'ClientListItem';

const ClientList: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // Optimization: Defer the search state used for filtering.
  // This allows React to prioritize the input state update (user typing)
  // over the potentially expensive array filtering and re-rendering of the list.
  // Expected impact: Eliminates typing lag on large client lists.
  const deferredSearch = useDeferredValue(search);

  const { clients, loading, error } = useClients();
  const { jobs } = useJobs();

  const clientsWithStats = useMemo((): ClientWithStats[] => {
    const byClient = new Map<string, { count: number; lastDate: string | null }>();
    for (const job of jobs) {
      const prev = byClient.get(job.client_id) ?? { count: 0, lastDate: null };
      const updated = job.updated_at ?? job.created_at ?? null;
      const lastDate = prev.lastDate && updated ? (updated > prev.lastDate ? updated : prev.lastDate) : updated ?? prev.lastDate;
      byClient.set(job.client_id, { count: prev.count + 1, lastDate });
    }
    return clients.map((c) => {
      const stats = byClient.get(c.id) ?? { count: 0, lastDate: null };
      return { ...c, jobCount: stats.count, lastJobDate: stats.lastDate };
    });
  }, [clients, jobs]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return clientsWithStats;
    return clientsWithStats.filter((c) => (c.name ?? '').toLowerCase().includes(q));
  }, [clientsWithStats, deferredSearch]);

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t('clients.list.title')}</h2>
        <label className="sr-only" htmlFor="clients-search">
          {t('clients.list.search')}
        </label>
        <input
          id="clients-search"
          type="search"
          placeholder={t('clients.list.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-[44px] w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          aria-label={t('clients.list.search')}
        />
      </header>

      {loading ? <p className="text-sm text-slate-600">{t('clients.list.loading')}</p> : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {t('clients.list.error')}
        </p>
      ) : null}

      {!loading && !error ? (
        filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">{t('clients.list.empty')}</p>
            <Link
              to="/clients/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              {t('clients.list.newClient')}
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
              {filtered.map((client) => (
                <ClientListItem key={client.id} client={client} />
              ))}
            </ul>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="py-3 pr-2 font-semibold text-slate-900">{t('clients.list.pageTitle')}</th>
                    <th scope="col" className="py-3 pr-2 font-semibold text-slate-900">{t('clients.list.typeHeader')}</th>
                    <th scope="col" className="py-3 pr-2 font-semibold text-slate-900">{t('auth.shared.email')}</th>
                    <th scope="col" className="py-3 pr-2 font-semibold text-slate-900">{t('clients.list.jobsColumn')}</th>
                    <th scope="col" className="py-3 font-semibold text-slate-900">{t('clients.list.lastJob')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((client) => (
                    <tr key={client.id}>
                      <td className="py-3 pr-2">
                        <Link to={`/clients/${client.id}`} className="font-medium text-slate-900 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded">
                          {client.name ?? t('clients.list.unnamed')}
                        </Link>
                      </td>
                      <td className="py-3 pr-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${client.type === 'business' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {client.type === 'business' ? t('clients.list.types.business') : t('clients.list.types.individual')}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-slate-600">{client.email ?? '—'}</td>
                      <td className="py-3 pr-2">{client.jobCount}</td>
                      <td className="py-3">{formatLastJob(client.lastJobDate, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : null}
    </section>
  );
};

export default ClientList;
