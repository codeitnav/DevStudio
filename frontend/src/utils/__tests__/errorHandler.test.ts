import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler, errorHandler, handleError, handleAsyncOperation } from '../errorHandler';
import { ErrorType, AppError } from '../../types/error';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;
  let mockToastHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = ErrorHandler.getInstance();
    mockToastHandler = vi.fn();
    handler.setToastHandler(mockToastHandler);
    vi.clearAllMocks();
  });

  describe('normalizeError', () => {
    it('returns AppError as-is', () => {
      const appError: AppError = {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Test error',
        timestamp: new Date(),
      };

      const result = handler.normalizeError(appError);

      expect(result).toEqual(appError);
    });

    it('converts API error response', () => {
      const apiError = {
        response: {
          data: {
            error: {
              type: ErrorType.AUTHENTICATION_ERROR,
              message: 'Invalid credentials',
              code: 'AUTH_FAILED',
            },
          },
        },
      };

      const result = handler.normalizeError(apiError);

      expect(result.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(result.message).toBe('Invalid credentials');
      expect(result.code).toBe('AUTH_FAILED');
    });

    it('converts 401 HTTP error', () => {
      const httpError = {
        response: {
          status: 401,
        },
      };

      const result = handler.normalizeError(httpError);

      expect(result.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(result.message).toBe('Authentication required. Please log in again.');
      expect(result.code).toBe('UNAUTHORIZED');
    });

    it('converts 403 HTTP error', () => {
      const httpError = {
        response: {
          status: 403,
        },
      };

      const result = handler.normalizeError(httpError);

      expect(result.type).toBe(ErrorType.ROOM_ACCESS_ERROR);
      expect(result.code).toBe('FORBIDDEN');
    });

    it('converts 5xx HTTP error', () => {
      const httpError = {
        response: {
          status: 500,
        },
      };

      const result = handler.normalizeError(httpError);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.code).toBe('SERVER_ERROR');
    });

    it('converts network error', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
      };

      const result = handler.normalizeError(networkError);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('converts socket error', () => {
      const socketError = {
        type: 'TransportError',
      };

      const result = handler.normalizeError(socketError);

      expect(result.type).toBe(ErrorType.SOCKET_ERROR);
      expect(result.code).toBe('SOCKET_ERROR');
    });

    it('converts generic error', () => {
      const genericError = new Error('Something went wrong');

      const result = handler.normalizeError(genericError);

      expect(result.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(result.message).toBe('Something went wrong');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('handleError', () => {
    it('shows toast by default', async () => {
      const error = new Error('Test error');

      await handler.handleError(error);

      expect(mockToastHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.UNKNOWN_ERROR,
          message: 'Test error',
        })
      );
    });

    it('does not show toast when disabled', async () => {
      const error = new Error('Test error');

      await handler.handleError(error, { showToast: false });

      expect(mockToastHandler).not.toHaveBeenCalled();
    });

    it('uses fallback message', async () => {
      const error = new Error('Original error');

      await handler.handleError(error, { fallbackMessage: 'Fallback message' });

      expect(mockToastHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Fallback message',
        })
      );
    });

    it('logs error by default', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      await handler.handleError(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('does not log when disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      await handler.handleError(error, { logError: false });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('handleAsyncOperation', () => {
    it('executes successful operation', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await handler.handleAsyncOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('handles operation error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(handler.handleAsyncOperation(operation)).rejects.toThrow();
      expect(mockToastHandler).toHaveBeenCalled();
    });

    it('retries operation on retryable error', async () => {
      vi.useFakeTimers();

      const operation = vi.fn()
        .mockRejectedValueOnce({ type: ErrorType.NETWORK_ERROR })
        .mockResolvedValue('success');

      const promise = handler.handleAsyncOperation(operation);

      // Fast-forward through retry delay
      vi.advanceTimersByTime(1000);

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('createContextHandler', () => {
    it('creates handler with context', () => {
      const contextHandler = handler.createContextHandler('test-context');

      expect(contextHandler.handleError).toBeDefined();
      expect(contextHandler.handleAsyncOperation).toBeDefined();
    });

    it('passes context to error handling', async () => {
      const contextHandler = handler.createContextHandler('test-context');
      const error = new Error('Test error');

      const result = await contextHandler.handleError(error);

      expect(result.details?.context).toBe('test-context');
    });
  });

  describe('singleton behavior', () => {
    it('returns same instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});

describe('convenience functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleError calls singleton method', async () => {
    const spy = vi.spyOn(errorHandler, 'handleError');
    const error = new Error('Test');

    await handleError(error);

    expect(spy).toHaveBeenCalledWith(error, undefined);
  });

  it('handleAsyncOperation calls singleton method', async () => {
    const spy = vi.spyOn(errorHandler, 'handleAsyncOperation');
    const operation = vi.fn().mockResolvedValue('success');

    await handleAsyncOperation(operation);

    expect(spy).toHaveBeenCalledWith(operation, undefined);
  });
});