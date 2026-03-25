import { reportApiOnline } from '../lib/network';
import type { PropertyCreateInput, PropertyUpdateInput } from '../schemas/property';
import type { Database } from '../types/database.types';
import type { Repository, RepositoryListParams, RepositoryResult } from './base';
import { BaseRepository } from './base';

export type PropertyRecord = Database['public']['Tables']['properties']['Row'];
export type PropertyListParams = RepositoryListParams & {
  clientIds?: string[];
  clientId?: string;
  includeDeleted?: boolean;
};

export class PropertyRepository
  extends BaseRepository
  implements Repository<PropertyRecord, PropertyCreateInput, PropertyUpdateInput, PropertyListParams>
{
  async list(params?: PropertyListParams, signal?: AbortSignal): Promise<RepositoryResult<PropertyRecord[]>> {
    const { clientIds, clientId, includeDeleted } = params ?? {};

    const query = this.client
      .from('properties')
      .select('*')
      .order('created_at', { ascending: true });

    if (clientIds?.length) {
      query.in('client_id', clientIds);
    }

    if (clientId) {
      query.eq('client_id', clientId);
    }

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

  async get(id: string): Promise<RepositoryResult<PropertyRecord>> {
    const { data, error } = await this.client
      .from('properties')
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

  async create(input: PropertyCreateInput, contractorId?: string): Promise<RepositoryResult<PropertyRecord>> {
    if (!contractorId) {
      const { data: authData, error: authError } = await this.client.auth.getUser();
      if (authError || !authData.user) {
        return {
          data: null,
          error: {
            message: authError?.message || 'User must be authenticated to create a property',
            reason: 'validation',
          },
        };
      }
      contractorId = authData.user.id;
    }

    const payload = {
      contractor_id: contractorId,
      client_id: input.client_id,
      address_line1: input.address_line1,
      address_line2: input.address_line2 ?? null,
      city: input.city,
      province: input.province,
      postal_code: input.postal_code,
      country: input.country ?? 'CA',
      nickname: input.nickname ?? null,
    } satisfies Database['public']['Tables']['properties']['Insert'];

    const { data, error } = await this.client
      .from('properties')
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

  async update(id: string, input: PropertyUpdateInput): Promise<RepositoryResult<PropertyRecord>> {
    const payload = {
      ...input,
      country: input.country ?? undefined,
      address_line2: input.address_line2 ?? undefined,
      nickname: input.nickname ?? undefined,
    } satisfies Database['public']['Tables']['properties']['Update'];

    const { data, error } = await this.client
      .from('properties')
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
      .from('properties')
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

export const propertyRepository = new PropertyRepository();
