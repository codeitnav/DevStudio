import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback, useBatchedUpdates } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'first', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    rerender({ value: 'second', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current).toBe('second');
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce callback execution', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => 
      useDebouncedCallback(mockCallback, 500)
    );

    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('arg3');
  });

  it('should update callback reference', () => {
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 500),
      {
        initialProps: { callback: mockCallback1 },
      }
    );

    act(() => {
      result.current('test');
    });

    rerender({ callback: mockCallback2 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockCallback1).not.toHaveBeenCalled();
    expect(mockCallback2).toHaveBeenCalledWith('test');
  });

  it('should cleanup timeout on unmount', () => {
    const mockCallback = vi.fn();
    const { result, unmount } = renderHook(() => 
      useDebouncedCallback(mockCallback, 500)
    );

    act(() => {
      result.current('test');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockCallback).not.toHaveBeenCalled();
  });
});

describe('useBatchedUpdates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should batch multiple updates', () => {
    const mockOnUpdate = vi.fn();
    const { result } = renderHook(() => 
      useBatchedUpdates(mockOnUpdate, 100)
    );

    act(() => {
      result.current.addUpdate('update1');
      result.current.addUpdate('update2');
      result.current.addUpdate('update3');
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith(['update1', 'update2', 'update3']);
  });

  it('should flush updates immediately', () => {
    const mockOnUpdate = vi.fn();
    const { result } = renderHook(() => 
      useBatchedUpdates(mockOnUpdate, 100)
    );

    act(() => {
      result.current.addUpdate('update1');
      result.current.addUpdate('update2');
      result.current.flush();
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith(['update1', 'update2']);

    // Should not call again after timeout
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
  });

  it('should handle empty updates gracefully', () => {
    const mockOnUpdate = vi.fn();
    const { result } = renderHook(() => 
      useBatchedUpdates(mockOnUpdate, 100)
    );

    act(() => {
      result.current.flush();
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should cleanup timeout on unmount', () => {
    const mockOnUpdate = vi.fn();
    const { result, unmount } = renderHook(() => 
      useBatchedUpdates(mockOnUpdate, 100)
    );

    act(() => {
      result.current.addUpdate('update1');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});