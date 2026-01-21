import i18n from '../i18n';

/**
 * Formats a date string or object according to the current active locale.
 * Enforces 'en-CA' or 'fr-CA' to ensure consistent date formats (YYYY-MM-DD vs DD/MM/YYYY etc).
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  },
): string => {
  const dateObj = new Date(date);

  if (Number.isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const currentLang = i18n.language || 'en';
  const locale = currentLang.startsWith('fr') ? 'fr-CA' : 'en-CA';

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};
