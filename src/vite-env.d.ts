/// <reference types="vite/client" />

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  google: any;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
