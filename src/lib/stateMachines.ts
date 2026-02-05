import type { JobStatus } from '../schemas/mvp1/job';
// Assuming InvoiceStatus type isn't exported as such but enum is in schema
import { INVOICE_STATUSES } from '../schemas/mvp1/invoice';

type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ['sent', 'approved', 'archived'],
  sent: ['approved', 'archived', 'draft'],
  approved: ['in_progress', 'archived', 'draft'],
  in_progress: ['completed', 'archived', 'approved'],
  completed: ['invoiced', 'archived', 'in_progress'],
  invoiced: ['paid', 'archived', 'completed'],
  paid: ['archived', 'invoiced'],
  archived: ['draft'],
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
