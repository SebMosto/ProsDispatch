import { describe, expect, it } from 'vitest';
import { JOB_STATUSES, JobCreateSchema, JobUpdateSchema } from '../schemas/job';

const validCreatePayload = {
  title: 'Kitchen faucet',
  description: 'Replace with new model',
  service_date: '2026-12-15',
  client_id: '11111111-1111-1111-8111-111111111111',
  property_id: '22222222-2222-2222-8222-222222222222',
  contractor_id: '33333333-3333-4333-8333-333333333333',
};

describe('JobCreateSchema', () => {
  it('parses valid payload and defaults status to draft', () => {
    const result = JobCreateSchema.parse(validCreatePayload);

    expect(result.title).toBe(validCreatePayload.title);
    expect(result.status).toBe('draft');
    expect(result.service_date).toBe(validCreatePayload.service_date);
  });

  it('rejects short titles', () => {
    expect(() =>
      JobCreateSchema.parse({ ...validCreatePayload, title: 'a' })
    ).toThrow(/Title must be at least 2 characters/);
  });

  it('rejects descriptions over 2000 characters', () => {
    expect(() =>
      JobCreateSchema.parse({
        ...validCreatePayload,
        description: 'a'.repeat(2001),
      })
    ).toThrow(/Description must not exceed 2000 characters/);
  });

  it('rejects invalid service dates', () => {
    expect(() =>
      JobCreateSchema.parse({ ...validCreatePayload, service_date: '2024/12/15' })
    ).toThrow(/Service date must be in YYYY-MM-DD format/);
  });

  it('rejects non-enum statuses', () => {
    expect(() =>
      JobCreateSchema.parse({
        ...validCreatePayload,
        status: 'invalid-status' as (typeof JOB_STATUSES)[number],
      })
    ).toThrow();
  });
});

describe('JobUpdateSchema', () => {
  it('accepts partial updates', () => {
    const result = JobUpdateSchema.parse({ title: 'Updated title' });
    expect(result.title).toBe('Updated title');
  });

  it('allows clearing optional fields', () => {
    const result = JobUpdateSchema.parse({
      description: null,
      service_date: null,
    });

    expect(result.description).toBeNull();
    expect(result.service_date).toBeNull();
  });

  it('requires at least one field', () => {
    expect(() => JobUpdateSchema.parse({})).toThrow(
      /At least one field is required to update a job/
    );
  });

  it('validates UUID fields', () => {
    expect(() =>
      JobUpdateSchema.parse({ client_id: 'not-a-uuid' })
    ).toThrow(/Client ID must be a valid UUID/);
  });
});
