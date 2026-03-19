import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientRepository } from '../repositories/clientRepository';
import { propertyRepository, type PropertyRecord } from '../repositories/propertyRepository';
import type { RepositoryError } from '../repositories/base';
import type { ClientWithPrimaryProperty } from '../types/clients';

export type { ClientWithPrimaryProperty };

const FETCH_TIMEOUT_MS = 10_000;

const TIMEOUT_ERROR: RepositoryError = {
  message: 'Unable to load your data. Please check your connection and try again.',
  reason: 'network',
};

const buildPrimaryPropertyMap = (properties: PropertyRecord[]) => {
  const map = new Map<string, { city: string; address_line1: string }>();

  properties.forEach((property) => {
    if (!map.has(property.client_id)) {
      map.set(property.client_id, {
        city: property.city,
        address_line1: property.address_line1,
      });
    }
  });

  return map;
};

export const useClients = () => {
  const queryKey = useMemo(() => ['clients'], []);

  const queryFn = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const clientsResult = await clientRepository.list(undefined, controller.signal);
      if (clientsResult.error) throw clientsResult.error;

      const clients = clientsResult.data ?? [];
      if (!clients.length) return [];

      const propertiesResult = await propertyRepository.list(
        { clientIds: clients.map((client) => client.id) },
        controller.signal,
      );
      if (propertiesResult.error) throw propertiesResult.error;

      const properties = propertiesResult.data ?? [];
      const propertyMap = buildPrimaryPropertyMap(properties);

      return clients.map((client) => ({
        ...client,
        primary_property: propertyMap.get(client.id) ?? null,
      }));
    } catch (err) {
      if (controller.signal.aborted) throw TIMEOUT_ERROR;
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const query = useQuery<ClientWithPrimaryProperty[], RepositoryError>({
    queryKey,
    queryFn,
    retry: false,
  });

  return useMemo(
    () => ({
      clients: query.data ?? [],
      loading: query.isLoading,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.error, query.refetch]
  );
};

export type UseClientsReturn = ReturnType<typeof useClients>;
