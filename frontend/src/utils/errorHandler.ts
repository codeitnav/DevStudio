import { AppError, ErrorType, ApiErrorResponse } from '../types/error';
import { withRetry, RETRY_CONFIGS, RetryOptions } from './retry';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryOptions?: RetryOptions;
  fallbackMessage?: string;
  context?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private toastHandler?: (error: AppError) => void;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  setToastHandler(handler: (error: AppError) => void) {
    this.toastHandler = handler;
  }

  /**
   * Convert various error types to standardized AppError
   */
  normalizeError(error: any, context?: string): AppError {
    // Already an AppError
    if (error?.type && Object.values(ErrorType).includes(error.type)) {
      return error as AppError;
    }

    // API error response
    if (error?.response?.data?.error) {
      const apiError = error.response.data as ApiErrorResponse;
      return {
        type: apiError.error.type || ErrorType.UNKNOWN_ERROR,
        message: apiError.error.message,
        code: apiError.error.code,
        details: apiError.error.details,
        timestamp: new Date(),
      };
    }

    // Network/HTTP errors
    if (error?.response) {
      const status = error.response.status;
      if (status === 401) {
        return {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Authentication required. Please log in again.',
          code: 'UNAUTHORIZED',
          timestamp: new Date(),
        };
      } else if (status === 403) {
        return {
          type: ErrorType.ROOM_ACCESS_ERROR,
          message: 'Access denied. You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          timestamp: new Date(),
        };
      } else if (status >= 500) {
        return {
          type: ErrorType.NETWORK_ERROR,
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          timestamp: new Date(),
        };
      } else if (status >= 400) {
        return {
          type: ErrorType.VALIDATION_ERROR,
          message: error.response.data?.message || 'Invalid request.',
          code: 'CLIENT_ERROR',
          timestamp: new Date(),
        };
      }
    }

    // Network connection errors
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        timestamp: new Date(),
      };
    }

    // Socket.io errors
    if (error?.type === 'TransportError' || error?.description?.includes('socket')) {
      return {
        type: ErrorType.SOCKET_ERROR,
        message: 'Connection error. Attempting to reconnect...',
        code: 'SOCKET_ERROR',
        timestamp: new Date(),
      };
    }

    // Generic JavaScript errors
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error?.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      details: { originalError: error, context },
      timestamp: new Date(),
    };
  }

  /**
   * Handle errors with optional retry and toast notifications
   */
  async handleError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): Promise<AppError> {
    const {
      showToast = true,
      logError = true,
      context,
      fallbackMessage,
    } = options;

    const normalizedError = this.normalizeError(error, context);

    // Log error
    if (logError) {
      this.logError(normalizedError, context);
    }

    // Show toast notification
    if (showToast && this.toastHandler) {
      const errorToShow = fallbackMessage 
        ? { ...normalizedError, message: fallbackMessage }
        : normalizedError;
      this.toastHandler(errorToShow);
    }

    return normalizedError;
  }

  /**
   * Handle async operations with automatic error handling and retry
   */
  
async handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions & { retryConfig?: keyof typeof RETRY_CONFIGS } = {}
): Promise<T> {
  const {
    retryOptions,
    retryConfig = 'api',
    ...errorOptions
  } = options;

  try {
    const finalRetryOptions = retryOptions || RETRY_CONFIGS[retryConfig];
    
    return await withRetry(operation, {
      ...finalRetryOptions,
      onRetry: (attempt, error) => {
        console.log(`Retrying operation (attempt ${attempt}):`, error);
        // Safe property access
        if ('onRetry' in finalRetryOptions && typeof finalRetryOptions.onRetry === 'function') {
          finalRetryOptions.onRetry(attempt, error);
        }
      },
    });
  } catch (error) {
    const handledError = await this.handleError(error, errorOptions);
    throw handledError;
  }
}


  /**
   * Log errors appropriately based on environment
   */
  private logError(error: AppError, context?: string) {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', logData);
    } else {
      // In production, you might want to send to an error reporting service
      // Example: errorReportingService.captureException(error, { extra: logData });
      console.error('Error:', error.message);
    }
  }

  /**
   * Create error handler for specific contexts
   */
  createContextHandler(context: string, defaultOptions: ErrorHandlerOptions = {}) {
    return {
      handleError: (error: any, options: ErrorHandlerOptions = {}) =>
        this.handleError(error, { ...defaultOptions, ...options, context }),
      
      handleAsyncOperation: <T>(
        operation: () => Promise<T>,
        options: ErrorHandlerOptions & { retryConfig?: keyof typeof RETRY_CONFIGS } = {}
      ) =>
        this.handleAsyncOperation(operation, { ...defaultOptions, ...options, context }),
    };
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: any, options?: ErrorHandlerOptions) =>
  errorHandler.handleError(error, options);

export const handleAsyncOperation = <T>(
  operation: () => Promise<T>,
  options?: ErrorHandlerOptions & { retryConfig?: keyof typeof RETRY_CONFIGS }
) => errorHandler.handleAsyncOperation(operation, options);

// Context-specific error handlers
export const createErrorHandler = (context: string, defaultOptions?: ErrorHandlerOptions) =>
  errorHandler.createContextHandler(context, defaultOptions);