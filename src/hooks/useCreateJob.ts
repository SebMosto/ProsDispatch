import { useMemo, useCallback } from 'react';
import type { JobCreateInput } from '../schemas/job';
import { useCreateJobMutation } from './useJobMutations';

interface UseCreateJobOptions {
  onSuccess?: () => void;
}

export const useCreateJob = (options?: UseCreateJobOptions) => {
  const mutation = useCreateJobMutation();

  const wrappedCreate = useCallback(async (input: JobCreateInput) => {
    const job = await mutation.mutateAsync(input);
    options?.onSuccess?.();
    return job;
  }, [mutation, options]);

  return useMemo(
    () => ({
      createJob: wrappedCreate,
      isLoading: mutation.isPending,
      error: mutation.error ?? null,
    }),
    [mutation.error, mutation.isPending, wrappedCreate],
  );
};

export type UseCreateJobReturn = ReturnType<typeof useCreateJob>;
