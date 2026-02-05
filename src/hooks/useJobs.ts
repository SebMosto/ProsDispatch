import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { JobListParams, JobRecord } from '../repositories/jobRepository';
import { jobRepository } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';

const FIVE_MINUTES = 5 * 60 * 1000;

export const useJobs = (params?: JobListParams) => {
  const queryKey = useMemo(() => ['jobs', params ?? {}], [params]);

  const queryFn = useCallback(async () => {
    const result = await jobRepository.list(params);
    if (result.error) {
      throw result.error;
    }
    return result.data ?? [];
  }, [params]);

  const query = useQuery<JobRecord[], RepositoryError>({
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

export type UseJobsReturn = ReturnType<typeof useJobs>;

export const useJobByToken = (token?: string) => {
  const queryKey = useMemo(() => ['job', 'token', token], [token]);

  const queryFn = useCallback(async () => {
    if (!token) return null;
    const result = await jobRepository.getByToken(token);
    if (result.error) {
      throw result.error;
    }
    return result.data;
  }, [token]);

  const query = useQuery<JobRecord | null, RepositoryError>({
    queryKey,
    queryFn,
    enabled: !!token,
    retry: false,
  });

  return {
    job: query.data ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
  };
};
