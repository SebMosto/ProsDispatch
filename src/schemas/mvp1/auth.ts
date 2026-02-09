import { z } from 'zod';
import { TFunction } from 'i18next';

export const getLoginSchema = (t: TFunction) => z.object({
  email: z.string().email({ message: t('auth.validation.email_invalid') }),
  password: z.string().min(6, { message: t('auth.validation.password_min') }),
});

export const getRegisterSchema = (t: TFunction) => z.object({
  email: z.string().email({ message: t('auth.validation.email_invalid') }),
  password: z.string().min(6, { message: t('auth.validation.password_min') }),
  full_name: z.string().min(1, { message: t('auth.validation.name_required') }),
  business_name: z.string().optional(),
});

export type LoginSchema = z.infer<ReturnType<typeof getLoginSchema>>;
export type RegisterSchema = z.infer<ReturnType<typeof getRegisterSchema>>;
