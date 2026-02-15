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

const requiredOptions = (t: TFunction, key?: string) => ({
  required_error: t(key || 'validation.required'),
  invalid_type_error: t(key || 'validation.required'),
});

/**
 * JobCreateSchema - Schema for creating a new job
 */
export const getJobCreateSchema = (t: TFunction) => z.object({
  client_id: z.string(requiredOptions(t, 'validation.clientIdInvalid'))
    .uuid(t('validation.clientIdInvalid')),
  property_id: z.string(requiredOptions(t, 'validation.propertyIdInvalid'))
    .uuid(t('validation.propertyIdInvalid')),
  title: z
    .string(requiredOptions(t, 'validation.titleRequired'))
    .min(2, t('validation.titleRequired'))
    .max(80, t('validation.titleTooLong')),
  description: z
    .string()
    .max(2000, t('validation.descriptionTooLong'))
    .optional(),
  service_date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.invalidDate')),
      z.date(),
    ])
    .optional(),
  status: z.enum(JOB_STATUSES).default('draft'),
});

/**
 * JobUpdateSchema - Schema for updating job details
 */
export const getJobUpdateSchema = (t: TFunction) => z
  .object({
    client_id: z.string().uuid(t('validation.clientIdInvalid')).optional(),
    property_id: z.string().uuid(t('validation.propertyIdInvalid')).optional(),
    title: z
      .string()
      .min(2, t('validation.titleRequired'))
      .max(80, t('validation.titleTooLong'))
      .optional(),
    description: z
      .union([z.string().max(2000, t('validation.descriptionTooLong')), z.null()])
      .optional(),
    service_date: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.invalidDate')),
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
      message: t('validation.jobUpdateRequired'),
    },
  );

// STATIC SCHEMAS FOR TYPE INFERENCE ONLY
// DO NOT USE FOR VALIDATION
export const JobCreateSchema = z.object({
  client_id: z.string().uuid(),
  property_id: z.string().uuid(),
  title: z
    .string()
    .min(2)
    .max(80),
  description: z
    .string()
    .max(2000)
    .optional(),
  service_date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.date(),
    ])
    .optional(),
  status: z.enum(JOB_STATUSES).default('draft'),
});

export const JobUpdateSchema = JobCreateSchema.partial();

/**
 * JobRecordSchema - Schema for validating job records from database
 * Used to validate data returned by RPCs that return Json type
 */
export const JobRecordSchema = z.object({
  id: z.string().uuid(),
  contractor_id: z.string().uuid(),
  client_id: z.string().uuid(),
  property_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  service_date: z.string().nullable(),
  status: z.enum(JOB_STATUSES),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

// Type exports for TypeScript inference
export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobRecord = z.infer<typeof JobRecordSchema>;
