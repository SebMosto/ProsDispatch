import JobCard from './JobCard';
import { useJobs } from '../../hooks/useJobs';

const JobList = () => {
  const { jobs, loading, error, refetch } = useJobs();

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
    return (
      <section className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">Unable to load jobs</p>
        <p className="text-red-600">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-500"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!jobs.length) {
    return (
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h3 className="text-base font-semibold text-slate-900">Jobs</h3>
        <p className="text-slate-600">No jobs found. Create your first job to get started.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Jobs</h3>
        <span className="text-xs text-slate-500">{jobs.length} total</span>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
};

export default JobList;
