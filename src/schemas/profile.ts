import { z } from 'zod';
import { TFunction } from 'i18next';

const requiredOptions = (t?: TFunction, key?: string) => ({
  required_error: t ? t(key || 'validation.required') : (key || 'validation.required'),
  invalid_type_error: t ? t('validation.invalidType') : 'validation.invalidType',
});

/**
 * ProfileUpdateSchema - Schema for updating user profile
 */
export const getProfileUpdateSchema = (t?: TFunction) => z.object({
  full_name: z
    .string(requiredOptions(t, 'validation.nameRequired'))
    .max(100, t ? t('validation.nameTooLong') : 'validation.nameTooLong')
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
  business_name: z
    .string(requiredOptions(t, 'validation.businessNameRequired'))
    .max(100, t ? t('validation.businessNameTooLong') : 'validation.businessNameTooLong')
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
});

// Fallback for static analysis and Type Inference
export const ProfileUpdateSchema = z.object({
  full_name: z
    .string({ required_error: 'validation.nameRequired', invalid_type_error: 'validation.nameRequired' })
    .min(1, 'validation.nameRequired')
    .max(100, 'validation.nameTooLong')
    .nullable()
    .optional(),
  business_name: z
    .string({ required_error: 'validation.businessNameRequired', invalid_type_error: 'validation.businessNameRequired' })
    .min(1, 'validation.businessNameRequired')
    .max(100, 'validation.businessNameTooLong')
    .nullable()
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
