import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];

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
        // Fetch clients with their properties (joining on the properties table)
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (clientsError) {
          throw clientsError;
        }

        // For each client, fetch their primary property (first non-deleted property)
        const clientsWithProperties = await Promise.all(
          (clientsData || []).map(async (client) => {
            const { data: properties } = await supabase
              .from('properties')
              .select('city, address_line1')
              .eq('client_id', client.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();

            return {
              ...client,
              primary_property: properties || null,
            };
          })
        );

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
