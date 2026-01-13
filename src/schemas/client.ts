import { z } from 'zod';
import { CANADIAN_PROVINCES, PropertySchema, getPropertySchema } from './property';
import { TFunction } from 'i18next';

export const getClientSchema = (t: TFunction) => z.object({
  name: z.string().min(1, t('validation.nameRequired')),
  email: z
    .string()
    .trim()
    .email(t('validation.invalidEmail'))
    .optional()
    .or(z.literal('')),
  type: z.enum(['individual', 'business']).default('individual'),
  preferred_language: z.enum(['en', 'fr']).default('en'),
});

export const getClientUpdateSchema = (t: TFunction) => getClientSchema(t).partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: t('validation.updateRequired') },
);

// Fallback for static analysis or where t is not available immediately (though discouraged)
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

export const getClientAndPropertySchema = (t: TFunction) => getClientSchema(t).merge(
  getPropertySchema(t).omit({ client_id: true }),
);

export const ClientAndPropertySchema = ClientSchema.merge(
  PropertySchema.omit({ client_id: true }),
);

export type ClientCreateInput = z.infer<typeof ClientSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;

export { CANADIAN_PROVINCES };
