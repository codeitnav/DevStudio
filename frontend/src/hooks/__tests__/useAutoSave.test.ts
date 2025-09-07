import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoSave } from '../useAutoSave';
import { fileService } from '../../services/fileService';

// Mock the file service
vi.mock('../../services/fileService', () => ({
  fileService: {
    saveFileContent: vi.fn()
  }
}));

describe('useAutoSave', () => {
  const mockProps = {
    roomId: 'room-1',
    fileId: 'file-1',
    content: 'initial content'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useAutoSave(mockProps));

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('detects unsaved changes when content changes', () => {
    const { result, rerender } = renderHook(
      (props) => useAutoSave(props),
      { initialProps: mockProps }
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    // Change content
    rerender({
      ...mockProps,
      content: 'modified content'
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('schedules auto-save when content changes', async () => {
    const { rerender } = renderHook(
      (props) => useAutoSave(props),
      { initialProps: mockProps }
    );

    // Change content
    rerender({
      ...mockProps,
      content: 'modified content'
    });

    // Fast-forward time to trigger auto-save
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fileService.saveFileContent).toHaveBeenCalledWith(
      'room-1',
      'file-1',
      'modified content'
    );
  });

  it('debounces multiple content changes', async () => {
    const { rerender } = renderHook(
      (props) => useAutoSave(props),
      { initialProps: mockProps }
    );

    // Make multiple rapid changes
    rerender({ ...mockProps, content: 'change 1' });
    rerender({ ...mockProps, content: 'change 2' });
    rerender({ ...mockProps, content: 'change 3' });

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Should only save once with the latest content
    expect(fileService.saveFileContent).toHaveBeenCalledTimes(1);
    expect(fileService.saveFileContent).toHaveBeenCalledWith(
      'room-1',
      'file-1',
      'change 3'
    );
  });

  it('respects custom delay', async () => {
    const { rerender } = renderHook(
      (props) => useAutoSave(props),
      { 
        initialProps: {
          ...mockProps,
          delay: 5000
        }
      }
    );

    rerender({
      ...mockProps,
      content: 'modified content',
      delay: 5000
    });

    // Should not save after 2 seconds
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(fileService.saveFileContent).not.toHaveBeenCalled();

    // Should save after 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(fileService.saveFileContent).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', async () => {
    const { rerender } = renderHook(
      (props) => useAutoSave(props),
      { 
        initialProps: {
          ...mockProps,
          enabled: false
        }
      }
    );

    rerender({
      ...mockProps,
      content: 'modified content',
      enabled: false
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fileService.saveFileContent).not.toHaveBeenCalled();
  });

  it('calls onSave callback on successful save', async () => {
    const onSave = vi.fn();
    const { rerender } = renderHook(
      (props) => useAutoSave(props),
      { 
        initialProps: {
          ...mockProps,
          onSave
        }
      }
    );

    rerender({
      ...mockProps,
      content: 'modified content',
      onSave
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onError callback on save failure', async () => {
    const onError = vi.fn();
    const saveError = new Error('Save failed');
    
    vi.mocked(fileService.saveFileContent).mockRejectedValueOnce(saveError);

    const { rerender } = renderHook(
      (props) => useAutoSave(props),
      { 
        initialProps: {
          ...mockProps,
          onError
        }
      }
    );

    rerender({
      ...mockProps,
      content: 'modified content',
      onError
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(onError).toHaveBeenCalledWith(saveError);
  });

  it('supports force save', async () => {
    const { result, rerender } = renderHook(
      (props) => useAutoSave(props),
      { initialProps: mockProps }
    );

    rerender({
      ...mockProps,
      content: 'modified content'
    });

    // Force save immediately
    await act(async () => {
      await result.current.save();
    });

    expect(fileService.saveFileContent).toHaveBeenCalledWith(
      'room-1',
      'file-1',
      'modified content'
    );
  });

  it('can cancel auto-save', async () => {
    const { result, rerender } = renderHook(
      (props) => useAutoSave(props),
      { initialProps: mockProps }
    );

    rerender({
      ...mockProps,
      content: 'modified content'
    });

    // Cancel before timeout
    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fileService.saveFileContent).not.toHaveBeenCalled();
  });

  it('prevents concurrent saves', async () => {
    const { result, rerender } = renderHook(
      (props) => useAutoSave(props),
      { initialProps: mockProps }
    );

    // Mock a slow save operation
    vi.mocked(fileService.saveFileContent).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    rerender({
      ...mockProps,
      content: 'modified content'
    });

    // Start first save
    const savePromise1 = act(async () => {
      await result.current.save();
    });

    // Try to start second save while first is in progress
    const savePromise2 = act(async () => {
      await result.current.save();
    });

    await Promise.all([savePromise1, savePromise2]);

    // Should only call save once
    expect(fileService.saveFileContent).toHaveBeenCalledTimes(1);
  });
});