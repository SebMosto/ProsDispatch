import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobRepository, type JobRecord } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';
import type { JobCreateInput, JobUpdateInput } from '../schemas/job';

export const useCreateJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<JobRecord, RepositoryError, JobCreateInput>({
    mutationFn: async (input) => {
      const result = await jobRepository.create(input);
      if (result.error || !result.data) {
        throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
      }
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useUpdateJobMutation = (jobId: string) => {
  const queryClient = useQueryClient();

  return useMutation<JobRecord, RepositoryError, JobUpdateInput>({
    mutationFn: async (input) => {
      const result = await jobRepository.update(jobId, input);
      if (result.error || !result.data) {
        throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] }).catch(() => {
        // noop
      });
    },
  });
};

export const useJobMutations = () => {
  const createMutation = useCreateJobMutation();

  return useMemo(
    () => ({
      createMutation,
    }),
    [createMutation],
  );
};
