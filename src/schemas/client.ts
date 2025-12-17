import { z } from 'zod';

// Full list for DB validity, UI can filter to ['QC', 'ON']
export const CANADIAN_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
] as const;

export const ClientSchema = z.object({
  type: z.enum(['individual', 'business']).default('individual'),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  preferred_language: z.enum(['en', 'fr']).default('en'),
});

export const PropertySchema = z.object({
  address_line1: z.string().min(5, "Address too short"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City required"),
  province: z.enum(CANADIAN_PROVINCES), 
  postal_code: z.string().regex(
    /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 
    "Invalid Format (A1A 1A1)"
  ),
  nickname: z.string().optional(),
});

// Composite for "Add New Client & Property" flow
export const ClientAndPropertySchema = ClientSchema.merge(PropertySchema);
