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
  client_id: z.string().uuid(t ? t('validation.clientIdInvalid') : 'Invalid client ID'),
  address_line1: z.string().min(5, t ? t('validation.addressTooShort') : 'Address too short'),
  address_line2: z.string().optional(),
  city: z.string().min(2, t ? t('validation.cityRequired') : 'City required'),
  province: z.enum(CANADIAN_PROVINCES),
  postal_code: z
    .string()
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, t ? t('validation.invalidPostalCode') : 'Invalid Format (A1A 1A1)'),
  country: z.string().default('CA'),
  nickname: z.string().optional(),
});

export const getPropertyUpdateSchema = (t?: TFunction) => getPropertySchema(t).partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: t ? t('validation.propertyUpdateRequired') : 'At least one field is required to update a property' },
);

// Fallback for static analysis
export const PropertySchema = getPropertySchema();
export const PropertyUpdateSchema = getPropertyUpdateSchema();

export type PropertyCreateInput = z.infer<typeof PropertySchema>;
export type PropertyUpdateInput = z.infer<typeof PropertyUpdateSchema>;
