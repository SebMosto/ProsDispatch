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
      setJobs(options?.optimisticJobs ?? []);
    } else {
      const fetched = result.data ?? [];
      setJobs([...(options?.optimisticJobs ?? []), ...fetched]);
    }

    setLoading(false);
  }, [options?.optimisticJobs, params]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const combinedJobs = useMemo(() => {
    const optimisticMap = new Map(options?.optimisticJobs?.map((job) => [job.id, job]));
    return jobs.map((job) => optimisticMap?.get(job.id) ?? job);
  }, [jobs, options?.optimisticJobs]);

  return { jobs: combinedJobs, loading, error, refetch: fetchJobs };
};

export type UseJobsReturn = ReturnType<typeof useJobs>;
