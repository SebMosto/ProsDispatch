/// <reference types="vite/client" />

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  google: any;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  /** When `"true"` at build time, allows invoice finalize DB fallback if the edge function fails (vite preview / E2E only; never set in production). */
  readonly VITE_ALLOW_INVOICE_FINALIZE_FALLBACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
