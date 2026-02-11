import { z } from 'zod';
import { TFunction } from 'i18next';

export const getProfileSchema = (t?: TFunction) => z.object({
  full_name: z.string({
    required_error: t ? t('validation.nameRequired') : 'validation.nameRequired',
    invalid_type_error: t ? t('validation.nameRequired') : 'validation.nameRequired',
  })
  .min(1, t ? t('validation.nameRequired') : 'validation.nameRequired')
  .max(100, t ? t('validation.nameTooLong') : 'validation.nameTooLong')
  .nullable()
  .transform(val => val || ''),

  business_name: z.string({
    required_error: t ? t('validation.businessNameRequired') : 'validation.businessNameRequired',
    invalid_type_error: t ? t('validation.businessNameRequired') : 'validation.businessNameRequired',
  })
  .max(100, t ? t('validation.businessNameTooLong') : 'validation.businessNameTooLong')
  .nullable()
  .transform(val => val || ''),
});

export type ProfileFormValues = z.input<ReturnType<typeof getProfileSchema>>;
