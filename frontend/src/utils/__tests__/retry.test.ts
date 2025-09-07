import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, delay, RetryableError, RETRY_CONFIGS } from '../retry';
import { ErrorType } from '../../types/error';

describe('retry utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('delay', () => {
    it('resolves after specified time', async () => {
      const promise = delay(1000);
      
      vi.advanceTimersByTime(1000);
      
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('withRetry', () => {
    it('succeeds on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ type: ErrorType.NETWORK_ERROR })
        .mockResolvedValue('success');

      const promise = withRetry(operation, { delay: 1000 });

      // Fast-forward through the delay
      vi.advanceTimersByTime(1000);

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('does not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue({ type: ErrorType.VALIDATION_ERROR });

      await expect(withRetry(operation)).rejects.toEqual({ type: ErrorType.VALIDATION_ERROR });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('fails after max attempts', async () => {
      const error = { type: ErrorType.NETWORK_ERROR };
      const operation = vi.fn().mockRejectedValue(error);

      const promise = withRetry(operation, { maxAttempts: 3, delay: 100 });

      // Fast-forward through all retry delays
      vi.advanceTimersByTime(300); // 100 + 200 (backoff)

      await expect(promise).rejects.toBeInstanceOf(RetryableError);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('uses exponential backoff', async () => {
      const operation = vi.fn().mockRejectedValue({ type: ErrorType.NETWORK_ERROR });
      const onRetry = vi.fn();

      const promise = withRetry(operation, {
        maxAttempts: 3,
        delay: 100,
        backoffMultiplier: 2,
        onRetry,
      });

      // First retry after 100ms
      vi.advanceTimersByTime(100);
      expect(onRetry).toHaveBeenCalledWith(1, { type: ErrorType.NETWORK_ERROR });

      // Second retry after 200ms (100 * 2)
      vi.advanceTimersByTime(200);
      expect(onRetry).toHaveBeenCalledWith(2, { type: ErrorType.NETWORK_ERROR });

      await expect(promise).rejects.toBeInstanceOf(RetryableError);
    });

    it('respects max delay', async () => {
      const operation = vi.fn().mockRejectedValue({ type: ErrorType.NETWORK_ERROR });

      const promise = withRetry(operation, {
        maxAttempts: 4,
        delay: 1000,
        backoffMultiplier: 10,
        maxDelay: 2000,
      });

      // First retry: 1000ms
      vi.advanceTimersByTime(1000);
      
      // Second retry: should be capped at 2000ms instead of 10000ms
      vi.advanceTimersByTime(2000);
      
      // Third retry: still capped at 2000ms
      vi.advanceTimersByTime(2000);

      await expect(promise).rejects.toBeInstanceOf(RetryableError);
      expect(operation).toHaveBeenCalledTimes(4);
    });

    it('uses custom retry condition', async () => {
      const operation = vi.fn().mockRejectedValue({ status: 404 });

      const retryCondition = (error: any) => error.status >= 500;

      await expect(withRetry(operation, { retryCondition })).rejects.toEqual({ status: 404 });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry callback', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ type: ErrorType.NETWORK_ERROR })
        .mockResolvedValue('success');
      const onRetry = vi.fn();

      const promise = withRetry(operation, { onRetry, delay: 100 });

      vi.advanceTimersByTime(100);

      await promise;

      expect(onRetry).toHaveBeenCalledWith(1, { type: ErrorType.NETWORK_ERROR });
    });
  });

  describe('RETRY_CONFIGS', () => {
    it('has api config', () => {
      expect(RETRY_CONFIGS.api).toBeDefined();
      expect(RETRY_CONFIGS.api.maxAttempts).toBe(3);
    });

    it('has socket config', () => {
      expect(RETRY_CONFIGS.socket).toBeDefined();
      expect(RETRY_CONFIGS.socket.maxAttempts).toBe(5);
    });

    it('has fileOperation config', () => {
      expect(RETRY_CONFIGS.fileOperation).toBeDefined();
      expect(RETRY_CONFIGS.fileOperation.maxAttempts).toBe(2);
    });

    it('has collaboration config', () => {
      expect(RETRY_CONFIGS.collaboration).toBeDefined();
      expect(RETRY_CONFIGS.collaboration.maxAttempts).toBe(3);
    });
  });

  describe('RetryableError', () => {
    it('creates error with correct properties', () => {
      const originalError = new Error('Original');
      const retryableError = new RetryableError('Retry failed', originalError, 3, 3);

      expect(retryableError.message).toBe('Retry failed');
      expect(retryableError.originalError).toBe(originalError);
      expect(retryableError.attempt).toBe(3);
      expect(retryableError.maxAttempts).toBe(3);
      expect(retryableError.name).toBe('RetryableError');
    });
  });
});