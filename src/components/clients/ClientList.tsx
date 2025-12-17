import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type ClientRecord = {
  id: string;
  name: string | null;
  city?: string | null;
};

const TEXT = {
  title: 'Clients',
  empty: 'No clients yet. New clients will appear here.',
  error: 'Unable to load clients.',
  cityFallback: 'City unavailable',
  loading: 'Loading...',
  unnamed: 'Unnamed client',
};

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = supabase as unknown as SupabaseClient;

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error: queryError } = await db.from('clients').select('*').is('deleted_at', null);

      if (queryError) {
        setError(queryError.message);
      } else {
        setClients(data ?? []);
      }

      setLoading(false);
    };

    void fetchClients();
  }, []);

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{TEXT.title}</h2>
      </header>

      {loading ? <p className="text-sm text-slate-600">{TEXT.loading}</p> : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {TEXT.error}
        </p>
      ) : null}

      {!loading && !error ? (
        clients.length === 0 ? (
          <p className="text-sm text-slate-600">{TEXT.empty}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3">
            {clients.map((client) => (
              <li key={client.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{client.name ?? TEXT.unnamed}</p>
                <p className="text-xs text-slate-700">{client.city || TEXT.cityFallback}</p>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
};

export default ClientList;
