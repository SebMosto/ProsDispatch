import { z } from 'zod';
import { TFunction } from 'i18next';

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
  client_id: z.string().uuid(t ? t('validation.clientIdInvalid') : 'validation.clientIdInvalid'),
  address_line1: z.string().min(5, t ? t('validation.addressTooShort') : 'validation.addressTooShort'),
  address_line2: z.string().optional(),
  city: z.string().min(2, t ? t('validation.cityRequired') : 'validation.cityRequired'),
  province: z.enum(CANADIAN_PROVINCES),
  postal_code: z
    .string()
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
  client_id: z.string().uuid('validation.clientIdInvalid'),
  address_line1: z.string().min(5, 'validation.addressTooShort'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'validation.cityRequired'),
  province: z.enum(CANADIAN_PROVINCES),
  postal_code: z
    .string()
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
