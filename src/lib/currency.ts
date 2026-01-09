export const toCents = (value: number) => Math.round(value * 100);

export const fromCents = (value: number) => value / 100;

export const formatCurrency = (amountInCents: number, currency: string = 'CAD') =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
