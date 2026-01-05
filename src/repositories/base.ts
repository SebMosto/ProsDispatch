import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { reportApiOffline, reportApiOnline } from '../lib/network';
import type { Database } from '../types/database.types';

export type RepositoryErrorReason = 'network' | 'server' | 'validation' | 'unknown';

export interface RepositoryError {
  message: string;
  status?: number;
  reason: RepositoryErrorReason;
  cause?: unknown;
}

export interface RepositoryResult<T> {
  data: T | null;
  error?: RepositoryError;
}

export interface RepositoryListParams {
  [key: string]: unknown;
}

export interface Repository<TRecord, TCreateInput, TUpdateInput, TListParams = RepositoryListParams> {
  list(params?: TListParams): Promise<RepositoryResult<TRecord[]>>;
  get(id: string): Promise<RepositoryResult<TRecord>>;
  create(input: TCreateInput): Promise<RepositoryResult<TRecord>>;
  update(id: string, input: TUpdateInput): Promise<RepositoryResult<TRecord>>;
  softDelete(id: string): Promise<RepositoryResult<null>>;
}

const isNetworkRelatedError = (error: PostgrestError | null) => {
  if (!error) return false;

  // Check for specific HTTP status codes indicating network or service unavailability
  if (error.code === '408' || error.code === '503') {
    return true;
  }

  // Check for common network-related messages (case-insensitive) that often appear
  // in the error.message property for client-side network failures.
  if (error.message) {
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('network request failed') ||
      errorMessage.includes('connection refused') ||
      errorMessage.includes('dns lookup failed') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('offline')
    ) {
      return true;
    }
  }

  return false;
};

export abstract class BaseRepository {
  protected client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = supabase) {
    this.client = client;
  }

  protected toRepositoryError(error: PostgrestError | null): RepositoryError | null {
    if (!error) return null;

    const isNetworkError = isNetworkRelatedError(error);

    // Only report API as online for actual server errors with valid HTTP status codes
    // Network errors (including those without status codes) should report offline
    if (isNetworkError) {
      reportApiOffline();
    } else if (error.code && !isNaN(Number.parseInt(error.code, 10))) {
      // Only report online if we have a valid HTTP status code (indicating we reached the server)
      reportApiOnline();
    }
    // Otherwise, don't report status change (error has no code but isn't identified as network error)

    const status = error.code ? Number.parseInt(error.code, 10) : NaN;

    return {
      message: error.message,
      status: !Number.isNaN(status) ? status : undefined,
      reason: isNetworkError ? 'network' : 'server',
      cause: error,
    };
  }
}
