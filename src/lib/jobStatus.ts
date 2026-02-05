/**
 * Job Status Transition Helper
 * 
 * Implements application-layer enforcement of job status transitions
 * as defined in SPEC-003 section 3.
 */

import type { JobStatus } from '../schemas/mvp1/job';
import { JOB_TRANSITIONS } from './stateMachines';

export type { JobStatus };

/**
 * Custom error class for illegal job status transitions
 */
export class IllegalJobStatusTransitionError extends Error {
  constructor(
    public readonly current: JobStatus,
    public readonly target: JobStatus
  ) {
    super(`Illegal transition from "${current}" to "${target}"`);
    this.name = 'IllegalJobStatusTransitionError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IllegalJobStatusTransitionError);
    }
  }
}



/**
 * Advances a job status from current to target status.
 * 
 * Rules:
 * - Only transitions defined in SPEC-003 section 3 are allowed
 * - No backward transitions
 * - Throws IllegalJobStatusTransitionError for illegal transitions
 * 
 * @param current - The current job status
 * @param target - The target job status to transition to
 * @returns The target status if the transition is legal
 * @throws {IllegalJobStatusTransitionError} If the transition is not allowed
 * 
 * @example
 * ```typescript
 * // Legal transition
 * const newStatus = advanceJobStatus('draft', 'sent'); // Returns 'sent'
 * 
 * // Illegal transition - throws error
 * advanceJobStatus('sent', 'draft'); // Throws IllegalJobStatusTransitionError
 * ```
 */
export function advanceJobStatus(current: JobStatus, target: JobStatus): JobStatus {
  // Check if transition is allowed
  const allowedTargets = JOB_TRANSITIONS[current];

  if (!allowedTargets) {
     // If the current status is not in the map (should not happen if types are correct), throw
     throw new Error(`Unknown status: ${current}`);
  }

  if (!allowedTargets.includes(target)) {
    throw new IllegalJobStatusTransitionError(current, target);
  }

  return target;
}
