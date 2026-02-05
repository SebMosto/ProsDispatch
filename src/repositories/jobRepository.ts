import { reportApiOnline } from '../lib/network';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { JobCreateInput, JobStatus, JobUpdateInput } from '../schemas/mvp1/job';
import type { Repository, RepositoryListParams, RepositoryResult } from './base';
import { BaseRepository } from './base';

export type JobRecord = Database['public']['Tables']['jobs']['Row'];
export type JobListParams = RepositoryListParams & {
  status?: JobStatus[];
  includeDeleted?: boolean;
};

const normalizeDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
};

export class JobRepository
  extends BaseRepository
  implements Repository<JobRecord, JobCreateInput, JobUpdateInput, JobListParams>
{
  async list(params?: JobListParams): Promise<RepositoryResult<JobRecord[]>> {
    const { status, includeDeleted } = params ?? {};

    const query = this.client
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (status?.length) {
      query.in('status', status);
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

  async get(id: string): Promise<RepositoryResult<JobRecord>> {
    const { data, error } = await this.client
      .from('jobs')
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

  async create(input: JobCreateInput): Promise<RepositoryResult<JobRecord>> {
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
          message: 'User must be authenticated to create a job',
          reason: 'validation',
        },
      };
    }

    const payload = {
      ...input,
      contractor_id: authData.user.id,
      description: input.description ?? null,
      service_date: normalizeDate(input.service_date),
    } satisfies Database['public']['Tables']['jobs']['Insert'];

    const { data, error } = await this.client
      .from('jobs')
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

  async update(id: string, input: JobUpdateInput): Promise<RepositoryResult<JobRecord>> {
    const payload = {
      ...input,
      description: input.description ?? null,
      service_date: normalizeDate(input.service_date ?? undefined),
    } satisfies Database['public']['Tables']['jobs']['Update'];

    const { data, error } = await this.client
      .from('jobs')
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
      .from('jobs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data: null };
  }

  async getByToken(token: string): Promise<RepositoryResult<JobRecord>> {
    const { data, error } = await this.client
      .rpc('get_job_by_token', { access_token: token })
      .maybeSingle();

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data };
  }
}

export const jobRepository = new JobRepository();
