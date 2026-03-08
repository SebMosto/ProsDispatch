import type { ClientRecord } from '../repositories/clientRepository';

export type ClientWithPrimaryProperty = ClientRecord & {
  primary_property?: { city: string; address_line1: string } | null;
};

export type ClientSummary = {
  totalJobs: number;
  lastServicedAt: string | null; // ISO date string
  totalInvoiced: number; // cents
  totalPaid: number; // cents
  outstandingBalance: number; // cents
};
