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
  return error.code === '408' || error.code === '503';
};

export abstract class BaseRepository {
  protected client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = supabase) {
    this.client = client;
  }

  protected toRepositoryError(error: PostgrestError | null): RepositoryError | null {
    if (!error) return null;

    const isNetworkError = isNetworkRelatedError(error);

    if (isNetworkError) {
      reportApiOffline();
    } else {
      reportApiOnline();
    }

    const status = error.code ? Number.parseInt(error.code, 10) : NaN;

    return {
      message: error.message,
      status: !Number.isNaN(status) ? status : undefined,
      reason: isNetworkError ? 'network' : 'server',
      cause: error,
    };
  }
}
