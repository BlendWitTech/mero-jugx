/**
 * Centralized error handling utilities
 */

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Extract user-friendly error message from API error
 * Removes technical error codes and status numbers from messages
 */
export function getErrorMessage(error: any): string {
  // Handle different error formats
  if (typeof error === 'string') {
    return cleanErrorMessage(error);
  }

  if (error?.response?.data) {
    const data = error.response.data;

    // Validation errors with field-specific messages
    if (data.errors && typeof data.errors === 'object') {
      const errorMessages = Object.values(data.errors).flat() as string[];
      if (errorMessages.length > 0) {
        return cleanErrorMessage(errorMessages.join(', '));
      }
    }

    // Standard error message
    if (data.message) {
      return cleanErrorMessage(data.message);
    }

    // Error code with fallback
    if (data.code) {
      const codeMessage = getErrorByCode(data.code);
      return codeMessage ? cleanErrorMessage(codeMessage) : cleanErrorMessage(data.code);
    }
  }

  // Network errors and axios default messages
  if (error?.message) {
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    // Handle axios default error messages like "Request failed with status code 401"
    if (error.message.includes('Request failed with status code')) {
      return cleanErrorMessage(error.message);
    }
    return cleanErrorMessage(error.message);
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Remove technical error codes and status numbers from error messages
 */
function cleanErrorMessage(message: string): string {
  if (!message) return message;
  
  // Handle axios default error messages like "Request failed with status code 401"
  if (message.includes('Request failed with status code')) {
    // Extract status code if present
    const statusMatch = message.match(/status code (\d+)/i);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : null;
    
    // Return user-friendly message based on status code
    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    } else if (status === 403) {
      return 'You do not have permission to perform this action.';
    } else if (status === 404) {
      return 'The requested resource was not found.';
    } else if (status === 409) {
      return 'This information is already in use. Please use a different value.';
    } else if (status === 400) {
      return 'Invalid request. Please check your input and try again.';
    } else if (status === 422) {
      return 'Validation error. Please check your input and try again.';
    } else if (status === 500 || (status && status >= 500)) {
      return 'A server error occurred. Please try again later or contact support if the problem persists.';
    } else if (status) {
      return 'An error occurred. Please try again.';
    }
    // If no status code found, continue with normal cleaning
  }
  
  // Remove HTTP status codes (400, 401, 403, 404, 409, 500, etc.)
  let cleaned = message.replace(/\b(40[0-9]|50[0-9])\b/g, '').trim();
  
  // Remove "Request failed with status code" pattern
  cleaned = cleaned.replace(/Request failed with status code\s*\d*/gi, '').trim();
  
  // Remove technical prefixes like "HTTP", "Status", "Error Code", etc.
  cleaned = cleaned.replace(/\b(HTTP|Status|Error Code|Status Code)\s*:?\s*/gi, '').trim();
  
  // Remove common technical error patterns
  cleaned = cleaned.replace(/\b(Error|Exception)\s*:?\s*/gi, '').trim();
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove leading/trailing punctuation that might be left
  cleaned = cleaned.replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
  
  return cleaned || 'An error occurred. Please try again.'; // Fallback to generic message
}

/**
 * Get user-friendly error message by error code
 */
function getErrorByCode(code: string): string | null {
  const errorMessages: Record<string, string> = {
    'UNAUTHORIZED': 'You are not authorized to perform this action.',
    'FORBIDDEN': 'You do not have permission to access this resource.',
    'NOT_FOUND': 'The requested resource was not found.',
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'DUPLICATE_ENTRY': 'This record already exists.',
    'INVALID_CREDENTIALS': 'Invalid email or password.',
    'ACCOUNT_LOCKED': 'Your account has been locked. Please contact support.',
    'EMAIL_NOT_VERIFIED': 'Please verify your email address before continuing.',
    'MFA_REQUIRED': 'Multi-factor authentication is required.',
    'MFA_INVALID': 'Invalid authentication code.',
    'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later.',
    'PAYMENT_FAILED': 'Payment processing failed. Please try again or use a different payment method.',
    'SUBSCRIPTION_EXPIRED': 'Your subscription has expired. Please renew to continue.',
    'FEATURE_UNAVAILABLE': 'This feature is not available for your current plan.',
  };

  return errorMessages[code] || null;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatus(error: any): number | null {
  return error?.response?.status || error?.status || null;
}

/**
 * Check if error is a specific status code
 */
export function isErrorStatus(error: any, status: number): boolean {
  return getErrorStatus(error) === status;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: any): boolean {
  const status = getErrorStatus(error);
  return status !== null && status >= 400 && status < 500;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: any): boolean {
  const status = getErrorStatus(error);
  return status !== null && status >= 500;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    !error?.response &&
    (error?.message?.includes('Network Error') ||
      error?.message?.includes('Failed to fetch') ||
      error?.code === 'ECONNABORTED')
  );
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(error: any): Record<string, string> {
  if (error?.response?.data?.errors && typeof error.response.data.errors === 'object') {
    const formatted: Record<string, string> = {};
    Object.entries(error.response.data.errors).forEach(([field, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        formatted[field] = messages[0]; // Take first error message
      }
    });
    return formatted;
  }
  return {};
}

import { logger } from './logger';

/**
 * Log error for debugging (only in development)
 */
export function logError(error: any, context?: string): void {
  logger.error(`[Error${context ? ` - ${context}` : ''}]`, {
    error,
    message: getErrorMessage(error),
    status: getErrorStatus(error),
    stack: error?.stack,
  });
}

