import { describe, it, expect } from 'vitest';
import {
  JobStatus,
  validateJobTransition,
  IllegalStatusTransitionError,
} from '../lib/stateMachines';

describe('JobStatus Type', () => {
  it('should be derived from Supabase database types', () => {
    // Test that JobStatus type includes all expected values
    const statuses: JobStatus[] = [
      'draft',
      'sent',
      'approved',
      'in_progress',
      'completed',
      'invoiced',
      'paid',
      'archived',
    ];

    expect(statuses).toHaveLength(8);
  });
});

describe('IllegalStatusTransitionError', () => {
  it('should create error with correct properties', () => {
    const error = new IllegalStatusTransitionError('Job', 'draft', 'completed');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(IllegalStatusTransitionError);
    expect(error.name).toBe('IllegalStatusTransitionError');
    expect(error.entity).toBe('Job');
    expect(error.current).toBe('draft');
    expect(error.target).toBe('completed');
    expect(error.message).toBe('Illegal Job transition from "draft" to "completed"');
  });
});

describe('validateJobTransition - Legal Transitions', () => {
  describe('Primary workflow path', () => {
    it('should allow transition from draft to sent', () => {
      expect(() => validateJobTransition('draft', 'sent')).not.toThrow();
    });

    it('should allow transition from sent to approved', () => {
      expect(() => validateJobTransition('sent', 'approved')).not.toThrow();
    });

    it('should allow transition from approved to in_progress', () => {
      expect(() => validateJobTransition('approved', 'in_progress')).not.toThrow();
    });

    it('should allow transition from in_progress to completed', () => {
      expect(() => validateJobTransition('in_progress', 'completed')).not.toThrow();
    });

    it('should allow transition from completed to invoiced', () => {
      expect(() => validateJobTransition('completed', 'invoiced')).not.toThrow();
    });

    it('should allow transition from invoiced to paid', () => {
      expect(() => validateJobTransition('invoiced', 'paid')).not.toThrow();
    });

    it('should allow transition from paid to archived', () => {
      expect(() => validateJobTransition('paid', 'archived')).not.toThrow();
    });
  });

  describe('Alternative closeout paths', () => {
    it('should allow transition from completed to archived (manual closeout)', () => {
      expect(() => validateJobTransition('completed', 'archived')).not.toThrow();
    });

    it('should allow transition from in_progress to archived (canceled/closed)', () => {
      expect(() => validateJobTransition('in_progress', 'archived')).not.toThrow();
    });
  });
});

describe('validateJobTransition - Illegal Transitions (No Backward Transitions)', () => {
  it('should reject backward transition from sent to draft', () => {
    expect(() => validateJobTransition('sent', 'draft')).toThrow(
      IllegalStatusTransitionError
    );
  });

  it('should reject backward transition from approved to sent', () => {
    expect(() => validateJobTransition('approved', 'sent')).toThrow(
      IllegalStatusTransitionError
    );
  });

  it('should reject backward transition from approved to draft', () => {
    expect(() => validateJobTransition('approved', 'draft')).toThrow(
      IllegalStatusTransitionError
    );
  });
});

describe('validateJobTransition - Illegal Skip Transitions', () => {
  it('should reject skipping from draft directly to approved', () => {
    expect(() => validateJobTransition('draft', 'approved')).toThrow(
      IllegalStatusTransitionError
    );
  });
});

describe('validateJobTransition - Same State Transition', () => {
  it('should reject transition from draft to draft', () => {
    expect(() => validateJobTransition('draft', 'draft')).toThrow(
      IllegalStatusTransitionError
    );
  });
});
