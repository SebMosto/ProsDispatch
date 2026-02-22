import { z } from 'zod';
import { CANADIAN_PROVINCES, getPropertySchema } from './property';
import { TFunction } from 'i18next';
import { requiredOptions } from './helpers';

export const getClientSchema = (t?: TFunction) => z.object({
  name: z.string(requiredOptions(t, 'validation.nameRequired'))
    .min(1, t ? t('validation.nameRequired') : 'validation.nameRequired'),
  email: z
    .string({
      invalid_type_error: t ? t('validation.invalidEmail') : 'validation.invalidEmail',
    })
    .trim()
    .email(t ? t('validation.invalidEmail') : 'validation.invalidEmail')
    .optional()
    .or(z.literal('')),
  type: z.enum(['individual', 'business'], requiredOptions(t, 'validation.required'))
    .default('individual'),
  preferred_language: z.enum(['en', 'fr'], requiredOptions(t, 'validation.required'))
    .default('en'),
});

export const getClientUpdateSchema = (t?: TFunction) => getClientSchema(t).partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: t ? t('validation.updateRequired') : 'validation.updateRequired' },
);

// Fallback for static analysis or where t is not available immediately
// We use keys or default Zod messages to avoid hardcoded English strings
export const ClientSchema = z.object({
  name: z.string({
    required_error: 'validation.nameRequired',
    invalid_type_error: 'validation.nameRequired',
  }).min(1, 'validation.nameRequired'),
  email: z
    .string({
      invalid_type_error: 'validation.invalidEmail',
    })
    .trim()
    .email('validation.invalidEmail')
    .optional()
    .or(z.literal('')),
  type: z.enum(['individual', 'business'], {
    required_error: 'validation.required',
    invalid_type_error: 'validation.required',
  }).default('individual'),
  preferred_language: z.enum(['en', 'fr'], {
    required_error: 'validation.required',
    invalid_type_error: 'validation.required',
  }).default('en'),
});

export const ClientUpdateSchema = ClientSchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'validation.updateRequired' },
);

export const getClientAndPropertySchema = (t?: TFunction) => getClientSchema(t).merge(
  getPropertySchema(t).omit({ client_id: true }),
);

export const ClientAndPropertySchema = getClientAndPropertySchema();

export type ClientCreateInput = z.infer<typeof ClientSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;

export { CANADIAN_PROVINCES };
