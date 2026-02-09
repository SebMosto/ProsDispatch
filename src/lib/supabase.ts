import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createSafeFallbackClient = (): SupabaseClient<Database> => {
  const error = new Error('Supabase environment variables are missing. Using safe fallback client.');

  const createQueryProxy = () =>
    new Proxy(
      {},
      {
        get: () => () => Promise.reject(error),
      },
    );

  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'auth') {
          // Casting to any because constructing exact AuthError types is verbose
          // and this is just a fallback for missing env vars
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({
              data: { subscription: { id: '', callback: () => {}, unsubscribe: () => {} } },
              error: null,
            }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signOut: async () => ({ error: null }),
          } as any;
        }

        if (prop === 'from') {
          return () => createQueryProxy();
        }

        return () => {
          throw error;
        };
      },
    },
  ) as SupabaseClient<Database>;
};

const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase] Missing environment variables. Falling back to safe client.');
    return createSafeFallbackClient();
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();
