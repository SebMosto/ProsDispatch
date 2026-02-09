import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useJobsWithDetails } from '../hooks/useJobsWithDetails';
import JobCard from '../components/jobs/JobCard';
import { Plus, LogOut } from 'lucide-react';
import type { JobStatus } from '../schemas/mvp1/job';

const ACTIVE_STATUSES: JobStatus[] = ['draft', 'sent', 'approved', 'in_progress'];
const HISTORY_STATUSES: JobStatus[] = ['completed', 'invoiced', 'paid', 'archived'];

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const { jobs, loading, error, refetch } = useJobsWithDetails();

  const activeJobs = useMemo(() =>
    jobs.filter((job) => ACTIVE_STATUSES.includes(job.status)),
    [jobs]
  );

  const historyJobs = useMemo(() =>
    jobs.filter((job) => HISTORY_STATUSES.includes(job.status)),
    [jobs]
  );

  const displayedJobs = activeTab === 'active' ? activeJobs : historyJobs;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('auth.dashboard.title')}</h1>
          <p className="text-sm text-slate-600">
            {profile?.business_name || profile?.full_name || user?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            <span>Create Job</span>
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            aria-label={t('auth.dashboard.signOut')}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('active')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            Active Jobs
            <span className={`ml-2 rounded-full py-0.5 px-2.5 text-xs font-medium ${
              activeTab === 'active' ? 'bg-slate-100 text-slate-900' : 'bg-slate-100 text-slate-600'
            }`}>
              {activeJobs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            History
            <span className={`ml-2 rounded-full py-0.5 px-2.5 text-xs font-medium ${
              activeTab === 'history' ? 'bg-slate-100 text-slate-900' : 'bg-slate-100 text-slate-600'
            }`}>
              {historyJobs.length}
            </span>
          </button>
        </nav>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="space-y-4">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-slate-100" />
             ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Unable to load jobs</p>
            <p>{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs font-semibold underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
            <p className="font-semibold text-slate-900">No jobs found</p>
            <p className="text-sm text-slate-500">
              {activeTab === 'active'
                ? "You don't have any active jobs right now."
                : "You haven't completed any jobs yet."}
            </p>
            {activeTab === 'active' && (
              <Link
                to="/jobs/new"
                className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
              >
                Create your first job &rarr;
              </Link>
            )}
          </div>
        ) : (
          displayedJobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </main>
  );
};

export default DashboardPage;
