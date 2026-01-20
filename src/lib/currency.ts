import i18n from '../i18n';

export const toCents = (value: number) => Math.round(value * 100);

export const fromCents = (value: number) => value / 100;

export const formatCurrency = (amountInCents: number, currency: string = 'CAD') => {
  const language = i18n.language || 'en';
  // Map 'fr' to 'fr-CA' and 'en' to 'en-CA' for currency formatting defaults in Canada context
  const locale = language.startsWith('fr') ? 'fr-CA' : 'en-CA';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
};
