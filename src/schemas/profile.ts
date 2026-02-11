import { z } from 'zod';
import { TFunction } from 'i18next';

export const getProfileSchema = (t?: TFunction) => z.object({
  full_name: z.string()
  .max(100, t ? t('validation.nameTooLong') : 'validation.nameTooLong')
  .nullable()
  .transform(val => val || null),

  business_name: z.string({
    required_error: t ? t('validation.businessNameRequired') : 'validation.businessNameRequired',
    invalid_type_error: t ? t('validation.businessNameRequired') : 'validation.businessNameRequired',
  })
  .max(100, t ? t('validation.businessNameTooLong') : 'validation.businessNameTooLong')
  .nullable()
  .transform(val => val || ''),
});

export const ProfileSchema = z.object({
  full_name: z.string().max(100).nullable(),
  business_name: z.string().max(100).nullable(),
});

export type ProfileFormValues = z.infer<typeof ProfileSchema>;
