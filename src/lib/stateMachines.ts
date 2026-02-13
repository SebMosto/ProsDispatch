import type { Database } from '../types/database.types';

export type JobStatus = Database['public']['Enums']['job_status'];

export const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ['sent', 'archived'],
  sent: ['approved', 'draft', 'archived'],
  approved: ['in_progress', 'sent', 'archived'],
  in_progress: ['completed', 'approved', 'archived'],
  completed: ['invoiced', 'in_progress', 'archived'],
  invoiced: ['paid', 'completed', 'archived'],
  paid: ['archived'],
  archived: ['draft'],
};

export const canTransition = (
  currentStatus: JobStatus,
  newStatus: JobStatus
): boolean => {
  if (currentStatus === newStatus) return true;
  const allowed = JOB_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
};
