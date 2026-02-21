import { BaseRepository, type RepositoryResult } from './base';
import { reportApiOnline } from '../lib/network';

export type JobInviteDetails = {
  id: string;
  title: string;
  description: string | null;
  service_date: string | null;
  status: string;
  client_name: string;
  property_address: string;
  contractor_business_name: string | null;
  contractor_name: string | null;
};

export class PublicRepository extends BaseRepository {
  async getJobByToken(token: string): Promise<RepositoryResult<JobInviteDetails>> {
    const { data, error } = await this.client.rpc('get_job_by_token', {
      token_input: token,
    });

    const repositoryError = this.toRepositoryError(error);
    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data: data as unknown as JobInviteDetails };
  }

  async respondToInvite(token: string, action: 'approve' | 'decline'): Promise<RepositoryResult<void>> {
    const { error } = await this.client.functions.invoke('respond-to-job-invite', {
      body: { token, action },
    });

    if (error) {
       return {
         data: null,
         error: {
           message: error.message,
           reason: 'server',
           cause: error
         }
       };
    }

    reportApiOnline();
    return { data: undefined };
  }
}

export const publicRepository = new PublicRepository();
