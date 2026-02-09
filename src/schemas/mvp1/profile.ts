import { z } from 'zod';
import { TFunction } from 'i18next';

export const getProfileSchema = (t: TFunction) => z.object({
  full_name: z.string().min(1, { message: t('profile.validation.name_required') }),
  business_name: z.string().optional(),
});

export type ProfileSchema = z.infer<ReturnType<typeof getProfileSchema>>;
