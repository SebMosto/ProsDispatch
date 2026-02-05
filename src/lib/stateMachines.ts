import type { JobStatus } from '../schemas/mvp1/job';
// Assuming InvoiceStatus type isn't exported as such but enum is in schema
import { INVOICE_STATUSES } from '../schemas/mvp1/invoice';

type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ['sent'],
  sent: ['approved'],
  approved: ['in_progress'],
  in_progress: ['completed', 'archived'],
  completed: ['invoiced', 'archived'],
  invoiced: ['paid'],
  paid: ['archived'],
  archived: [],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'paid', 'void'],
  sent: ['paid', 'void', 'overdue'],
  paid: ['void', 'sent'], // Refund/Reopen?
  void: ['draft'],
  overdue: ['paid', 'void', 'sent'],
};

export function canTransitionJob(current: JobStatus, next: JobStatus): boolean {
  if (current === next) return true;
  return JOB_TRANSITIONS[current]?.includes(next) ?? false;
}

export function canTransitionInvoice(current: InvoiceStatus, next: InvoiceStatus): boolean {
  if (current === next) return true;
  return INVOICE_TRANSITIONS[current]?.includes(next) ?? false;
}
