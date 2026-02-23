import { reportApiOnline } from '../lib/network';
import { BaseRepository, type RepositoryResult } from './base';

export interface JobPublicDetails {
  id: string;
  title: string;
  description: string | null;
  service_date: string | null;
  status: string;
  client: { name: string };
  property: { address: string };
  token_status: 'active' | 'used' | 'expired';
}

export class PublicRepository extends BaseRepository {
  async getJobByToken(token: string): Promise<RepositoryResult<JobPublicDetails>> {
    const { data, error } = await this.client.functions.invoke('get-job-by-token', {
      body: { token },
    });

    const repositoryError = this.toRepositoryError(error);
    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    if (data && data.error) {
      return {
        data: null,
        error: {
          message: data.error,
          reason: 'server',
        },
      };
    }

    reportApiOnline();
    return { data };
  }

  async respondToInvite(
    token: string,
    action: 'approve' | 'decline'
  ): Promise<RepositoryResult<{ success: boolean; new_status: string }>> {
    const { data, error } = await this.client.functions.invoke('respond-to-job-invite', {
      body: { token, action },
    });

    const repositoryError = this.toRepositoryError(error);
    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    if (data && data.error) {
      return {
        data: null,
        error: {
          message: data.error,
          reason: 'server',
        },
      };
    }

    reportApiOnline();
    return { data };
  }
}

export const publicRepository = new PublicRepository();
