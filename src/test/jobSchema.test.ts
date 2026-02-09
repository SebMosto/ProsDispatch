import { describe, it, expect } from 'vitest';
import { getJobCreateSchema, getJobUpdateSchema } from '../schemas/mvp1/job';
import { TFunction } from 'i18next';

// Mock t function
const t = ((key: string) => key) as unknown as TFunction;
const JobCreateSchema = getJobCreateSchema(t);
const JobUpdateSchema = getJobUpdateSchema(t);

describe('JobCreateSchema', () => {
  describe('Valid inputs', () => {
    it('should accept valid job creation with all fields', () => {
      const validJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Kitchen faucet repair',
        description: 'Replace old faucet with new one',
        service_date: '2024-01-15',
      };

      const result = JobCreateSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it('should accept valid job creation without optional fields', () => {
      const validJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Kitchen faucet repair',
      };

      const result = JobCreateSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it('should accept title with minimum length of 2 characters', () => {
      const validJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'AB',
      };

      const result = JobCreateSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it('should accept title with maximum length of 80 characters', () => {
      const validJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'A'.repeat(80),
      };

      const result = JobCreateSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it('should accept description with maximum length of 2000 characters', () => {
      const validJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Test job',
        description: 'A'.repeat(2000),
      };

      const result = JobCreateSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it('should accept Date object for service_date', () => {
      const validJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Kitchen faucet repair',
        service_date: new Date('2024-01-15'),
      };

      const result = JobCreateSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid inputs', () => {
    it('should reject missing client_id', () => {
      const invalidJob = {
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Kitchen faucet repair',
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
    });

    it('should reject missing property_id', () => {
      const invalidJob = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Kitchen faucet repair',
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
    });

    it('should reject missing title', () => {
      const invalidJob = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
    });

    it('should reject invalid client_id format', () => {
      const invalidJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: 'not-a-uuid',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Kitchen faucet repair',
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.clientId');
      }
    });

    it('should reject invalid property_id format', () => {
      const invalidJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: 'not-a-uuid',
        title: 'Kitchen faucet repair',
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.propertyId');
      }
    });

    it('should reject title shorter than 2 characters', () => {
      const invalidJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'A',
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.titleMin');
      }
    });

    it('should reject title longer than 80 characters', () => {
      const invalidJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'A'.repeat(81),
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.titleMax');
      }
    });

    it('should reject description longer than 2000 characters', () => {
      const invalidJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Test job',
        description: 'A'.repeat(2001),
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.descriptionMax');
      }
    });

    it('should reject invalid service_date format', () => {
      const invalidJob = {
        contractor_id: '323e4567-e89b-12d3-a456-426614174000',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Kitchen faucet repair',
        service_date: '01/15/2024', // Wrong format
      };

      const result = JobCreateSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.serviceDate');
      }
    });
  });
});

describe('JobUpdateSchema', () => {
  describe('Valid inputs', () => {
    it('should accept update with all fields', () => {
      const validUpdate = {
        title: 'Updated title',
        description: 'Updated description',
        service_date: '2024-02-20',
      };

      const result = JobUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should accept update with only title', () => {
      const validUpdate = {
        title: 'Updated title',
      };

      const result = JobUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should accept update with only description', () => {
      const validUpdate = {
        description: 'Updated description',
      };

      const result = JobUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should accept update with only service_date', () => {
      const validUpdate = {
        service_date: '2024-02-20',
      };

      const result = JobUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should accept null service_date to clear it', () => {
      const validUpdate = {
        service_date: null,
      };

      const result = JobUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should accept Date object for service_date', () => {
      const validUpdate = {
        service_date: new Date('2024-02-20'),
      };

      const result = JobUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject empty update object', () => {
      const invalidUpdate = {};

      const result = JobUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.updateRequired');
      }
    });
  });

  describe('Invalid inputs', () => {
    it('should reject title shorter than 2 characters', () => {
      const invalidUpdate = {
        title: 'A',
      };

      const result = JobUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.titleMin');
      }
    });

    it('should reject title longer than 80 characters', () => {
      const invalidUpdate = {
        title: 'A'.repeat(81),
      };

      const result = JobUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.titleMax');
      }
    });

    it('should reject description longer than 2000 characters', () => {
      const invalidUpdate = {
        description: 'A'.repeat(2001),
      };

      const result = JobUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.descriptionMax');
      }
    });

    it('should reject invalid service_date format', () => {
      const invalidUpdate = {
        service_date: '01/15/2024', // Wrong format
      };

      const result = JobUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('validation.serviceDate');
      }
    });
  });
});
