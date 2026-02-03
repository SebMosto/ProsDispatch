import { z } from 'zod';

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

export const PropertySchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  address_line1: z.string().min(5, 'Address too short'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City required'),
  province: z.enum(CANADIAN_PROVINCES),
  postal_code: z
    .string()
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Invalid Format (A1A 1A1)'),
  country: z.string().default('CA'),
  nickname: z.string().optional(),
});

export const PropertyUpdateSchema = PropertySchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'At least one field is required to update a property' },
);

export type PropertyCreateInput = z.infer<typeof PropertySchema>;
export type PropertyUpdateInput = z.infer<typeof PropertyUpdateSchema>;
