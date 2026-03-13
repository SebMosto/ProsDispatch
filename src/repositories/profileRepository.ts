import { reportApiOnline } from '../lib/network';
import type { ProfileUpdateInput } from '../schemas/profile';
import type { Database } from '../types/database.types';
import type { RepositoryResult } from './base';
import { BaseRepository } from './base';

export type ProfileRecord = Database['public']['Tables']['profiles']['Row'];

export interface ProfileFormData {
  full_name: string | null;
  business_name: string | null;
}

export interface ProfileStripeConnectData {
  stripe_connect_id: string | null;
  stripe_connect_onboarded: boolean;
}

export class ProfileRepository extends BaseRepository {
  async get(id: string): Promise<RepositoryResult<ProfileFormData>> {
    const { data, error } = await this.client
      .from('profiles')
      .select('full_name, business_name')
      .eq('id', id)
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data };
  }

  async getStripeConnect(id: string): Promise<RepositoryResult<ProfileStripeConnectData>> {
    const { data, error } = await this.client
      .from('profiles')
      .select('stripe_connect_id, stripe_connect_onboarded')
      .eq('id', id)
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data };
  }

  async update(id: string, input: ProfileUpdateInput): Promise<RepositoryResult<ProfileFormData>> {
    const payload = {
      full_name: input.full_name,
      business_name: input.business_name,
    } satisfies Database['public']['Tables']['profiles']['Update'];

    const { data, error } = await this.client
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select('full_name, business_name')
      .single();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data };
  }
}

export const profileRepository = new ProfileRepository();
