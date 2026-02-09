import { describe, it, expect, vi } from 'vitest';
import { getJobCreateSchema } from '../schemas/job';
import { getClientSchema } from '../schemas/client';
import { getInvoiceDraftSchema } from '../schemas/invoice';
import { getPropertySchema } from '../schemas/property';
import { TFunction } from 'i18next';

describe('Schema Localization', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockT = vi.fn((key: string) => `TRANSLATED_${key}`) as unknown as TFunction;

  it('JobCreateSchema should use localized error messages', () => {
    const schema = getJobCreateSchema(mockT);
    const result = schema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      // Check specific fields that are required
      const clientIdError = result.error.issues.find(i => i.path.includes('client_id'));
      expect(clientIdError?.message).toBe('TRANSLATED_validation.clientIdInvalid'); // invalid_type_error / required_error

      const titleError = result.error.issues.find(i => i.path.includes('title'));
      expect(titleError?.message).toBe('TRANSLATED_validation.titleRequired');
    }
  });

  it('ClientSchema should use localized error messages', () => {
    const schema = getClientSchema(mockT);
    const result = schema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find(i => i.path.includes('name'));
      expect(nameError?.message).toBe('TRANSLATED_validation.nameRequired');
    }
  });

  it('PropertySchema should use localized error messages', () => {
    const schema = getPropertySchema(mockT);
    const result = schema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const addressError = result.error.issues.find(i => i.path.includes('address_line1'));
      expect(addressError?.message).toBe('TRANSLATED_validation.required');
    }
  });

  it('InvoiceDraftSchema should use localized error messages', () => {
    const schema = getInvoiceDraftSchema(mockT);
    const result = schema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const jobIdError = result.error.issues.find(i => i.path.includes('job_id'));
      expect(jobIdError?.message).toBe('TRANSLATED_validation.jobIdUUID');
    }
  });
});
