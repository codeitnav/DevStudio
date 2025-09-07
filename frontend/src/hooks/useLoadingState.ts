import { useState, useCallback, useRef } from 'react';
import { handleAsyncOperation, ErrorHandlerOptions } from '../utils/errorHandler';
import { RETRY_CONFIGS } from '../utils/retry';

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

export interface UseLoadingStateOptions extends ErrorHandlerOptions {
  retryConfig?: keyof typeof RETRY_CONFIGS;
  initialData?: any;
}

export function useLoadingState<T = any>(options: UseLoadingStateOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(options.initialData || null);
  
  // Keep track of the current operation to prevent race conditions
  const currentOperationRef = useRef<symbol | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    operationOptions: UseLoadingStateOptions = {}
  ): Promise<T | null> => {
    const operationId = Symbol('operation');
    currentOperationRef.current = operationId;

    setIsLoading(true);
    setError(null);

    try {
      const result = await handleAsyncOperation(operation, {
        ...options,
        ...operationOptions,
      });

      // Only update state if this is still the current operation
      if (currentOperationRef.current === operationId) {
        setData(result);
        setIsLoading(false);
        return result;
      }
      
      return null;
    } catch (err) {
      // Only update state if this is still the current operation
      if (currentOperationRef.current === operationId) {
        setError(err as Error);
        setIsLoading(false);
      }
      return null;
    }
  }, [options]);

  const reset = useCallback(() => {
    currentOperationRef.current = null;
    setIsLoading(false);
    setError(null);
    setData(options.initialData || null);
  }, [options.initialData]);

  const retry = useCallback(async (
    operation: () => Promise<T>,
    operationOptions?: UseLoadingStateOptions
  ) => {
    return execute(operation, operationOptions);
  }, [execute]);

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
    retry,
  };
}

// Specialized hook for API calls
export function useApiCall<T = any>(options: UseLoadingStateOptions = {}) {
  return useLoadingState<T>({
    retryConfig: 'api',
    ...options,
  });
}

// Specialized hook for file operations
export function useFileOperation<T = any>(options: UseLoadingStateOptions = {}) {
  return useLoadingState<T>({
    retryConfig: 'fileOperation',
    ...options,
  });
}

// Specialized hook for socket operations
export function useSocketOperation<T = any>(options: UseLoadingStateOptions = {}) {
  return useLoadingState<T>({
    retryConfig: 'socket',
    ...options,
  });
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, Error | null>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const setError = useCallback((key: string, error: Error | null) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const executeWithKey = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    options: UseLoadingStateOptions = {}
  ): Promise<T | null> => {
    setLoading(key, true);
    setError(key, null);

    try {
      const result = await handleAsyncOperation(operation, options);
      setLoading(key, false);
      return result;
    } catch (err) {
      setError(key, err as Error);
      setLoading(key, false);
      return null;
    }
  }, [setLoading, setError]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const hasAnyError = Object.values(errors).some(Boolean);

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      setErrors(prev => ({ ...prev, [key]: null }));
    } else {
      setLoadingStates({});
      setErrors({});
    }
  }, []);

  return {
    loadingStates,
    errors,
    isAnyLoading,
    hasAnyError,
    setLoading,
    setError,
    executeWithKey,
    reset,
  };
}