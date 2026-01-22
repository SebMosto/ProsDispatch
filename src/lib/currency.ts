import i18n from '../i18n';

export const toCents = (value: number) => Math.round(value * 100);

export const fromCents = (value: number) => value / 100;

// Cache for Intl.NumberFormat instances to improve performance
const formatters = new Map<string, Intl.NumberFormat>();

export const formatCurrency = (amountInCents: number, currency: string = 'CAD') => {
  const language = i18n.language || 'en';
  // Map 'fr' to 'fr-CA' and 'en' to 'en-CA' for currency formatting defaults in Canada context
  const locale = language.startsWith('fr') ? 'fr-CA' : 'en-CA';
  const key = `${locale}-${currency}`;

  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    });
    formatters.set(key, formatter);
  }

  return formatter.format(amountInCents / 100);
};
