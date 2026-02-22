import { z } from 'zod';
import { TFunction } from 'i18next';
import { requiredOptions } from './helpers';

// Full list for DB validity, UI can filter to ['QC', 'ON']
export const CANADIAN_PROVINCES = [
  'AB',
  'BC',
  'MB',
  'NB',
  'NL',
  'NS',
  'NT',
  'NU',
  'ON',
  'PE',
  'QC',
  'SK',
  'YT',
] as const;

export const getPropertySchema = (t?: TFunction) => z.object({
  client_id: z.string(requiredOptions(t, 'validation.clientIdInvalid'))
    .uuid(t ? t('validation.clientIdInvalid') : 'validation.clientIdInvalid'),
  address_line1: z.string(requiredOptions(t, 'validation.required'))
    .min(5, t ? t('validation.addressTooShort') : 'validation.addressTooShort'),
  address_line2: z.string().optional(),
  city: z.string(requiredOptions(t, 'validation.cityRequired'))
    .min(2, t ? t('validation.cityRequired') : 'validation.cityRequired'),
  province: z.enum(CANADIAN_PROVINCES, requiredOptions(t, 'validation.required')),
  postal_code: z
    .string(requiredOptions(t, 'validation.required'))
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, t ? t('validation.invalidPostalCode') : 'validation.invalidPostalCode'),
  country: z.string().default('CA'),
  nickname: z.string().optional(),
});

export const getPropertyUpdateSchema = (t?: TFunction) => getPropertySchema(t).partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: t ? t('validation.propertyUpdateRequired') : 'validation.propertyUpdateRequired' },
);

// Fallback for static analysis
export const PropertySchema = z.object({
  client_id: z.string({ required_error: 'validation.clientIdInvalid', invalid_type_error: 'validation.clientIdInvalid' })
    .uuid('validation.clientIdInvalid'),
  address_line1: z.string({ required_error: 'validation.required', invalid_type_error: 'validation.required' })
    .min(5, 'validation.addressTooShort'),
  address_line2: z.string().optional(),
  city: z.string({ required_error: 'validation.cityRequired', invalid_type_error: 'validation.cityRequired' })
    .min(2, 'validation.cityRequired'),
  province: z.enum(CANADIAN_PROVINCES, { required_error: 'validation.required', invalid_type_error: 'validation.required' }),
  postal_code: z
    .string({ required_error: 'validation.required', invalid_type_error: 'validation.required' })
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'validation.invalidPostalCode'),
  country: z.string().default('CA'),
  nickname: z.string().optional(),
});

export const PropertyUpdateSchema = PropertySchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'validation.propertyUpdateRequired' },
);

export type PropertyCreateInput = z.infer<typeof PropertySchema>;
export type PropertyUpdateInput = z.infer<typeof PropertyUpdateSchema>;
