import { ErrorType } from '../types/error';

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  retryCondition: (error: any) => {
    // Default: retry on network errors and server errors (5xx)
    if (error?.type === ErrorType.NETWORK_ERROR) return true;
    if (error?.response?.status >= 500) return true;
    return false;
  },
  onRetry: () => {},
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public originalError: any,
    public attempt: number,
    public maxAttempts: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let currentDelay = config.delay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (!config.retryCondition(error)) {
        break;
      }

      // Call retry callback
      config.onRetry(attempt, error);

      // Wait before retrying
      await delay(currentDelay);

      // Increase delay for next attempt (exponential backoff)
      currentDelay = Math.min(
        currentDelay * config.backoffMultiplier,
        config.maxDelay
      );
    }
  }

  // If we get here, all retries failed
  throw new RetryableError(
    `Operation failed after ${config.maxAttempts} attempts`,
    lastError,
    config.maxAttempts,
    config.maxAttempts
  );
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Specific retry configurations for different types of operations
export const RETRY_CONFIGS = {
  // For API calls
  api: {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Retry on network errors and 5xx server errors
      if (error?.type === ErrorType.NETWORK_ERROR) return true;
      if (error?.response?.status >= 500) return true;
      if (error?.code === 'NETWORK_ERROR') return true;
      return false;
    },
  },

  // For Socket.io connections
  socket: {
    maxAttempts: 5,
    delay: 2000,
    backoffMultiplier: 1.5,
    maxDelay: 30000,
    retryCondition: (error: any) => {
      // Retry on connection errors
      return error?.type === ErrorType.SOCKET_ERROR || 
             error?.type === ErrorType.NETWORK_ERROR;
    },
  },

  // For file operations
  fileOperation: {
    maxAttempts: 2,
    delay: 500,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Only retry on network errors, not on validation or permission errors
      return error?.type === ErrorType.NETWORK_ERROR;
    },
  },

  // For collaborative editing operations
  collaboration: {
    maxAttempts: 3,
    delay: 200,
    backoffMultiplier: 1.5,
    retryCondition: (error: any) => {
      // Retry on network and collaboration errors
      return error?.type === ErrorType.NETWORK_ERROR || 
             error?.type === ErrorType.COLLABORATION_ERROR;
    },
  },
} as const;

// Hook for using retry functionality in React components
export function useRetry() {
  const retryOperation = async <T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> => {
    return withRetry(operation, options);
  };

  return { retryOperation, withRetry };
}