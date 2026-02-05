import { reportApiOnline } from '../lib/network';
import { supabase } from '../lib/supabase';
import type { PropertyCreateInput, PropertyUpdateInput } from '../schemas/mvp1/property';
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
  async list(params?: PropertyListParams): Promise<RepositoryResult<PropertyRecord[]>> {
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

    const { data, error } = await query;
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

  async create(input: PropertyCreateInput): Promise<RepositoryResult<PropertyRecord>> {
    const { data: authData, error: authError } = await supabase.auth.getUser();

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
          message: 'User must be authenticated to create a property',
          reason: 'validation',
        },
      };
    }

    const payload = {
      contractor_id: authData.user.id,
      client_id: input.client_id,
      address_line1: input.address_line1,
      address_line2: input.address_line2 ?? null,
      city: input.city,
      province: input.province,
      postal_code: input.postal_code,
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
    const { country: _country, ...rest } = input;
    void _country;
    const payload = {
      ...rest,
      address_line2: rest.address_line2 ?? undefined,
      nickname: rest.nickname ?? undefined,
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
