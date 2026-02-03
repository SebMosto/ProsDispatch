const formatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Formats a number as a currency string.
 * @param amount - The numeric amount to format.
 * @param currency - The currency code (e.g., 'USD', 'EUR', 'GBP'). Defaults to 'USD'.
 * @param locale - The locale string (e.g., 'en-US', 'fr-FR'). Defaults to 'en-US'.
 */
export const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
  const cacheKey = `${locale}-${currency}`;
  let formatter = formatterCache.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    });
    formatterCache.set(cacheKey, formatter);
  }

  return formatter.format(amount);
};

/**
 * Parses a currency string into a number.
 * Removes non-numeric characters (except decimal points).
 */
export const parseCurrency = (input: string): number => {
  if (!input) return 0;
  // Remove currency symbols and non-numeric chars, keeping digits and dot
  const clean = input.replace(/[^0-9.-]+/g, '');
  return parseFloat(clean) || 0;
};
