import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertyRepository, type PropertyRecord } from '../repositories/propertyRepository';
import type { RepositoryError } from '../repositories/base';

export const useProperties = (clientId?: string) => {
  const queryKey = useMemo(() => ['properties', clientId ?? 'all'], [clientId]);

  const queryFn = useCallback(async () => {
    if (!clientId) return [];

    const result = await propertyRepository.list({ clientId });
    if (result.error) {
      throw result.error;
    }

    return result.data ?? [];
  }, [clientId]);

  const query = useQuery<PropertyRecord[], RepositoryError>({
    queryKey,
    enabled: Boolean(clientId),
    queryFn,
  });

  return useMemo(
    () => ({
      properties: query.data ?? [],
      loading: query.isLoading,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [query.data, query.error, query.isLoading],
  );
};

export type UsePropertiesReturn = ReturnType<typeof useProperties>;
