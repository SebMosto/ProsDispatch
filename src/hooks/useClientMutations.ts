import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { clientRepository, type ClientRecord } from '../repositories/clientRepository';
import type { RepositoryError } from '../repositories/base';
import type { ClientCreateInput, ClientUpdateInput } from '../schemas/client';

export type CachedClient = ClientRecord & { primary_property?: unknown };

type CachedClientEntries = Array<[unknown, CachedClient[] | undefined]>;

const buildOptimisticClient = (input: ClientCreateInput, contractorId: string): ClientRecord => {
  const now = new Date().toISOString();

  return {
    id: `temp-${crypto.randomUUID()}`,
    contractor_id: contractorId,
    name: input.name,
    email: input.email && input.email.length ? input.email : null,
    preferred_language: input.preferred_language ?? 'en',
    type: input.type ?? 'individual',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
};

export const useCreateClientMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<ClientRecord, RepositoryError, ClientCreateInput, { previousClients: CachedClientEntries }>(
    {
      mutationFn: async (input) => {
        const result = await clientRepository.create(input);
        if (result.error || !result.data) {
          throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
        }
        return result.data;
      },
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: ['clients'] });

        let previousClients = queryClient.getQueriesData<CachedClient[]>(['clients']);

        const optimisticClient = buildOptimisticClient(input, user?.id ?? 'local-contractor');

        if (previousClients.length === 0) {
          previousClients = [[['clients'], undefined]];
        }

        previousClients.forEach(([key, clients]) => {
          queryClient.setQueryData<CachedClient[]>(key, (clients ?? []).length ? [optimisticClient, ...(clients ?? [])] : [optimisticClient]);
        });

        return { previousClients };
      },
      onError: (_err, _input, context) => {
        context?.previousClients.forEach(([key, clients]) => {
          queryClient.setQueryData<CachedClient[] | undefined>(key, clients);
        });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: ['clients'] });
      },
    },
  );
};

export const useUpdateClientMutation = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ClientRecord, RepositoryError, ClientUpdateInput, { previousClients: CachedClientEntries }>(
    {
      mutationFn: async (input) => {
        const result = await clientRepository.update(clientId, input);
        if (result.error || !result.data) {
          throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
        }
        return result.data;
      },
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: ['clients'] });
        const previousClients = queryClient.getQueriesData<CachedClient[]>(['clients']);

        previousClients.forEach(([key, clients]) => {
          const updatedClients = (clients ?? []).map((client) =>
            client.id === clientId
              ? {
                  ...client,
                  ...input,
                  email: input.email === '' ? null : input.email ?? client.email,
                }
              : client,
          );
          queryClient.setQueryData<CachedClient[]>(key, updatedClients);
        });

        return { previousClients };
      },
      onError: (_err, _input, context) => {
        context?.previousClients.forEach(([key, clients]) => {
          queryClient.setQueryData<CachedClient[] | undefined>(key, clients);
        });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: ['clients'] });
      },
    },
  );
};

export const useClientMutations = (clientId?: string) => {
  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation(clientId ?? '');

  return useMemo(
    () => ({
      createMutation,
      updateMutation: clientId ? updateMutation : null,
      buildOptimisticClient,
    }),
    [clientId, createMutation, updateMutation],
  );
};
