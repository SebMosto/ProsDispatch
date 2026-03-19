import { reportApiOnline } from '../lib/network';
import type { ClientCreateInput, ClientUpdateInput } from '../schemas/client';
import type { Database } from '../types/database.types';
import type { Repository, RepositoryListParams, RepositoryResult } from './base';
import { BaseRepository } from './base';

export type ClientRecord = Database['public']['Tables']['clients']['Row'];
export type ClientListParams = RepositoryListParams & {
  includeDeleted?: boolean;
};

export class ClientRepository
  extends BaseRepository
  implements Repository<ClientRecord, ClientCreateInput, ClientUpdateInput, ClientListParams>
{
  async list(params?: ClientListParams, signal?: AbortSignal): Promise<RepositoryResult<ClientRecord[]>> {
    const { includeDeleted } = params ?? {};

    const query = this.client
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeDeleted) {
      query.is('deleted_at', null);
    }

    const { data, error } = await (signal ? query.abortSignal(signal) : query);
    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data: data ?? [] };
  }

  async get(id: string): Promise<RepositoryResult<ClientRecord>> {
    const { data, error } = await this.client
      .from('clients')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data };
  }

  async create(input: ClientCreateInput): Promise<RepositoryResult<ClientRecord>> {
    const { data: authData, error: authError } = await this.client.auth.getUser();

    if (authError) {
      return {
        data: null,
        error: {
          message: authError.message,
          reason: 'validation',
          cause: authError,
        },
      };
    }

    if (!authData?.user) {
      return {
        data: null,
        error: {
          message: 'User must be authenticated to create a client',
          reason: 'validation',
        },
      };
    }

    const payload = {
      contractor_id: authData.user.id,
      name: input.name,
      email: input.email ? input.email : null,
      preferred_language: input.preferred_language ?? 'en',
      type: input.type ?? 'individual',
    } satisfies Database['public']['Tables']['clients']['Insert'];

    const { data, error } = await this.client
      .from('clients')
      .insert(payload)
      .select('*')
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data };
  }

  async update(id: string, input: ClientUpdateInput): Promise<RepositoryResult<ClientRecord>> {
    const payload = {
      ...input,
      email: input.email === '' ? null : input.email ?? undefined,
    } satisfies Database['public']['Tables']['clients']['Update'];

    const { data, error } = await this.client
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data };
  }

  async softDelete(id: string): Promise<RepositoryResult<null>> {
    const { error } = await this.client
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data: null };
  }
}

export const clientRepository = new ClientRepository();
