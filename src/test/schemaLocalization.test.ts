import { describe, it, expect } from 'vitest';
import { getJobCreateSchema } from '../schemas/job';
import { getClientSchema } from '../schemas/client';

describe('Schema Localization', () => {
  it('should return keys when t is not provided (Job)', () => {
    const schema = getJobCreateSchema();
    // Invalid title (too short)
    const result = schema.safeParse({
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      property_id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'a'
    });
    if (!result.success) {
      const titleError = result.error.issues.find(i => i.path.includes('title'));
      expect(titleError?.message).toBe('validation.titleRequired');
    } else {
        throw new Error('Schema should have failed');
    }
  });

  it('should return translated strings when t is provided (Job)', () => {
    const t = (key: string) => `translated_${key}`;
    const schema = getJobCreateSchema(t as any);
    const result = schema.safeParse({
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      property_id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'a'
    });
    if (!result.success) {
      const titleError = result.error.issues.find(i => i.path.includes('title'));
      expect(titleError?.message).toBe('translated_validation.titleRequired');
    } else {
        throw new Error('Schema should have failed');
    }
  });

   it('should return keys when t is not provided (Client)', () => {
    const schema = getClientSchema();
    // Empty name
    const result = schema.safeParse({ name: '' });
    if (!result.success) {
      const nameError = result.error.issues.find(i => i.path.includes('name'));
      expect(nameError?.message).toBe('validation.nameRequired');
    } else {
        throw new Error('Schema should have failed');
    }
  });

  it('should return translated strings when t is provided (Client)', () => {
    const t = (key: string) => `translated_${key}`;
    const schema = getClientSchema(t as any);
    const result = schema.safeParse({ name: '' });
    if (!result.success) {
      const nameError = result.error.issues.find(i => i.path.includes('name'));
      expect(nameError?.message).toBe('translated_validation.nameRequired');
    } else {
        throw new Error('Schema should have failed');
    }
  });
});
