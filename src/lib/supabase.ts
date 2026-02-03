import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// HARDWIRED CONFIGURATION (Temporary Bypass)
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

console.log('🔌 Supabase Client Initializing...');
console.log('📍 URL:', supabaseUrl);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'prosdispatch',
    },
  },
});

// Helper to check connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth State Change:', event);
});
