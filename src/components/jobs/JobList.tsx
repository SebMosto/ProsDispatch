import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useJobs } from '../../hooks/useJobs';
import { useClients } from '../../hooks/useClients';
import { useProperties } from '../../hooks/useProperties';
import type { JobStatus } from '../../schemas/job';
import JobCard from './JobCard';

type TabKey = 'all' | 'active' | 'completed' | 'invoiced' | 'paid' | 'archived';

const TABS: TabKey[] = ['all', 'active', 'completed', 'invoiced', 'paid', 'archived'];

const TAB_STATUSES: Record<TabKey, Set<JobStatus> | null> = {
  all: null,
  active: new Set<JobStatus>(['draft', 'sent', 'approved', 'in_progress']),
  completed: new Set<JobStatus>(['completed']),
  invoiced: new Set<JobStatus>(['invoiced']),
  paid: new Set<JobStatus>(['paid']),
  archived: new Set<JobStatus>(['archived']),
};

const TAB_LABELS: Record<TabKey, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
  invoiced: 'Invoiced',
  paid: 'Paid',
  archived: 'Archived',
};

const TAB_EMPTY: Record<TabKey, string> = {
  all: '',
  active: 'No active jobs yet.',
  completed: 'No completed jobs.',
  invoiced: 'No invoiced jobs.',
  paid: 'No paid jobs.',
  archived: 'No archived jobs.',
};

const JobList = () => {
  const { t } = useTranslation();
  const { jobs, loading, error, refetch } = useJobs();
  const { clients } = useClients();
  const { properties } = useProperties();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('active');

  const propertyMap = useMemo(
    () =>
      properties.reduce<Record<string, string>>((acc, p) => {
        const { address_line1, city, province, postal_code } = p;
        if (address_line1 && city && province && postal_code) {
          acc[p.id] = `${address_line1}, ${city}, ${province} ${postal_code}`;
        }
        return acc;
      }, {}),
    [properties]
  );

  const clientMap = useMemo(
    () =>
      clients.reduce<Record<string, string>>(
        (acc, c) => ({ ...acc, [c.id]: c.name }),
        {}
      ),
    [clients]
  );

  const tabCounts = useMemo<Record<TabKey, number>>(
    () =>
      TABS.reduce(
        (acc, tab) => {
          const statuses = TAB_STATUSES[tab];
          const count = statuses
            ? jobs.filter((j) => statuses.has(j.status)).length
            : jobs.length;
          return { ...acc, [tab]: count };
        },
        { all: 0, active: 0, completed: 0, invoiced: 0, paid: 0, archived: 0 }
      ),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const statuses = TAB_STATUSES[activeTab];
    let result = statuses ? jobs.filter((j) => statuses.has(j.status)) : [...jobs];

    if (search.trim()) {
      const lower = search.trim().toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(lower) ||
          (clientMap[j.client_id] ?? '').toLowerCase().includes(lower)
      );
    }

    return result.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [jobs, activeTab, search, clientMap]);

  if (loading) {
    return (
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </section>
    );
  }

  if (error) {
    const errorText = error.reason === 'network' ? t('errors.timeout') : t('errors.unexpected');
    return (
      <section className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">{t('jobs.list.error')}</p>
        <p className="text-red-600">{errorText}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-[36px] items-center justify-center rounded-[7px] border-2 border-[#0F172A] bg-[#FF5C1B] px-[13px] text-xs font-bold text-[#1F1308] shadow-brutal transition hover:translate-x-[-1px] hover:translate-y-[-1px]"
        >
          {t('jobs.list.retry')}
        </button>
      </section>
    );
  }

  const emptyMessage = activeTab === 'all' ? t('jobs.list.empty') : TAB_EMPTY[activeTab];

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or client…"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {TAB_LABELS[tab]} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      <div className="text-right text-xs text-slate-500">{filteredJobs.length} jobs</div>

      {filteredJobs.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} clientName={clientMap[job.client_id]} propertyAddress={job.property_id ? propertyMap[job.property_id] : undefined} />
          ))}
        </div>
      )}
    </section>
  );
};

export default JobList;
