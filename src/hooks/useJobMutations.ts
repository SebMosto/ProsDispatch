import { useMemo } from 'react';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { jobRepository, type JobRecord } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';
import type { JobCreateInput, JobUpdateInput } from '../schemas/mvp1/job';

const normalizeServiceDate = (value: JobCreateInput['service_date']) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
};

const buildOptimisticJob = (input: JobCreateInput, contractorId: string): JobRecord => {
  const now = new Date().toISOString();
  return {
    id: `temp-${crypto.randomUUID()}`,
    contractor_id: contractorId,
    client_id: input.client_id,
    property_id: input.property_id,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? 'draft',
    service_date: normalizeServiceDate(input.service_date),
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
};

export const useCreateJobMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<JobRecord, RepositoryError, JobCreateInput, { previousJobs: Array<[QueryKey, JobRecord[] | undefined]> }>(
    {
      mutationFn: async (input) => {
        const result = await jobRepository.create(input);
        if (result.error || !result.data) {
          throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
        }
        return result.data;
      },
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: ['jobs'] });

        let previousJobs = queryClient.getQueriesData<JobRecord[]>({ queryKey: ['jobs'] });

        const optimisticJob = buildOptimisticJob(input, user?.id ?? 'local-contractor');

        if (previousJobs.length === 0) {
          previousJobs = [[['jobs', {}], undefined]];
        }

        previousJobs.forEach(([key, jobs]) => {
          queryClient.setQueryData<JobRecord[]>(key, (jobs ?? []).length ? [optimisticJob, ...(jobs ?? [])] : [optimisticJob]);
        });

        return { previousJobs };
      },
      onError: (_err, _input, context) => {
        context?.previousJobs.forEach(([key, jobs]) => {
          queryClient.setQueryData<JobRecord[] | undefined>(key, jobs);
        });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      },
    },
  );
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
      buildOptimisticJob,
    }),
    [createMutation],
  );
};
