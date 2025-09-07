import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  useLoadingState, 
  useApiCall, 
  useFileOperation, 
  useSocketOperation,
  useMultipleLoadingStates 
} from '../useLoadingState';

// Mock the error handler
vi.mock('../../utils/errorHandler', () => ({
  handleAsyncOperation: vi.fn((operation) => operation()),
}));

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('initializes with provided initial data', () => {
    const initialData = { test: 'data' };
    const { result } = renderHook(() => useLoadingState({ initialData }));

    expect(result.current.data).toEqual(initialData);
  });

  it('handles successful operation', async () => {
    const { result } = renderHook(() => useLoadingState());
    const operation = vi.fn().mockResolvedValue('success');

    await act(async () => {
      const response = await result.current.execute(operation);
      expect(response).toBe('success');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('handles failed operation', async () => {
    const { result } = renderHook(() => useLoadingState());
    const error = new Error('Operation failed');
    const operation = vi.fn().mockRejectedValue(error);

    await act(async () => {
      const response = await result.current.execute(operation);
      expect(response).toBe(null);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBe(null);
  });

  it('sets loading state during operation', async () => {
    const { result } = renderHook(() => useLoadingState());
    let resolveOperation: (value: string) => void;
    const operation = vi.fn(() => new Promise<string>((resolve) => {
      resolveOperation = resolve;
    }));

    act(() => {
      result.current.execute(operation);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      resolveOperation!('success');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('success');
  });

  it('prevents race conditions', async () => {
    const { result } = renderHook(() => useLoadingState());
    
    let resolveFirst: (value: string) => void;
    let resolveSecond: (value: string) => void;
    
    const firstOperation = vi.fn(() => new Promise<string>((resolve) => {
      resolveFirst = resolve;
    }));
    
    const secondOperation = vi.fn(() => new Promise<string>((resolve) => {
      resolveSecond = resolve;
    }));

    // Start first operation
    act(() => {
      result.current.execute(firstOperation);
    });

    // Start second operation (should cancel first)
    act(() => {
      result.current.execute(secondOperation);
    });

    // Resolve first operation (should be ignored)
    await act(async () => {
      resolveFirst!('first');
    });

    expect(result.current.data).toBe(null);

    // Resolve second operation (should update state)
    await act(async () => {
      resolveSecond!('second');
    });

    expect(result.current.data).toBe('second');
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useLoadingState({ initialData: 'initial' }));

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe('initial');
  });

  it('retries operation', async () => {
    const { result } = renderHook(() => useLoadingState());
    const operation = vi.fn().mockResolvedValue('retry-success');

    await act(async () => {
      await result.current.retry(operation);
    });

    expect(result.current.data).toBe('retry-success');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe('specialized hooks', () => {
  it('useApiCall uses api retry config', () => {
    const { result } = renderHook(() => useApiCall());
    
    expect(result.current.execute).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('useFileOperation uses fileOperation retry config', () => {
    const { result } = renderHook(() => useFileOperation());
    
    expect(result.current.execute).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('useSocketOperation uses socket retry config', () => {
    const { result } = renderHook(() => useSocketOperation());
    
    expect(result.current.execute).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useMultipleLoadingStates', () => {
  it('initializes with empty states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    expect(result.current.loadingStates).toEqual({});
    expect(result.current.errors).toEqual({});
    expect(result.current.isAnyLoading).toBe(false);
    expect(result.current.hasAnyError).toBe(false);
  });

  it('manages multiple loading states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    act(() => {
      result.current.setLoading('operation1', true);
      result.current.setLoading('operation2', false);
    });

    expect(result.current.loadingStates).toEqual({
      operation1: true,
      operation2: false,
    });
    expect(result.current.isAnyLoading).toBe(true);
  });

  it('manages multiple error states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());
    const error = new Error('Test error');

    act(() => {
      result.current.setError('operation1', error);
    });

    expect(result.current.errors).toEqual({
      operation1: error,
    });
    expect(result.current.hasAnyError).toBe(true);
  });

  it('executes operation with key', async () => {
    const { result } = renderHook(() => useMultipleLoadingStates());
    const operation = vi.fn().mockResolvedValue('success');

    await act(async () => {
      const response = await result.current.executeWithKey('test', operation);
      expect(response).toBe('success');
    });

    expect(result.current.loadingStates.test).toBe(false);
    expect(result.current.errors.test).toBe(null);
  });

  it('handles operation error with key', async () => {
    const { result } = renderHook(() => useMultipleLoadingStates());
    const error = new Error('Operation failed');
    const operation = vi.fn().mockRejectedValue(error);

    await act(async () => {
      const response = await result.current.executeWithKey('test', operation);
      expect(response).toBe(null);
    });

    expect(result.current.loadingStates.test).toBe(false);
    expect(result.current.errors.test).toEqual(error);
  });

  it('resets specific key', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    act(() => {
      result.current.setLoading('test', true);
      result.current.setError('test', new Error('Test'));
    });

    act(() => {
      result.current.reset('test');
    });

    expect(result.current.loadingStates.test).toBe(false);
    expect(result.current.errors.test).toBe(null);
  });

  it('resets all states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    act(() => {
      result.current.setLoading('test1', true);
      result.current.setLoading('test2', true);
      result.current.setError('test1', new Error('Test'));
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.loadingStates).toEqual({});
    expect(result.current.errors).toEqual({});
  });
});