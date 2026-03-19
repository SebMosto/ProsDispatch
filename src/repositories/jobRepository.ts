import { reportApiOnline } from '../lib/network';
import type { Database } from '../types/database.types';
import { JobRecordSchema, type JobCreateInput, type JobRecord, type JobStatus, type JobUpdateInput } from '../schemas/job';
import type { Repository, RepositoryListParams, RepositoryResult, RepositoryError } from './base';
import { BaseRepository } from './base';

export type { JobRecord } from '../schemas/job';
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
  /**
   * Normalizes job fields for create/update operations.
   * Ensures description is null if undefined and service_date is properly formatted.
   */
  private normalizeJobFields(fields: {
    description?: string | null;
    service_date?: string | Date | null;
  }) {
    return {
      description: fields.description ?? null,
      service_date: normalizeDate(fields.service_date),
    };
  }

  async listByClient(clientId: string): Promise<RepositoryResult<JobRecord[]>> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError ?? undefined };
    }

    reportApiOnline();
    const parsedData = (data ?? []).map((record) => JobRecordSchema.parse(record));
    return { data: parsedData };
  }

  async list(params?: JobListParams, signal?: AbortSignal): Promise<RepositoryResult<JobRecord[]>> {
    const { status, includeDeleted } = params ?? {};

    let query = this.client
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (status?.length) {
      query = query.in('status', status);
    }

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    if (signal) {
      query = query.abortSignal(signal);
    }

    const { data, error } = await query;
    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError ?? undefined };
    }

    reportApiOnline();
    // Parse each record with Zod schema to ensure type safety
    const parsedData = (data ?? []).map((record) => JobRecordSchema.parse(record));
    return { data: parsedData };
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
      return { data: null, error: repositoryError ?? undefined };
    }

    reportApiOnline();
    return { data: JobRecordSchema.parse(data) };
  }

  async create(input: JobCreateInput): Promise<RepositoryResult<JobRecord>> {
    const normalized = this.normalizeJobFields({
      description: input.description,
      service_date: input.service_date,
    });

    const { data, error } = await this.client.rpc('create_job', {
      client_id: input.client_id,
      property_id: input.property_id,
      title: input.title,
      description: normalized.description,
      service_date: normalized.service_date,
    });

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    // Validate the RPC response using Zod schema to ensure type safety
    const parseResult = JobRecordSchema.safeParse(data);
    
    if (!parseResult.success) {
      return {
        data: null,
        error: {
          message: 'Invalid data returned from create_job RPC',
          reason: 'validation',
          cause: parseResult.error.issues,
        } satisfies RepositoryError,
      };
    }

    reportApiOnline();
    return { data: parseResult.data };
  }

  async update(id: string, input: JobUpdateInput): Promise<RepositoryResult<JobRecord>> {
    // Handle status transition separately if present
    if (input.status) {
      const { error: transitionError } = await this.client.rpc('transition_job_state', {
        job_id: id,
        new_status: input.status,
      });

      if (transitionError) {
        return { data: null, error: this.toRepositoryError(transitionError) ?? undefined };
      }
    }

    // Handle other fields update if present
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _status, ...otherFields } = input;
    const hasOtherFields = Object.keys(otherFields).length > 0;

    if (hasOtherFields) {
      const { description, service_date, ...remainingFields } = otherFields;
      const normalized = this.normalizeJobFields({
        description,
        service_date,
      });

      const payload: Database['public']['Tables']['jobs']['Update'] = {
        ...remainingFields,
        ...normalized,
      };

      const { error: updateError } = await this.client
        .from('jobs')
        .update(payload)
        .eq('id', id);

      if (updateError) {
        return { data: null, error: this.toRepositoryError(updateError) ?? undefined };
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
      return { data: null, error: repositoryError ?? undefined };
    }

    reportApiOnline();
    return { data: null };
  }
}

export const jobRepository = new JobRepository();
