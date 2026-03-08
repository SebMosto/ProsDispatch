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

export const getPropertySchema = (t: TFunction) => z.object({
  client_id: z.string(requiredOptions(t, 'validation.clientIdInvalid'))
    .uuid(t('validation.clientIdInvalid')),
  address_line1: z.string(requiredOptions(t, 'validation.required'))
    .min(5, t('validation.addressTooShort')),
  address_line2: z.string().optional(),
  city: z.string(requiredOptions(t, 'validation.cityRequired'))
    .min(2, t('validation.cityRequired')),
  province: z.enum(CANADIAN_PROVINCES, requiredOptions(t, 'validation.required')),
  postal_code: z
    .string(requiredOptions(t, 'validation.required'))
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, t('validation.invalidPostalCode')),
  country: z.string().default('CA'),
  nickname: z.string().optional(),
});

export const getPropertyUpdateSchema = (t: TFunction) => getPropertySchema(t).partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: t('validation.propertyUpdateRequired') }
);

// STATIC SCHEMAS FOR TYPE INFERENCE ONLY
// DO NOT USE FOR VALIDATION
export const PropertySchema = z.object({
  client_id: z.string().uuid(),
  address_line1: z.string().min(5),
  address_line2: z.string().optional(),
  city: z.string().min(2),
  province: z.enum(CANADIAN_PROVINCES),
  postal_code: z
    .string()
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/),
  country: z.string().default('CA'),
  nickname: z.string().optional(),
});

export const PropertyUpdateSchema = PropertySchema.partial();

export type PropertyCreateInput = z.input<typeof PropertySchema>;
export type PropertyUpdateInput = z.input<typeof PropertyUpdateSchema>;
