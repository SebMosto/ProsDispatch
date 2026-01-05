import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JobListParams, JobRecord } from '../repositories/jobRepository';
import { jobRepository } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';

interface UseJobsOptions {
  optimisticJobs?: JobRecord[];
}

export const useJobs = (params?: JobListParams, options?: UseJobsOptions) => {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<RepositoryError | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await jobRepository.list(params);

    if (result.error) {
      setError(result.error);
      setJobs([]); // On error, clear fetched jobs
    } else {
      setJobs(result.data ?? []); // Only store fetched jobs
    }

    setLoading(false);
  }, [params]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const combinedJobs = useMemo(() => {
    // Combine optimistic jobs with fetched jobs for rendering.
    return [...(options?.optimisticJobs ?? []), ...jobs];
  }, [jobs, options?.optimisticJobs]);

  return { jobs: combinedJobs, loading, error, refetch: fetchJobs };
};

export type UseJobsReturn = ReturnType<typeof useJobs>;
