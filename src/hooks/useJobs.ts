import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { JobListParams, JobRecord } from '../repositories/jobRepository';
import { jobRepository } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';

const FIVE_MINUTES = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

export const useJobs = (params?: JobListParams) => {
  const { t } = useTranslation();
  const queryKey = useMemo(() => ['jobs', params ?? {}], [params]);

  const queryFn = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const result = await jobRepository.list(params, controller.signal);
      if (result.error) throw result.error;
      return result.data ?? [];
    } catch (err) {
      if (controller.signal.aborted) throw { message: t('errors.timeout'), reason: 'network' } satisfies RepositoryError;
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }, [params, t]);

  const query = useQuery<JobRecord[], RepositoryError>({
    queryKey,
    queryFn,
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
