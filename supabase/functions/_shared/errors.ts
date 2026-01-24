/**
 * Shared error handling utilities for Stripe Edge Functions
 */

/**
 * Determines the appropriate HTTP status code based on the error message.
 * 
 * @param error - The error object to analyze
 * @returns The appropriate HTTP status code
 * 
 * Status code mapping:
 * - 401: Authentication/authorization issues
 * - 404: Resource not found
 * - 400: Client errors (missing/invalid input)
 * - 500: Server errors (unexpected errors, Stripe API errors, database errors)
 */
export function getErrorStatus(error: Error): number {
  const message = error.message.toLowerCase();
  
  // 401 Unauthorized - authentication issues
  if (message.includes("unauthorized") || message.includes("not authenticated")) {
    return 401;
  }
  
  // 404 Not Found - resource not found
  if (message.includes("not found") || message.includes("no stripe customer")) {
    return 404;
  }
  
  // 400 Bad Request - client errors (missing fields, invalid input)
  if (message.includes("missing") || message.includes("invalid") || message.includes("required")) {
    return 400;
  }
  
  // 500 Internal Server Error - unexpected errors, Stripe API errors, database errors
  return 500;
}
