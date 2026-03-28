import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import type { JobListParams, JobRecord } from '../repositories/jobRepository';
import { jobRepository } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';

const FIVE_MINUTES = 5 * 60 * 1000;

export const useJobs = (params?: JobListParams) => {
  const { user } = useAuth();
  const queryKey = useMemo(() => ['jobs', params ?? {}], [params]);

  const queryFn = useCallback(async ({ signal }: { signal?: AbortSignal }) => {
    const result = await jobRepository.list(params, signal);
    if (result.error) throw result.error;
    return result.data ?? [];
  }, [params]);

  const query = useQuery<JobRecord[], RepositoryError>({
    queryKey,
    queryFn,
    enabled: !!user,
    staleTime: FIVE_MINUTES,
    retry: false,
  });

  return useMemo(
    () => ({
      jobs: query.data ?? [],
      loading: query.isLoading,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.error, query.refetch]
  );
};

export type UseJobsReturn = ReturnType<typeof useJobs>;
