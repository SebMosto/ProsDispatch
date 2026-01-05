import { useCallback, useMemo, useState } from 'react';
import { IllegalJobStatusTransitionError, advanceJobStatus } from '../lib/jobStatus';
import type { JobCreateInput } from '../schemas/job';
import { jobRepository, type JobRecord } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';

interface UseCreateJobOptions {
  onSuccess?: (job: JobRecord) => void;
}

interface CreateJobResult {
  job?: JobRecord;
  error?: RepositoryError;
}

export const useCreateJob = (options?: UseCreateJobOptions) => {
  const [optimisticJob, setOptimisticJob] = useState<JobRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RepositoryError | null>(null);

  const normalizeStatus = useCallback((input: JobCreateInput) => {
    if (input.status && input.status !== 'draft') {
      return advanceJobStatus('draft', input.status);
    }

    return 'draft';
  }, []);

  const buildOptimisticJob = useCallback(
    (input: JobCreateInput): JobRecord => {
      const now = new Date().toISOString();
      return {
        id: `temp-${crypto.randomUUID()}`,
        contractor_id: input.contractor_id,
        client_id: input.client_id,
        property_id: input.property_id,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? 'draft',
        service_date: input.service_date
          ? input.service_date instanceof Date
            ? input.service_date.toISOString().slice(0, 10)
            : input.service_date
          : null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
    },
    [],
  );

  const createJob = useCallback(
    async (input: JobCreateInput): Promise<CreateJobResult> => {
      setIsLoading(true);
      setError(null);

      let status = 'draft' as JobRecord['status'];
      try {
        status = normalizeStatus(input);
      } catch (caughtError) {
        const transitionError = caughtError as Error;
        const repositoryError: RepositoryError = {
          message:
            transitionError instanceof IllegalJobStatusTransitionError
              ? transitionError.message
              : 'Invalid job status transition',
          reason: 'validation',
          cause: caughtError,
        };
        setError(repositoryError);
        setIsLoading(false);
        return { job: undefined, error: repositoryError };
      }

      const sanitizedInput: JobCreateInput = {
        ...input,
        status,
      };

      const optimistic = buildOptimisticJob(sanitizedInput);
      setOptimisticJob(optimistic);

      const result = await jobRepository.create(sanitizedInput);

      setIsLoading(false);

      if (result.error || !result.data) {
        setError(result.error ?? null);
        return { job: optimistic, error: result.error };
      }

      setOptimisticJob(null);
      options?.onSuccess?.(result.data);
      return { job: result.data };
    },
    [buildOptimisticJob, options],
  );

  const state = useMemo(
    () => ({
      createJob,
      optimisticJob,
      isLoading,
      error,
    }),
    [createJob, optimisticJob, isLoading, error],
  );

  return state;
};

export type UseCreateJobReturn = ReturnType<typeof useCreateJob>;
