import { z } from 'zod';
import { Constants } from '../types/database.types';

export const JOB_STATUSES = Constants.public.Enums.job_status;

const JobStatusSchema = z.enum(JOB_STATUSES);

const ServiceDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date')
  .optional()
  .nullable();

const DescriptionSchema = z
  .string()
  .max(2000, 'Description must be 2000 characters or fewer')
  .optional()
  .nullable();

const TitleSchema = z
  .string()
  .min(2, 'Title must be at least 2 characters')
  .max(80, 'Title must be 80 characters or fewer');

const UuidSchema = (fieldName: string) =>
  z.string().uuid(`${fieldName} must be a valid UUID`);

export const JobCreateSchema = z.object({
  title: TitleSchema,
  description: DescriptionSchema,
  status: JobStatusSchema.default('draft'),
  service_date: ServiceDateSchema,
  client_id: UuidSchema('Client ID'),
  property_id: UuidSchema('Property ID'),
  contractor_id: UuidSchema('Contractor ID'),
});

export const JobUpdateSchema = z
  .object({
    title: TitleSchema.optional(),
    description: DescriptionSchema,
    status: JobStatusSchema.optional(),
    service_date: ServiceDateSchema,
    client_id: UuidSchema('Client ID').optional(),
    property_id: UuidSchema('Property ID').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update a job',
  });
