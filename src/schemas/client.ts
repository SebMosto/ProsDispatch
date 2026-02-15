import { z } from 'zod';
import { CANADIAN_PROVINCES, getPropertySchema } from './property';
import { TFunction } from 'i18next';

export const getClientSchema = (t: TFunction) => z.object({
  name: z.string({
    required_error: t('validation.nameRequired'),
    invalid_type_error: t('validation.nameRequired'),
  }).min(1, t('validation.nameRequired')),
  email: z
    .string({
      invalid_type_error: t('validation.invalidEmail'),
    })
    .trim()
    .email(t('validation.invalidEmail'))
    .optional()
    .or(z.literal('')),
  type: z.enum(['individual', 'business'], {
    required_error: t('validation.required'),
    invalid_type_error: t('validation.required'),
  }).default('individual'),
  preferred_language: z.enum(['en', 'fr'], {
    required_error: t('validation.required'),
    invalid_type_error: t('validation.required'),
  }).default('en'),
});

export const getClientUpdateSchema = (t: TFunction) => getClientSchema(t).partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: t('validation.updateRequired') }
);

// STATIC SCHEMAS FOR TYPE INFERENCE ONLY
// DO NOT USE FOR VALIDATION - MESSAGES ARE NOT LOCALIZED
export const ClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  type: z.enum(['individual', 'business']).default('individual'),
  preferred_language: z.enum(['en', 'fr']).default('en'),
});

export const ClientUpdateSchema = ClientSchema.partial();

export const getClientAndPropertySchema = (t: TFunction) => getClientSchema(t).merge(
  getPropertySchema(t).omit({ client_id: true }),
);

// For types only
export type ClientCreateInput = z.infer<typeof ClientSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;

export { CANADIAN_PROVINCES };
