import { z } from 'zod';
import { CANADIAN_PROVINCES, PropertySchema } from './property';

export const ClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  type: z.enum(['individual', 'business']).default('individual'),
  preferred_language: z.enum(['en', 'fr']).default('en'),
});

export const ClientUpdateSchema = ClientSchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'At least one field is required to update a client' },
);

export const ClientAndPropertySchema = ClientSchema.merge(
  PropertySchema.omit({ client_id: true }),
);

export type ClientCreateInput = z.infer<typeof ClientSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;

export { CANADIAN_PROVINCES };
