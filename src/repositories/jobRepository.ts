import { reportApiOnline } from '../lib/network';
import type { Database } from '../types/database.types';
import { JobRecordSchema, type JobCreateInput, type JobRecord, type JobStatus, type JobUpdateInput } from '../schemas/job';
import type { Repository, RepositoryListParams, RepositoryResult } from './base';
import { BaseRepository } from './base';

export type { JobRecord, JobStatus, JobCreateInput, JobUpdateInput };
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
    const normalized = this.normalizeJobFields({
      description: input.description,
      service_date: input.service_date,
    });

    const { data, error } = await this.client.rpc('create_job', {
      client_id: input.client_id,
      property_id: input.property_id,
      title: input.title,
      ...normalized,
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
          reason: 'unknown',
          message: 'Invalid data returned from create_job RPC',
          cause: parseResult.error.issues,
        },
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

      const payload = {
        ...remainingFields,
        ...normalized,
      } satisfies Database['public']['Tables']['jobs']['Update'];

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
      return { data: null, error: repositoryError };
    }

    reportApiOnline();
    return { data: null };
  }

  async inviteHomeowner(jobId: string): Promise<RepositoryResult<{ token: string }>> {
    const { data, error } = await this.client.functions.invoke('invite-homeowner', {
      body: { jobId },
    });

    if (error) {
      return { data: null, error: this.toRepositoryError(error) ?? undefined };
    }

    if (data?.error) {
      return { data: null, error: { message: data.error, reason: 'server' } };
    }

    reportApiOnline();
    return { data };
  }

  async getJobByToken(token: string): Promise<RepositoryResult<JobWithInviteDetails>> {
    const { data, error } = await this.client.rpc('get_job_by_token', {
      token_input: token,
    });

    const repositoryError = this.toRepositoryError(error);

    if (repositoryError) {
      return { data: null, error: repositoryError };
    }

    if (!data) {
      return { data: null, error: { message: 'Invalid or expired token', reason: 'validation' } };
    }

    const job = data as unknown as JobWithInviteDetails;

    reportApiOnline();
    return { data: job };
  }

  async respondToInvite(token: string, action: 'approve' | 'decline'): Promise<RepositoryResult<void>> {
    const { data, error } = await this.client.functions.invoke('respond-to-job-invite', {
      body: { token, action },
    });

    if (error) {
      return { data: null, error: this.toRepositoryError(error) ?? undefined };
    }

    if (data?.error) {
      return { data: null, error: { message: data.error, reason: 'server' } };
    }

    reportApiOnline();
    return { data: null };
  }
}

export type JobWithInviteDetails = {
  id: string;
  title: string;
  description: string | null;
  service_date: string | null;
  status: JobStatus;
  contractor_id: string;
  client_name: string;
  property_address: string;
  contractor: {
    name: string | null;
    business_name: string | null;
    email: string;
  };
};

export const jobRepository = new JobRepository();
