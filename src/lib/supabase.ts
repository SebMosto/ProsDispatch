import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Mock client: Select failed') }),
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
            order: () => Promise.resolve({ data: [], error: null }),
            insert: () => Promise.resolve({ data: null, error: new Error('Mock client: Insert failed') }),
            update: () => Promise.resolve({ data: null, error: new Error('Mock client: Update failed') }),
          }),
        }),
        auth: {
          signInWithPassword: () => Promise.resolve({ data: { session: null, user: null }, error: new Error('Mock client: Sign in failed') }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Mock client: Get user failed') }),
          signOut: () => Promise.resolve({ error: new Error('Mock client: Sign out failed') }),
          getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Mock client: Get session failed') }),
        },
      }
) as unknown as SupabaseClient<Database>;
