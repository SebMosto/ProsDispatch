import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { JobListParams, JobWithDetails } from '../repositories/jobRepository';
import { jobRepository } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';

const FIVE_MINUTES = 5 * 60 * 1000;

export const useJobsWithDetails = (params?: JobListParams) => {
  const queryKey = useMemo(() => ['jobsWithDetails', params ?? {}], [params]);

  const queryFn = useCallback(async () => {
    const result = await jobRepository.listWithDetails(params);
    if (result.error) {
      throw result.error;
    }
    return result.data ?? [];
  }, [params]);

  const query = useQuery<JobWithDetails[], RepositoryError>({
    queryKey,
    queryFn,
    staleTime: FIVE_MINUTES,
  });

  return {
    jobs: query.data ?? [],
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export type UseJobsWithDetailsReturn = ReturnType<typeof useJobsWithDetails>;
