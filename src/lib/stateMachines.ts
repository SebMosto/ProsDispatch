import type { JobStatus } from '../schemas/mvp1/job';
import type { InvoiceStatus } from '../schemas/mvp1/invoice';

export type { JobStatus, InvoiceStatus };

export class IllegalStatusTransitionError extends Error {
  constructor(
    public readonly entity: string,
    public readonly current: string,
    public readonly target: string
  ) {
    super(`Illegal ${entity} transition from "${current}" to "${target}"`);
    this.name = 'IllegalStatusTransitionError';
  }
}

// Job Transitions
const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ['sent'],
  sent: ['approved'],
  approved: ['in_progress'],
  in_progress: ['completed', 'archived'],
  completed: ['invoiced', 'archived'],
  invoiced: ['paid'],
  paid: ['archived'],
  archived: [],
};

export function validateJobTransition(current: JobStatus, target: JobStatus): void {
  const allowed = JOB_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new IllegalStatusTransitionError('Job', current, target);
  }
}

// Invoice Transitions
const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'void'],
  sent: ['paid', 'void', 'overdue'],
  overdue: ['paid', 'void', 'sent'],
  paid: ['void'],
  void: [],
};

export function validateInvoiceTransition(current: InvoiceStatus, target: InvoiceStatus): void {
  const allowed = INVOICE_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new IllegalStatusTransitionError('Invoice', current, target);
  }
}

// Helper to get allowed next states
export function getAllowedJobTransitions(current: JobStatus): JobStatus[] {
  return JOB_TRANSITIONS[current] || [];
}

export function getAllowedInvoiceTransitions(current: InvoiceStatus): InvoiceStatus[] {
  return INVOICE_TRANSITIONS[current] || [];
}
