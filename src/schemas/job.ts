import { z } from 'zod';

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
 */
export const JobCreateSchema = z.object({
  client_id: z.string().uuid("Invalid client ID"),
  property_id: z.string().uuid("Invalid property ID"),
  title: z.string()
    .min(2, "Title must be at least 2 characters")
    .max(80, "Title must not exceed 80 characters"),
  description: z.string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  service_date: z.union([
    z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Service date must be in YYYY-MM-DD format"
    ),
    z.date()
  ]).optional(),
});

/**
 * JobUpdateSchema - Schema for updating job details
 * 
 * Note: Status changes must be handled via advanceJobStatus() helper only.
 * This schema is for editing title, description, and service_date fields.
 */
export const JobUpdateSchema = z.object({
  title: z.string()
    .min(2, "Title must be at least 2 characters")
    .max(80, "Title must not exceed 80 characters")
    .optional(),
  description: z.string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  service_date: z.union([
    z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Service date must be in YYYY-MM-DD format"
    ),
    z.date(),
    z.null()
  ]).optional(),
});

// Type exports for TypeScript inference
export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
