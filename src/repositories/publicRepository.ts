import { supabase } from '../lib/supabase';

export interface JobInviteData {
  token: string;
  status: 'pending' | 'viewed' | 'accepted' | 'declined';
  job: {
    title: string;
    description: string | null;
    service_date: string | null;
    status: string;
  };
  property: {
    address_line1: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  };
  contractor: {
    business_name: string;
    full_name: string | null;
  };
  client: {
    name: string;
  };
}

export class PublicRepository {
  static async getJobByToken(token: string): Promise<JobInviteData> {
    const { data, error } = await supabase.functions.invoke('get-job-by-token', {
      body: { token },
      method: 'POST',
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return data;
  }

  static async respondToInvite(token: string, action: 'accepted' | 'declined'): Promise<{ success: boolean }> {
    const { data, error } = await supabase.functions.invoke('respond-to-job-invite', {
      body: { token, action },
      method: 'POST',
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return data;
  }
}
