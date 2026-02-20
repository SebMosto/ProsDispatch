import type { Database } from '../types/database.types';
import { BaseRepository, type RepositoryResult } from './base';
import { reportApiOnline } from '../lib/network';

export interface JobPublicDetails {
  id: string;
  title: string;
  description: string | null;
  status: Database['public']['Enums']['job_status'];
  service_date: string | null;
  client_name: string | null;
  property_address: string | null;
  contractor_name: string;
  contractor_email?: string;
}

export class PublicRepository extends BaseRepository {
  async getJobByToken(token: string): Promise<RepositoryResult<JobPublicDetails>> {
    const { data, error } = await this.client.functions.invoke('get-job-by-token', {
      body: { token },
    });

    if (error) {
      return { data: null, error: this.toRepositoryError(error) ?? undefined };
    }

    reportApiOnline();
    return { data: data as JobPublicDetails };
  }

  async respondToInvite(token: string, response: 'approve' | 'decline'): Promise<RepositoryResult<void>> {
    const { error } = await this.client.functions.invoke('respond-to-job-invite', {
      body: { token, response },
    });

    if (error) {
      return { data: null, error: this.toRepositoryError(error) ?? undefined };
    }

    reportApiOnline();
    return { data: undefined };
  }
}

export const publicRepository = new PublicRepository();
