import type { InvoiceItemInput } from '../schemas/invoice';

const GST_RATE = 0.05;
const QST_RATE = 0.09975;

const roundHalfUp = (value: number) => Math.round(value + Number.EPSILON);

export const calculateInvoiceTotals = (items: InvoiceItemInput[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const gst = roundHalfUp(subtotal * GST_RATE);
  const qst = roundHalfUp(subtotal * QST_RATE);
  const total = subtotal + gst + qst;

  const taxData = [
    {
      label: 'GST',
      rate: GST_RATE,
      amount: gst,
    },
    {
      label: 'QST',
      rate: QST_RATE,
      amount: qst,
    },
  ];

  return {
    subtotal,
    gst,
    qst,
    total,
    taxData,
  };
};
