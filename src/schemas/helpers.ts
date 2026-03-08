import { TFunction } from 'i18next';

export const requiredOptions = (t?: TFunction, key?: string) => ({
  required_error: t ? t(key || 'validation.required') : (key || 'validation.required'),
  invalid_type_error: t ? t(key || 'validation.required') : (key || 'validation.required'),
});
