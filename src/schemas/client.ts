import { z } from 'zod';
import { CANADIAN_PROVINCES, PropertySchema, getPropertySchema } from './property';
import { TFunction } from 'i18next';

export const getClientSchema = (t?: TFunction) => z.object({
  name: z.string().min(1, t ? t('validation.nameRequired') : 'Name is required'),
  email: z
    .string()
    .trim()
    .email(t ? t('validation.invalidEmail') : 'Invalid email')
    .optional()
    .or(z.literal('')),
  type: z.enum(['individual', 'business']).default('individual'),
  preferred_language: z.enum(['en', 'fr']).default('en'),
});

export const getClientUpdateSchema = (t?: TFunction) => getClientSchema(t).partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: t ? t('validation.updateRequired') : 'At least one field is required to update a client' },
);

// Fallback for static analysis and Type Inference
export const ClientSchema = getClientSchema();
export const ClientUpdateSchema = getClientUpdateSchema();

export const getClientAndPropertySchema = (t?: TFunction) => getClientSchema(t).merge(
  getPropertySchema(t).omit({ client_id: true }),
);

export const ClientAndPropertySchema = getClientAndPropertySchema();

export type ClientCreateInput = z.infer<typeof ClientSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;

export { CANADIAN_PROVINCES };
