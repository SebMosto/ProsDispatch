import type { ClientRecord } from '../repositories/clientRepository';

export type ClientWithPrimaryProperty = ClientRecord & {
  primary_property?: { city: string; address_line1: string } | null;
};
