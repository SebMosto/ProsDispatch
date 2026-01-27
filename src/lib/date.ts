import i18n from '../i18n';

type DateFormatOptions = Intl.DateTimeFormatOptions;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const DEFAULT_OPTIONS: DateFormatOptions = Object.freeze({
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// Pre-calculate the stringified options to avoid doing it on every call for default cases
const DEFAULT_OPTIONS_STRING = JSON.stringify(DEFAULT_OPTIONS);

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

  // Use pre-calculated key part if options are not provided
  const optionsKey = options ? JSON.stringify(options) : DEFAULT_OPTIONS_STRING;
  const cacheKey = `${locale}-${optionsKey}`;

  let formatter = formatterCache.get(cacheKey);

  if (!formatter) {
    const finalOptions = options || DEFAULT_OPTIONS;
    formatter = new Intl.DateTimeFormat(locale, finalOptions);
    formatterCache.set(cacheKey, formatter);
  }

  return formatter.format(dateObj);
};
