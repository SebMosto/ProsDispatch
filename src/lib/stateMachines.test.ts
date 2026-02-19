import { describe, it, expect } from 'vitest';
import { canTransition } from './stateMachines';

describe('State Machine Logic', () => {
  it('should allow valid transitions', () => {
    expect(canTransition('draft', 'sent')).toBe(true);
    expect(canTransition('sent', 'approved')).toBe(true);
    expect(canTransition('approved', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
    expect(canTransition('completed', 'invoiced')).toBe(true);
    expect(canTransition('invoiced', 'paid')).toBe(true);
    expect(canTransition('paid', 'archived')).toBe(true);
  });

  it('should allow archiving from most states', () => {
    expect(canTransition('draft', 'archived')).toBe(true);
    expect(canTransition('sent', 'archived')).toBe(true);
    expect(canTransition('approved', 'archived')).toBe(true);
    expect(canTransition('in_progress', 'archived')).toBe(true);
    expect(canTransition('completed', 'archived')).toBe(true);
    expect(canTransition('invoiced', 'archived')).toBe(true);
  });

  it('should allow reversing to draft from archived', () => {
    expect(canTransition('archived', 'draft')).toBe(true);
  });

  it('should prevent invalid transitions', () => {
    expect(canTransition('draft', 'completed')).toBe(false);
    expect(canTransition('approved', 'paid')).toBe(false);
    expect(canTransition('paid', 'draft')).toBe(false); // Can't revert paid job directly
  });

  it('should allow self-transitions', () => {
    expect(canTransition('draft', 'draft')).toBe(true);
    expect(canTransition('sent', 'sent')).toBe(true);
  });
});
