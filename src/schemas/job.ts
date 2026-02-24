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

const requiredOptions = (t?: TFunction, key?: string) => ({
  required_error: t ? t(key || 'validation.required') : (key || 'validation.required'),
  invalid_type_error: t ? t(key || 'validation.required') : (key || 'validation.required'),
});

/**
 * JobCreateSchema - Schema for creating a new job
 */
export const getJobCreateSchema = (t?: TFunction) => z.object({
  client_id: z.string(requiredOptions(t, 'validation.clientIdInvalid'))
    .uuid(t ? t('validation.clientIdInvalid') : 'validation.clientIdInvalid'),
  property_id: z.string(requiredOptions(t, 'validation.propertyIdInvalid'))
    .uuid(t ? t('validation.propertyIdInvalid') : 'validation.propertyIdInvalid'),
  title: z
    .string(requiredOptions(t, 'validation.titleRequired'))
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
export const JobCreateSchema = z.object({
  client_id: z.string({ required_error: 'validation.clientIdInvalid', invalid_type_error: 'validation.clientIdInvalid' })
    .uuid('validation.clientIdInvalid'),
  property_id: z.string({ required_error: 'validation.propertyIdInvalid', invalid_type_error: 'validation.propertyIdInvalid' })
    .uuid('validation.propertyIdInvalid'),
  title: z
    .string({ required_error: 'validation.titleRequired', invalid_type_error: 'validation.titleRequired' })
    .min(2, 'validation.titleRequired')
    .max(80, 'validation.titleTooLong'),
  description: z
    .string()
    .max(2000, 'validation.descriptionTooLong')
    .optional(),
  service_date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.invalidDate'),
      z.date(),
    ])
    .optional(),
  status: z.enum(JOB_STATUSES).default('draft'),
});

export const JobUpdateSchema = getJobUpdateSchema();

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
export type JobCreateInput = z.input<typeof JobCreateSchema>;
export type JobUpdateInput = z.input<typeof JobUpdateSchema>;
export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobRecord = z.output<typeof JobRecordSchema>;
