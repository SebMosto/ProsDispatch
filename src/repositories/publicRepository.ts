import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { reportApiOffline, reportApiOnline } from '../lib/network';
import type { RepositoryResult } from './base';

export interface PublicJobDetails {
  job: {
    id: string;
    title: string;
    description: string | null;
    service_date: string | null;
    status: Database['public']['Enums']['job_status'];
    created_at: string;
    updated_at: string;
  };
  contractor: {
    business_name: string;
  };
  property: {
    address_line1: string;
    city: string;
    province: string;
    postal_code: string;
  };
  client: {
    name: string;
  };
  tokenStatus?: string;
}

export class PublicRepository {
  private client = supabase;

  async getJobByToken(token: string): Promise<RepositoryResult<PublicJobDetails>> {
    const { data, error } = await this.client.functions.invoke<PublicJobDetails>('get-job-by-token', {
      body: { token },
    });

    if (error) {
      reportApiOffline();
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
    return { data: data ?? null };
  }

  async respondToInvite(token: string, action: 'approve' | 'decline'): Promise<RepositoryResult<void>> {
    const { error } = await this.client.functions.invoke('respond-to-job-invite', {
      body: { token, action },
    });

    if (error) {
      reportApiOffline();
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
    return { data: null };
  }
}

export const publicRepository = new PublicRepository();
