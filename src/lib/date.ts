import i18n from '../i18n';

type DateFormatOptions = Intl.DateTimeFormatOptions;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Formats a date string or object according to the active locale.
 *
 * @param date - The date to format (string or Date object)
 * @param options - Optional formatting options
 * @returns The formatted date string
 */
export const formatDate = (date: string | Date, options?: DateFormatOptions) => {
  const language = i18n.language || 'en';
  // Map 'fr' to 'fr-CA' and 'en' to 'en-CA' for date formatting defaults in Canada context
  const locale = language.startsWith('fr') ? 'fr-CA' : 'en-CA';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Default options if none provided
  const defaultOptions: DateFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const finalOptions = options || defaultOptions;
  const cacheKey = `${locale}-${JSON.stringify(finalOptions)}`;

  let formatter = formatterCache.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, finalOptions);
    formatterCache.set(cacheKey, formatter);
  }

  return formatter.format(dateObj);
};
