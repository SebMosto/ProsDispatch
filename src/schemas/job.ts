import { z } from 'zod';
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
 * JobCreateSchema - Schema for creating a new job
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
export const getJobCreateSchema = (t?: TFunction) => z.object({
  client_id: z.string().uuid(t ? t('validation.clientIdInvalid') : 'validation.clientIdInvalid'),
  property_id: z.string().uuid(t ? t('validation.propertyIdInvalid') : 'validation.propertyIdInvalid'),
  title: z
    .string()
    .min(2, t ? t('validation.titleRequired') : 'validation.titleRequired')
    .max(80, t ? t('validation.titleTooLong') : 'validation.titleTooLong'),
  description: z
    .string()
    .max(2000, t ? t('validation.descriptionTooLong') : 'validation.descriptionTooLong')
    .optional(),
  service_date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t ? t('validation.invalidDate') : 'validation.invalidDate'),
      z.date(),
    ])
    .optional(),
  status: z.enum(JOB_STATUSES).default('draft'),
});

/**
 * JobUpdateSchema - Schema for updating job details
 * 
 * Note: Status changes must be handled via advanceJobStatus() helper only.
 * This schema is for editing title, description, service_date, and related fields.
 * All fields are optional, but description and service_date can be set to null to clear them.
 * At least one field must be provided for a valid update.
 */
export const getJobUpdateSchema = (t?: TFunction) => z
  .object({
    client_id: z.string().uuid(t ? t('validation.clientIdInvalid') : 'validation.clientIdInvalid').optional(),
    property_id: z.string().uuid(t ? t('validation.propertyIdInvalid') : 'validation.propertyIdInvalid').optional(),
    title: z
      .string()
      .min(2, t ? t('validation.titleRequired') : 'validation.titleRequired')
      .max(80, t ? t('validation.titleTooLong') : 'validation.titleTooLong')
      .optional(),
    description: z
      .union([z.string().max(2000, t ? t('validation.descriptionTooLong') : 'validation.descriptionTooLong'), z.null()])
      .optional(),
    service_date: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t ? t('validation.invalidDate') : 'validation.invalidDate'),
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
      message: t ? t('validation.jobUpdateRequired') : 'validation.jobUpdateRequired',
    },
  );

// Fallback for static analysis and Type Inference
// Using keys instead of t() to ensure valid strings if used without i18next
export const JobCreateSchema = getJobCreateSchema();
export const JobUpdateSchema = getJobUpdateSchema();

// Type exports for TypeScript inference
export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
export type JobStatus = (typeof JOB_STATUSES)[number];
