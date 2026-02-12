import { reportApiOnline } from '../lib/network';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { JobCreateInput, JobStatus, JobUpdateInput } from '../schemas/job';
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
    const { data, error } = await this.client.rpc('create_job', {
      client_id: input.client_id,
      property_id: input.property_id,
      title: input.title,
      description: input.description ?? null,
      service_date: normalizeDate(input.service_date),
    });

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    // The RPC returns Json, but we know it returns the job record structure
    return { data: data as unknown as JobRecord };
  }

  async update(id: string, input: JobUpdateInput): Promise<RepositoryResult<JobRecord>> {
    // Handle status transition separately if present
    if (input.status) {
      const { error: transitionError } = await this.client.rpc('transition_job_state', {
        job_id: id,
        new_status: input.status,
      });

      if (transitionError) {
        return { data: null, error: this.toRepositoryError(transitionError) };
      }
    }

    // Handle other fields update if present
    const { status: _status, ...otherFields } = input;
    const hasOtherFields = Object.keys(otherFields).length > 0;

    if (hasOtherFields) {
      const payload = {
        ...otherFields,
        description: otherFields.description ?? null,
        service_date: normalizeDate(otherFields.service_date ?? undefined),
      } satisfies Database['public']['Tables']['jobs']['Update'];

      const { error: updateError } = await this.client
        .from('jobs')
        .update(payload)
        .eq('id', id);

      if (updateError) {
        return { data: null, error: this.toRepositoryError(updateError) };
      }
    }

    // Always fetch the latest record to return consistent data
    return this.get(id);
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
}

export const jobRepository = new JobRepository();
