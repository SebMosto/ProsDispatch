import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Client = Database['public']['Tables']['clients']['Row'];

export type ClientWithPrimaryProperty = Client & {
  primary_property?: {
    city: string;
    address_line1: string;
  } | null;
};

export const useClients = () => {
  const [clients, setClients] = useState<ClientWithPrimaryProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (clientsError) {
          throw clientsError;
        }

        if (!clientsData || clientsData.length === 0) {
          setClients([]);
          return;
        }

        // Fetch all properties for these clients in a single query
        const clientIds = clientsData.map((c) => c.id);
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('client_id, city, address_line1, created_at')
          .in('client_id', clientIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (propertiesError) {
          throw propertiesError;
        }

        // Map properties to clients (get first property per client)
        const propertiesMap = new Map<string, { city: string; address_line1: string }>();
        propertiesData?.forEach((prop) => {
          if (!propertiesMap.has(prop.client_id)) {
            propertiesMap.set(prop.client_id, {
              city: prop.city,
              address_line1: prop.address_line1,
            });
          }
        });

        const clientsWithProperties = clientsData.map((client) => ({
          ...client,
          primary_property: propertiesMap.get(client.id) || null,
        }));

        setClients(clientsWithProperties);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch clients';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchClients();
  }, []);

  return { clients, loading, error };
};

