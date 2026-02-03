import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientRepository, type ClientRecord } from '../repositories/clientRepository';
import { propertyRepository, type PropertyRecord } from '../repositories/propertyRepository';
import type { RepositoryError } from '../repositories/base';

export type ClientWithPrimaryProperty = ClientRecord & {
  primary_property?: { city: string; address_line1: string } | null;
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
    const clientsResult = await clientRepository.list();

    if (clientsResult.error) {
      throw clientsResult.error;
    }

    const clients = clientsResult.data ?? [];
    if (!clients.length) return [];

    const propertiesResult = await propertyRepository.list({
      clientIds: clients.map((client) => client.id),
    });

    if (propertiesResult.error) {
      throw propertiesResult.error;
    }

    const properties = propertiesResult.data ?? [];
    const propertyMap = buildPrimaryPropertyMap(properties);

    return clients.map((client) => ({
      ...client,
      primary_property: propertyMap.get(client.id) ?? null,
    }));
  }, []);

  const query = useQuery<ClientWithPrimaryProperty[], RepositoryError>({
    queryKey,
    queryFn,
  });

  return {
    clients: query.data ?? [],
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};

export type UseClientsReturn = ReturnType<typeof useClients>;
