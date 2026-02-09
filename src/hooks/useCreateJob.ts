import { useMemo } from 'react';
import type { JobCreateInput } from '../schemas/job';
import { useCreateJobMutation } from './useJobMutations';

interface UseCreateJobOptions {
  onSuccess?: () => void;
}

export const useCreateJob = (options?: UseCreateJobOptions) => {
  const mutation = useCreateJobMutation();

  return useMemo(
    () => ({
      createJob: async (input: JobCreateInput) => {
        const job = await mutation.mutateAsync(input);
        options?.onSuccess?.();
        return job;
      },
      isLoading: mutation.isPending,
      error: mutation.error ?? null,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutation.error, mutation.isPending, mutation.mutateAsync],
  );
};

export type UseCreateJobReturn = ReturnType<typeof useCreateJob>;
