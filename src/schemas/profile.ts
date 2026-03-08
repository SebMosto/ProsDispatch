import { z } from 'zod';
import { TFunction } from 'i18next';
import { requiredOptions } from './helpers';

/**
 * ProfileUpdateSchema - Schema for updating user profile
 */
export const getProfileUpdateSchema = (t: TFunction) => z.object({
  full_name: z
    .string(requiredOptions(t, 'validation.nameRequired'))
    .max(100, t('validation.nameTooLong'))
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
  business_name: z
    .string(requiredOptions(t, 'validation.businessNameRequired'))
    .max(100, t('validation.businessNameTooLong'))
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
});

// STATIC SCHEMAS FOR TYPE INFERENCE ONLY
// DO NOT USE FOR VALIDATION
export const ProfileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1)
    .max(100)
    .nullable()
    .optional(),
  business_name: z
    .string()
    .min(1)
    .max(100)
    .nullable()
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
