import { z } from 'zod';

export const JOB_STATUSES = [
  'draft',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
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
export const JobCreateSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  property_id: z.string().uuid('Invalid property ID'),
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(80, 'Title must not exceed 80 characters'),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  service_date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Service date must be in YYYY-MM-DD format'),
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
export const JobUpdateSchema = z
  .object({
    client_id: z.string().uuid('Client ID must be a valid UUID').optional(),
    property_id: z.string().uuid('Property ID must be a valid UUID').optional(),
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(80, 'Title must not exceed 80 characters')
      .optional(),
    description: z
      .union([z.string().max(2000, 'Description must not exceed 2000 characters'), z.null()])
      .optional(),
    service_date: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Service date must be in YYYY-MM-DD format'),
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
      message: 'At least one field is required to update a job',
    },
  );

// Type exports for TypeScript inference
export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
export type JobStatus = (typeof JOB_STATUSES)[number];
