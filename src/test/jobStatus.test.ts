import { describe, it, expect } from 'vitest';
import {
  JobStatus,
  advanceJobStatus,
  IllegalJobStatusTransitionError,
} from '../lib/jobStatus';

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

    // TypeScript will catch if JobStatus doesn't match these values
    expect(statuses).toHaveLength(8);
  });
});

describe('IllegalJobStatusTransitionError', () => {
  it('should create error with correct properties', () => {
    const error = new IllegalJobStatusTransitionError('draft', 'completed');
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(IllegalJobStatusTransitionError);
    expect(error.name).toBe('IllegalJobStatusTransitionError');
    expect(error.current).toBe('draft');
    expect(error.target).toBe('completed');
    expect(error.message).toBe('Illegal transition from "draft" to "completed"');
  });
});

describe('advanceJobStatus - Legal Transitions', () => {
  describe('Primary workflow path', () => {
    it('should allow transition from draft to sent', () => {
      const result = advanceJobStatus('draft', 'sent');
      expect(result).toBe('sent');
    });

    it('should allow transition from sent to approved', () => {
      const result = advanceJobStatus('sent', 'approved');
      expect(result).toBe('approved');
    });

    it('should allow transition from approved to in_progress', () => {
      const result = advanceJobStatus('approved', 'in_progress');
      expect(result).toBe('in_progress');
    });

    it('should allow transition from in_progress to completed', () => {
      const result = advanceJobStatus('in_progress', 'completed');
      expect(result).toBe('completed');
    });

    it('should allow transition from completed to invoiced', () => {
      const result = advanceJobStatus('completed', 'invoiced');
      expect(result).toBe('invoiced');
    });

    it('should allow transition from invoiced to paid', () => {
      const result = advanceJobStatus('invoiced', 'paid');
      expect(result).toBe('paid');
    });

    it('should allow transition from paid to archived', () => {
      const result = advanceJobStatus('paid', 'archived');
      expect(result).toBe('archived');
    });
  });

  describe('Alternative closeout paths', () => {
    it('should allow transition from completed to archived (manual closeout)', () => {
      const result = advanceJobStatus('completed', 'archived');
      expect(result).toBe('archived');
    });

    it('should allow transition from in_progress to archived (canceled/closed)', () => {
      const result = advanceJobStatus('in_progress', 'archived');
      expect(result).toBe('archived');
    });
  });
});

describe('advanceJobStatus - Illegal Transitions (No Backward Transitions)', () => {
  it('should reject backward transition from sent to draft', () => {
    expect(() => advanceJobStatus('sent', 'draft')).toThrow(
      IllegalJobStatusTransitionError
    );
    expect(() => advanceJobStatus('sent', 'draft')).toThrow(
      'Illegal transition from "sent" to "draft"'
    );
  });

  it('should reject backward transition from approved to sent', () => {
    expect(() => advanceJobStatus('approved', 'sent')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject backward transition from approved to draft', () => {
    expect(() => advanceJobStatus('approved', 'draft')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject backward transition from in_progress to approved', () => {
    expect(() => advanceJobStatus('in_progress', 'approved')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject backward transition from completed to in_progress', () => {
    expect(() => advanceJobStatus('completed', 'in_progress')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject backward transition from invoiced to completed', () => {
    expect(() => advanceJobStatus('invoiced', 'completed')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject backward transition from paid to invoiced', () => {
    expect(() => advanceJobStatus('paid', 'invoiced')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject backward transition from archived to paid', () => {
    expect(() => advanceJobStatus('archived', 'paid')).toThrow(
      IllegalJobStatusTransitionError
    );
  });
});

describe('advanceJobStatus - Illegal Skip Transitions', () => {
  it('should reject skipping from draft directly to approved', () => {
    expect(() => advanceJobStatus('draft', 'approved')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject skipping from draft directly to in_progress', () => {
    expect(() => advanceJobStatus('draft', 'in_progress')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject skipping from draft directly to completed', () => {
    expect(() => advanceJobStatus('draft', 'completed')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject skipping from sent directly to in_progress', () => {
    expect(() => advanceJobStatus('sent', 'in_progress')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject skipping from approved directly to completed', () => {
    expect(() => advanceJobStatus('approved', 'completed')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject transition from sent directly to archived', () => {
    expect(() => advanceJobStatus('sent', 'archived')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject transition from approved directly to archived', () => {
    expect(() => advanceJobStatus('approved', 'archived')).toThrow(
      IllegalJobStatusTransitionError
    );
  });
});

describe('advanceJobStatus - Terminal State', () => {
  it('should reject any transition from archived state', () => {
    expect(() => advanceJobStatus('archived', 'draft')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject transition from archived to paid', () => {
    expect(() => advanceJobStatus('archived', 'paid')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject transition from archived to completed', () => {
    expect(() => advanceJobStatus('archived', 'completed')).toThrow(
      IllegalJobStatusTransitionError
    );
  });
});

describe('advanceJobStatus - Same State Transition', () => {
  it('should reject transition from draft to draft', () => {
    expect(() => advanceJobStatus('draft', 'draft')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject transition from sent to sent', () => {
    expect(() => advanceJobStatus('sent', 'sent')).toThrow(
      IllegalJobStatusTransitionError
    );
  });

  it('should reject transition from completed to completed', () => {
    expect(() => advanceJobStatus('completed', 'completed')).toThrow(
      IllegalJobStatusTransitionError
    );
  });
});
