import { z } from 'zod';
import type { Database } from '../../types/database.types';
import { TFunction } from 'i18next';

export const JOB_STATUSES = [
  'draft',
  'sent',
  'approved',
  'in_progress',
  'completed',
  'invoiced',
  'paid',
  'archived',
] as const;

/**
 * getJobCreateSchema - Schema for creating a new job
 *
 * Required fields:
 * - client_id: UUID of the client
 * - property_id: UUID of the property
 * - title: Short label for the job (e.g., "Kitchen faucet repair")
 *
 * Optional fields:
 * - description: Detailed description of the work
 * - service_date: Scheduled date for the service
 * - status: Job status (defaults to 'draft')
 */
export const getJobCreateSchema = (t: TFunction) => z.object({
  client_id: z.string().uuid(t('validation.clientId')),
  property_id: z.string().uuid(t('validation.propertyId')),
  title: z
    .string()
    .min(2, t('validation.titleMin'))
    .max(80, t('validation.titleMax')),
  description: z
    .string()
    .max(2000, t('validation.descriptionMax'))
    .optional(),
  service_date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.serviceDate')),
      z.date(),
    ])
    .optional(),
  status: z.enum(JOB_STATUSES).default('draft'),
});

/**
 * getJobUpdateSchema - Schema for updating job details
 *
 * Note: Status changes must be handled via advanceJobStatus() helper only.
 * This schema is for editing title, description, service_date, and related fields.
 * All fields are optional, but description and service_date can be set to null to clear them.
 * At least one field must be provided for a valid update.
 */
export const getJobUpdateSchema = (t: TFunction) => z
  .object({
    client_id: z.string().uuid(t('validation.clientId')).optional(),
    property_id: z.string().uuid(t('validation.propertyId')).optional(),
    title: z
      .string()
      .min(2, t('validation.titleMin'))
      .max(80, t('validation.titleMax'))
      .optional(),
    description: z
      .union([z.string().max(2000, t('validation.descriptionMax')), z.null()])
      .optional(),
    service_date: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.serviceDate')),
        z.date(),
        z.null(),
      ])
      .optional(),
    status: z.enum(JOB_STATUSES).optional(),
  })
  .refine(
    (data) => {
      return Object.values(data).some((value) => value !== undefined);
    },
    {
      message: t('validation.updateRequired'),
    },
  );

// Type exports for TypeScript inference
export type JobCreateInput = z.infer<ReturnType<typeof getJobCreateSchema>>;
export type JobUpdateInput = z.infer<ReturnType<typeof getJobUpdateSchema>>;
export type JobStatus = (typeof JOB_STATUSES)[number];

type JobRecord = Database['public']['Tables']['jobs']['Row'];

export type JobWithDetails = JobRecord & {
  clients: { name: string } | null;
  properties: { address_line1: string; city: string } | null;
};

export const JobWithDetailsSchema = z
  .object({
    clients: z.object({ name: z.string() }).nullable(),
    properties: z.object({ address_line1: z.string(), city: z.string() }).nullable(),
  })
  .passthrough();
