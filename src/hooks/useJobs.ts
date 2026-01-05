import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { JobListParams, JobRecord } from '../repositories/jobRepository';
import { jobRepository } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';

const FIVE_MINUTES = 5 * 60 * 1000;

export const useJobs = (params?: JobListParams) => {
  const queryKey = useMemo(() => ['jobs', params ?? {}], [params]);

  const query = useQuery<JobRecord[], RepositoryError>({
    queryKey,
    queryFn: async () => {
      const result = await jobRepository.list(params);
      if (result.error) {
        throw result.error;
      }
      return result.data ?? [];
    },
    staleTime: FIVE_MINUTES,
  });

  return {
    jobs: query.data ?? [],
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export type UseJobsReturn = ReturnType<typeof useJobs>;
