import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { propertyRepository, type PropertyRecord } from '../repositories/propertyRepository';
import type { RepositoryError } from '../repositories/base';

export const useProperties = (clientId?: string) => {
  const { user } = useAuth();
  const queryKey = useMemo(() => ['properties', clientId ?? 'all'], [clientId]);

  const queryFn = useCallback(async () => {
    const result = await propertyRepository.list(clientId ? { clientId } : undefined);
    if (result.error) {
      throw result.error;
    }

    return result.data ?? [];
  }, [clientId]);

  const query = useQuery<PropertyRecord[], RepositoryError>({
    queryKey,
    enabled: !!user,
    queryFn,
  });

  return {
    properties: query.data ?? [],
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export type UsePropertiesReturn = ReturnType<typeof useProperties>;
