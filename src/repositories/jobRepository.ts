import { reportApiOnline } from '../lib/network';
import { advanceJobStatus, type JobStatus } from '../lib/jobStatus';
import type { Database } from '../types/database.types';
import type { JobCreateInput, JobUpdateInput } from '../schemas/job';
import type { Repository, RepositoryListParams, RepositoryResult } from './base';
import { BaseRepository } from './base';

export type JobRecord = Database['public']['Tables']['jobs']['Row'];
export type JobListParams = RepositoryListParams & {
  status?: Database['public']['Enums']['job_status'][];
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
  private async requireUserId(): Promise<RepositoryResult<string>> {
    const { data, error } = await this.client.auth.getUser();

    if (error || !data?.user) {
      return {
        data: null,
        error: {
          message: 'User is not authenticated',
          status: 401,
          reason: 'validation',
          cause: error ?? undefined,
        },
      };
    }

    return { data: data.user.id };
  }

  private validateInitialStatus(status?: JobStatus | null): JobStatus {
    if (status && status !== 'draft') {
      return advanceJobStatus('draft', status);
    }

    return 'draft';
  }

  async list(params?: JobListParams): Promise<RepositoryResult<JobRecord[]>> {
    const { status, includeDeleted } = params ?? {};

    const auth = await this.requireUserId();
    if (auth.error || !auth.data) {
      return { data: null, error: auth.error };
    }

    const query = this.client
      .from('jobs')
      .select('*')
      .eq('contractor_id', auth.data)
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
    const auth = await this.requireUserId();
    if (auth.error || !auth.data) {
      return { data: null, error: auth.error };
    }

    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('contractor_id', auth.data)
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
    const auth = await this.requireUserId();
    if (auth.error || !auth.data) {
      return { data: null, error: auth.error };
    }

    if (input.contractor_id !== auth.data) {
      return {
        data: null,
        error: {
          message: 'Cannot create jobs for a different contractor',
          reason: 'validation',
          status: 403,
        },
      };
    }

    let status: JobStatus;
    try {
      status = this.validateInitialStatus(input.status);
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Invalid job status transition',
          reason: 'validation',
          cause: error,
        },
      };
    }

    const payload = {
      ...input,
      status,
      description: input.description ?? null,
      service_date: normalizeDate(input.service_date),
      contractor_id: auth.data,
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
    const auth = await this.requireUserId();
    if (auth.error || !auth.data) {
      return { data: null, error: auth.error };
    }

    const payload = {
      ...input,
      description: input.description ?? null,
      service_date: normalizeDate(input.service_date ?? undefined),
    } satisfies Database['public']['Tables']['jobs']['Update'];

    const { data, error } = await this.client
      .from('jobs')
      .update(payload)
      .eq('id', id)
      .eq('contractor_id', auth.data)
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
    const auth = await this.requireUserId();
    if (auth.error || !auth.data) {
      return { data: null, error: auth.error };
    }

    const { error } = await this.client
      .from('jobs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('contractor_id', auth.data);

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data: null };
  }
}

export const jobRepository = new JobRepository();
